import { hasWebGPU } from "./webgpu-runtime.mjs";

const $ = (selector) => document.querySelector(selector);
const prompt = $("#prompt");
const maxTokens = $("#maxTokens");
const temperature = $("#temperature");
const watermark = $("#watermark");
const generateBtn = $("#generateBtn");
const output = $("#generatedOutput");
const copyBtn = $("#copyBtn");
const sendBtn = $("#sendToDetectorBtn");
const detectText = $("#detectText");
const detectBtn = $("#detectBtn");
const toast = $("#toast");
let browserWorker;
let lastContinuation = "";
let requestCounter = 0;
const pendingRequests = new Map();
const REQUEST_TIMEOUT_MS = 30 * 60 * 1000;

function showToast(message, error = false) {
  toast.textContent = message;
  toast.classList.toggle("error", error);
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 4200);
}

function setStatus(message, state = "loading") {
  $("#statusDot").className = state;
  $("#statusText").textContent = message;
}

function setGenerateBusy(busy) {
  generateBtn.disabled = busy;
  watermark.disabled = busy;
  generateBtn.querySelector("span:first-child").textContent = busy ? "Working locally…" : "Generate with WebGPU";
}

function setDetectBusy(busy) {
  detectBtn.disabled = busy;
  detectBtn.querySelector("span:first-child").textContent = busy ? "Analyzing locally…" : "Analyze watermark signal";
}

function clearOutput(message = "Your SmolLM2 response will appear here.") {
  lastContinuation = "";
  output.textContent = message;
  output.classList.add("empty");
  copyBtn.disabled = true;
  sendBtn.disabled = true;
}

function clearVerdict() {
  $("#verdictContent").classList.add("hidden");
  $("#verdictEmpty").classList.remove("hidden");
  $("#signalTrace").replaceChildren();
}

function progressLabel(progress) {
  if (!progress || typeof progress !== "object") return "Downloading browser assets…";
  if (progress.status === "progress" && Number.isFinite(progress.progress)) {
    return `Downloading ${progress.file ?? "model file"} · ${Math.round(progress.progress)}%`;
  }
  if (progress.file) return `Loading ${progress.file}…`;
  return "Preparing the browser runtime…";
}

function rejectPending(error) {
  for (const request of pendingRequests.values()) {
    window.clearTimeout(request.timeoutId);
    request.reject(error);
  }
  pendingRequests.clear();
}

function terminateWorker(error) {
  rejectPending(error);
  browserWorker?.terminate();
  browserWorker = undefined;
}

function getWorker() {
  if (browserWorker) return browserWorker;
  browserWorker = new Worker(new URL("./webgpu-worker.js", import.meta.url), { type: "module" });
  browserWorker.addEventListener("message", (event) => {
    const message = event.data ?? {};
    if (message.type === "progress" && pendingRequests.has(message.id)) setStatus(progressLabel(message.progress));
    if (message.type === "status" && pendingRequests.has(message.id)) setStatus(message.message);
    if (message.type === "result" || message.type === "error") {
      const request = pendingRequests.get(message.id);
      if (!request) return;
      pendingRequests.delete(message.id);
      window.clearTimeout(request.timeoutId);
      if (message.type === "result") request.resolve(message.result);
      else request.reject(new Error(message.message || "The browser worker failed."));
    }
  });
  browserWorker.addEventListener("error", (event) => {
    terminateWorker(new Error(event.message || "The browser worker failed to load."));
  });
  browserWorker.addEventListener("messageerror", () => {
    terminateWorker(new Error("The browser worker returned an unreadable message."));
  });
  return browserWorker;
}

function requestWorker(type, payload) {
  const id = ++requestCounter;
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      if (!pendingRequests.has(id)) return;
      terminateWorker(new Error("The browser operation timed out after 30 minutes."));
    }, REQUEST_TIMEOUT_MS);
    pendingRequests.set(id, { resolve, reject, timeoutId });
    getWorker().postMessage({ id, type, ...payload });
  });
}

function generate(values) {
  if (!hasWebGPU(window)) throw new Error("WebGPU is unavailable in this browser.");
  return requestWorker("generate", values);
}

function validateDetection(result) {
  for (const field of ["confidence", "z_score", "mean_g_score", "tokens_scored", "threshold"]) {
    if (!Number.isFinite(result?.[field])) throw new Error("The detector returned an invalid result.");
  }
  if (!Array.isArray(result.trace)) throw new Error("The detector returned an invalid signal trace.");
}

function renderTrace(trace) {
  const container = $("#signalTrace");
  container.replaceChildren();
  for (const row of trace.slice(-56)) {
    const item = document.createElement("div");
    item.className = `trace-token${row.scored ? "" : " skipped"}`;
    item.title = row.scored
      ? `${row.token} · mean g ${row.mean_g.toFixed(3)} · ${row.bits}`
      : `${row.token} · repeated context excluded`;

    const bar = document.createElement("span");
    bar.className = "trace-bar";
    bar.style.height = `${12 + row.mean_g * 42}px`;
    const label = document.createElement("small");
    label.textContent = row.token.replace(/\s/g, "·").slice(0, 8) || `#${row.token_id}`;
    item.append(bar, label);
    container.append(item);
  }
}

function renderVerdict(result) {
  validateDetection(result);
  $("#verdictEmpty").classList.add("hidden");
  $("#verdictContent").classList.remove("hidden");
  const detected = Boolean(result.is_watermarked);
  $("#verdictTitle").textContent = detected ? "Watermark signal detected" : "No watermark signal";
  $("#verdictTitle").classList.toggle("negative", !detected);
  $("#verdictDescription").textContent = detected
    ? "The passage crosses the public demo z-score threshold."
    : "The passage does not cross the public demo z-score threshold.";
  $("#zValue").textContent = result.z_score.toFixed(2);
  $("#meanValue").textContent = result.mean_g_score.toFixed(3);
  $("#tokensValue").textContent = result.tokens_scored;
  $("#thresholdValue").textContent = result.threshold.toFixed(2);
  const fill = $("#confidenceFill");
  fill.style.width = `${Math.max(2, Math.min(100, result.confidence * 100))}%`;
  fill.classList.toggle("negative", !detected);
  renderTrace(result.trace);
}

generateBtn.addEventListener("click", async () => {
  const values = {
    prompt: prompt.value.trim(),
    maxTokens: Number(maxTokens.value),
    temperature: Number(temperature.value),
    watermark: watermark.checked,
  };
  if (!values.prompt) {
    showToast("Enter a prompt first.", true);
    prompt.focus();
    return;
  }

  setGenerateBusy(true);
  clearOutput("Preparing the model and generation…");
  clearVerdict();
  setStatus("Starting browser WebGPU…");
  try {
    const result = await generate(values);
    lastContinuation = result.continuation;
    output.textContent = result.continuation;
    output.classList.remove("empty");
    copyBtn.disabled = false;
    sendBtn.disabled = false;
    if (result.detection) renderVerdict(result.detection);
    setStatus(
      `SmolLM2 135M · ${result.watermarkEnabled ? "public watermark applied" : "unwatermarked"}`,
      "loaded",
    );
  } catch (error) {
    clearOutput("Generation did not complete. Check browser compatibility and try again.");
    setStatus("Generation failed", "error");
    showToast(error.message, true);
  } finally {
    setGenerateBusy(false);
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(lastContinuation);
    showToast("Generated response copied.");
  } catch {
    showToast("Clipboard access was denied. Select and copy the text manually.", true);
  }
});

sendBtn.addEventListener("click", () => {
  detectText.value = lastContinuation;
  detectText.focus();
  detectText.scrollIntoView({ behavior: "smooth", block: "center" });
});

detectBtn.addEventListener("click", async () => {
  const text = detectText.value;
  clearVerdict();
  setDetectBusy(true);
  try {
    const result = await requestWorker("detect", { text });
    if (detectText.value !== text) return;
    renderVerdict(result);
    setStatus(`Signal trace ready · ${result.tokens_scored} tokens scored`, "loaded");
  } catch (error) {
    setStatus("Detection failed", "error");
    showToast(error.message, true);
  } finally {
    setDetectBusy(false);
  }
});

detectText.addEventListener("input", clearVerdict);
maxTokens.addEventListener("input", () => {
  $("#lengthValue").textContent = `${maxTokens.value} tokens`;
});
temperature.addEventListener("input", () => {
  $("#tempValue").textContent = Number(temperature.value).toFixed(1);
});

if (hasWebGPU(window)) {
  setGenerateBusy(false);
  $("#compatibility").textContent = "WebGPU detected. Generation, detection, and signal inspection stay in this browser.";
  setStatus("WebGPU ready · model not downloaded", "ready");
} else {
  generateBtn.disabled = true;
  watermark.disabled = true;
  $("#compatibility").textContent = "WebGPU generation is unavailable, but browser-side detection still works.";
  setStatus("Detector ready · WebGPU unavailable", "ready");
}
