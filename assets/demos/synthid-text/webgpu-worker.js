// Public browser demo: NanoChat d32 runs locally through Transformers.js + WebGPU.
import { env, pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0";
import {
  BROWSER_MODEL_ID,
  buildGenerationOptions,
  extractAssistantText,
} from "./webgpu-runtime.mjs";

let generatorPromise;

env.allowRemoteModels = true;
env.useBrowserCache = true;

function send(type, payload = {}) {
  self.postMessage({ type, ...payload });
}

async function getGenerator(id) {
  if (!self.navigator?.gpu) {
    throw new Error("WebGPU is unavailable. Use a current version of Chrome, Edge, or Safari on supported hardware.");
  }

  if (!generatorPromise) {
    send("status", { id, message: "Preparing WebGPU and downloading NanoChat d32…" });
    generatorPromise = pipeline("text-generation", BROWSER_MODEL_ID, {
      device: "webgpu",
      dtype: "q4",
      progress_callback: (progress) => send("progress", { id, progress }),
    }).catch((error) => {
      generatorPromise = undefined;
      throw error;
    });
  }
  return generatorPromise;
}

self.addEventListener("message", async (event) => {
  const { id, type, prompt, maxTokens, temperature } = event.data ?? {};
  if (type !== "generate") return;

  try {
    const generator = await getGenerator(id);
    send("status", { id, message: "Generating with NanoChat d32 on WebGPU…" });
    const options = buildGenerationOptions({ maxTokens, temperature });
    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ];
    const rows = await generator(messages, options);
    if (!Array.isArray(rows) || rows.length === 0 || !("generated_text" in rows[0])) {
      throw new Error("NanoChat returned an unexpected generation result.");
    }
    const continuation = extractAssistantText(rows[0].generated_text);
    if (!continuation.trim()) {
      throw new Error("NanoChat returned an empty generation result.");
    }
    send("result", {
      id,
      result: {
        continuation,
        model: BROWSER_MODEL_ID,
        device: "webgpu",
        watermarkEnabled: false,
      },
    });
  } catch (error) {
    send("error", {
      id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
