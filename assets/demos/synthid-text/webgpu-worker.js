// Public browser demo: SmolLM2 135M plus an educational SynthID-compatible signal.
import {
  AutoTokenizer,
  env,
  LogitsProcessor,
  LogitsProcessorList,
  pipeline,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0";
import {
  BROWSER_MODEL_ID,
  buildGenerationOptions,
  extractAssistantText,
} from "./webgpu-runtime.mjs";
import {
  analyzeTokenIds,
  applyTopKWatermark,
} from "./synthid-demo.mjs";

let generatorPromise;
let tokenizerPromise;

env.allowRemoteModels = true;
env.useBrowserCache = true;

function send(type, payload = {}) {
  self.postMessage({ type, ...payload });
}

async function getTokenizer(id) {
  if (!tokenizerPromise) {
    send("status", { id, message: "Loading the SmolLM2 tokenizer…" });
    tokenizerPromise = AutoTokenizer.from_pretrained(BROWSER_MODEL_ID, {
      progress_callback: (progress) => send("progress", { id, progress }),
    }).catch((error) => {
      tokenizerPromise = undefined;
      throw error;
    });
  }
  return tokenizerPromise;
}

async function getGenerator(id) {
  if (!self.navigator?.gpu) {
    throw new Error("WebGPU is unavailable. Use a current version of Chrome, Edge, or Safari on supported hardware.");
  }

  if (!generatorPromise) {
    send("status", { id, message: "Preparing WebGPU and downloading SmolLM2 135M…" });
    generatorPromise = pipeline("text-generation", BROWSER_MODEL_ID, {
      device: "webgpu",
      dtype: "q4f16",
      progress_callback: (progress) => send("progress", { id, progress }),
    }).catch((error) => {
      generatorPromise = undefined;
      throw error;
    });
  }
  return generatorPromise;
}

class DemoSynthIDLogitsProcessor extends LogitsProcessor {
  constructor(watermark) {
    super();
    this.watermark = watermark;
    this.seenContexts = new Set();
  }

  _call(inputIds, logits) {
    if (inputIds.length !== 1) throw new Error("The public watermark demo supports one generation at a time.");
    const updated = applyTopKWatermark(logits.data, inputIds[0], {
      watermark: this.watermark,
      seenContexts: this.seenContexts,
    });
    logits.data.set(updated);
    return logits;
  }
}

function generationProcessors(watermark) {
  const processors = new LogitsProcessorList();
  processors.push(new DemoSynthIDLogitsProcessor(watermark));
  return processors;
}

function tokenIdsForText(tokenizer, text) {
  const encoded = tokenizer(text, {
    add_special_tokens: false,
    truncation: true,
    max_length: 2_048,
  });
  return Array.from(encoded.input_ids.data, Number);
}

function decodeToken(tokenizer, tokenId) {
  try {
    return tokenizer.decode([BigInt(tokenId)], {
      skip_special_tokens: false,
      clean_up_tokenization_spaces: false,
    }) || `#${tokenId}`;
  } catch {
    return `#${tokenId}`;
  }
}

function inspectText(tokenizer, text) {
  const cleanText = String(text ?? "").trim();
  if (!cleanText) throw new Error("Enter or paste text to inspect.");
  const tokenIds = tokenIdsForText(tokenizer, cleanText);
  const analysis = analyzeTokenIds(tokenIds);
  return {
    is_watermarked: analysis.isWatermarked,
    confidence: analysis.confidence,
    z_score: analysis.zScore,
    mean_g_score: analysis.meanGScore,
    tokens_scored: analysis.tokensScored,
    depth: analysis.depth,
    threshold: analysis.threshold,
    total_tokens: tokenIds.length,
    detector: "SynthID g-values + reference mean score (public educational key)",
    trace: analysis.trace.slice(-80).map((row) => ({
      index: row.index,
      token_id: row.tokenId,
      token: decodeToken(tokenizer, row.tokenId),
      mean_g: row.meanG,
      scored: row.scored,
      repeated: row.repeated,
      bits: row.gValues.join(""),
    })),
  };
}

self.addEventListener("message", async (event) => {
  const { id, type, prompt, maxTokens, temperature, watermark, text } = event.data ?? {};
  if (type !== "generate" && type !== "detect") return;

  try {
    if (type === "detect") {
      const tokenizer = await getTokenizer(id);
      send("status", { id, message: "Extracting the public SynthID signal trace…" });
      send("result", { id, result: inspectText(tokenizer, text) });
      return;
    }

    const generator = await getGenerator(id);
    send("status", { id, message: `Generating with SmolLM2 135M${watermark ? " + public watermark" : ""}…` });
    const options = {
      ...buildGenerationOptions({ maxTokens, temperature }),
      logits_processor: generationProcessors(Boolean(watermark)),
    };
    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ];
    const rows = await generator(messages, options);
    if (!Array.isArray(rows) || rows.length === 0 || !("generated_text" in rows[0])) {
      throw new Error("SmolLM2 returned an unexpected generation result.");
    }
    const continuation = extractAssistantText(rows[0].generated_text);
    if (!continuation.trim()) {
      throw new Error("SmolLM2 returned an empty generation result.");
    }
    let detection = null;
    try {
      detection = inspectText(generator.tokenizer, continuation);
    } catch {
      // Very short generations can be returned before five scoreable tokens exist.
    }
    send("result", {
      id,
      result: {
        continuation,
        model: BROWSER_MODEL_ID,
        device: "webgpu",
        watermarkEnabled: Boolean(watermark),
        detection,
      },
    });
  } catch (error) {
    send("error", {
      id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
