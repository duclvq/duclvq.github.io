export const BROWSER_MODEL_ID = "onnx-community/SmolLM2-135M-Instruct-ONNX-GQA";

export function hasWebGPU(scope = globalThis) {
  return Boolean(scope?.navigator?.gpu);
}

export function buildGenerationOptions({ maxTokens, temperature }) {
  const tokenCount = Number(maxTokens);
  const sampleTemperature = Number(temperature);

  if (!Number.isInteger(tokenCount) || tokenCount < 1 || tokenCount > 300) {
    throw new RangeError("maxTokens must be an integer between 1 and 300.");
  }
  if (!Number.isFinite(sampleTemperature) || sampleTemperature <= 0 || sampleTemperature > 2) {
    throw new RangeError("temperature must be greater than 0 and at most 2.");
  }

  return {
    max_new_tokens: tokenCount,
    do_sample: true,
    temperature: sampleTemperature,
    top_k: 50,
    repetition_penalty: 1.1,
    return_full_text: false,
  };
}

export function extractAssistantText(generatedText) {
  if (Array.isArray(generatedText)) {
    const assistantMessages = generatedText.filter((message) => message?.role === "assistant");
    const content = assistantMessages.at(-1)?.content;
    if (content === undefined) return "";
    if (typeof content !== "string") {
      throw new Error("The browser model returned an unexpected assistant message.");
    }
    return content;
  }
  if (typeof generatedText !== "string") {
    throw new Error("The browser model returned an unexpected generated_text value.");
  }
  return generatedText;
}
