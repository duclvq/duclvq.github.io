import { hasWebGPU } from "./webgpu-runtime.mjs";

const $ = (selector) => document.querySelector(selector);
const prompt = $("#prompt");
const maxTokens = $("#maxTokens");
const temperature = $("#temperature");
const generateBtn = $("#generateBtn");
const output = $("#generatedOutput");
const copyBtn = $("#copyBtn");
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

function setBusy(busy) {
  generateBtn.disabled = busy;
  generateBtn.querySelector("span:first-child").textContent = busy ? "Working locally…" : "Generate with WebGPU";
}

function clearOutput(message = "Your SmolLM2 response will appear here.") {
  lastContinuation = "";
  output.textContent = message;
  output.classList.add("empty");
  copyBtn.disabled = true;
}

function progressLabel(progress) {
  if (!progress || typeof progress !== "object") return "Downloading SmolLM2 135M…";
  if (progress.status === "progress" && Number.isFinite(progress.progress)) {
    return `Downloading ${progress.file ?? "model file"} · ${Math.round(progress.progress)}%`;
  }
  if (progress.file) return `Loading ${progress.file}…`;
  return "Preparing SmolLM2 135M on WebGPU…";
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
      else request.reject(new Error(message.message || "WebGPU generation failed."));
    }
  });
  browserWorker.addEventListener("error", (event) => {
    terminateWorker(new Error(event.message || "The WebGPU worker failed to load."));
  });
  browserWorker.addEventListener("messageerror", () => {
    terminateWorker(new Error("The WebGPU worker returned an unreadable message."));
  });
  return browserWorker;
}

function generate(values) {
  if (!hasWebGPU(window)) {
    throw new Error("WebGPU is unavailable in this browser.");
  }
  const id = ++requestCounter;
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      if (!pendingRequests.has(id)) return;
      terminateWorker(new Error("WebGPU generation timed out after 30 minutes."));
    }, REQUEST_TIMEOUT_MS);
    pendingRequests.set(id, { resolve, reject, timeoutId });
    getWorker().postMessage({ id, type: "generate", ...values });
  });
}

generateBtn.addEventListener("click", async () => {
  const values = {
    prompt: prompt.value.trim(),
    maxTokens: Number(maxTokens.value),
    temperature: Number(temperature.value),
  };
  if (!values.prompt) {
    showToast("Enter a prompt first.", true);
    prompt.focus();
    return;
  }

  setBusy(true);
  clearOutput("Preparing the model and generation…");
  setStatus("Starting browser WebGPU…");
  try {
    const result = await generate(values);
    lastContinuation = result.continuation;
    output.textContent = result.continuation;
    output.classList.remove("empty");
    copyBtn.disabled = false;
    setStatus("SmolLM2 135M · running locally on WebGPU", "loaded");
  } catch (error) {
    clearOutput("Generation did not complete. Check browser compatibility and try again.");
    setStatus("Generation failed", "error");
    showToast(error.message, true);
  } finally {
    setBusy(false);
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(lastContinuation);
    showToast("Generated continuation copied.");
  } catch {
    showToast("Clipboard access was denied. Select and copy the text manually.", true);
  }
});

maxTokens.addEventListener("input", () => {
  $("#lengthValue").textContent = `${maxTokens.value} tokens`;
});
temperature.addEventListener("input", () => {
  $("#tempValue").textContent = Number(temperature.value).toFixed(1);
});

if (hasWebGPU(window)) {
  setBusy(false);
  $("#compatibility").textContent = "WebGPU detected. Model execution stays in this browser.";
  setStatus("WebGPU ready · model not downloaded", "ready");
} else {
  generateBtn.disabled = true;
  $("#compatibility").innerHTML = "WebGPU is unavailable. Try a current version of Chrome, Edge, or Safari on supported hardware.";
  setStatus("WebGPU unavailable", "error");
}
