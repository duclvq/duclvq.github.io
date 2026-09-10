const SAMPLING_TABLE_BASE64 = "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";

export const DEFAULT_SYNTHID_CONFIG = Object.freeze({
  ngramLength: 5,
  keys: Object.freeze([
    654, 400, 836, 123, 340, 443, 597, 160, 57, 29,
    791, 246, 925, 318, 704, 512, 88, 367, 949, 221,
    615, 73, 482, 808, 135, 690, 274, 901, 456, 332,
  ]),
  samplingTableSize: 65_536,
  threshold: 3,
  topK: 50,
});

const MULTIPLIER = 6_364_136_223_846_793_005n;
const INCREMENT = 1n;

function decodeSamplingTable(base64) {
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  const bits = new Uint8Array(bytes.length * 8);
  for (let index = 0; index < bits.length; index += 1) {
    bits[index] = (bytes[index >> 3] >> (index & 7)) & 1;
  }
  return bits;
}

const samplingTable = decodeSamplingTable(SAMPLING_TABLE_BASE64);

function int64(value) {
  return BigInt.asIntN(64, value);
}

function accumulateHash(currentHash, values) {
  let result = int64(currentHash);
  for (const value of values) {
    result = int64((result + BigInt(value)) * MULTIPLIER + INCREMENT);
  }
  return result;
}

function positiveModulo(value, divisor) {
  const remainder = value % divisor;
  return remainder < 0n ? remainder + divisor : remainder;
}

function contextHash(context) {
  return accumulateHash(1n, context);
}

function gValuesForNgram(ngram, config = DEFAULT_SYNTHID_CONFIG) {
  const ngramHash = accumulateHash(1n, ngram);
  return config.keys.map((key) => {
    const keyedHash = accumulateHash(ngramHash, [key]);
    const tableIndex = Number(positiveModulo(keyedHash, BigInt(config.samplingTableSize)));
    return samplingTable[tableIndex];
  });
}

function erf(value) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  const polynomial = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return sign * (1 - polynomial * Math.exp(-x * x));
}

function summarizeTrace(trace, config) {
  const scoredRows = trace.filter((row) => row.scored);
  const tokensScored = scoredRows.length;
  const depth = config.keys.length;
  if (tokensScored === 0) {
    return {
      isWatermarked: false,
      confidence: 0,
      zScore: 0,
      meanGScore: 0,
      tokensScored,
      depth,
      threshold: config.threshold,
    };
  }
  const total = scoredRows.reduce(
    (sum, row) => sum + row.gValues.reduce((rowSum, value) => rowSum + value, 0),
    0,
  );
  const meanGScore = total / (tokensScored * depth);
  const standardError = Math.sqrt(0.25 / (tokensScored * depth));
  const zScore = (meanGScore - 0.5) / standardError;
  const confidence = Math.max(0, Math.min(1, 0.5 * (1 + erf(zScore / Math.SQRT2))));
  return {
    isWatermarked: zScore >= config.threshold,
    confidence,
    zScore,
    meanGScore,
    tokensScored,
    depth,
    threshold: config.threshold,
  };
}

export function analyzeTokenIds(tokenIds, config = DEFAULT_SYNTHID_CONFIG) {
  const ids = Array.from(tokenIds, Number);
  if (ids.length < config.ngramLength) {
    throw new RangeError(`Provide at least ${config.ngramLength} tokens to inspect.`);
  }
  const seenContexts = new Set();
  const trace = [];
  for (let start = 0; start <= ids.length - config.ngramLength; start += 1) {
    const ngram = ids.slice(start, start + config.ngramLength);
    const context = ngram.slice(0, -1);
    const hash = contextHash(context).toString();
    const repeated = seenContexts.has(hash);
    seenContexts.add(hash);
    const gValues = gValuesForNgram(ngram, config);
    trace.push({
      index: start + config.ngramLength - 1,
      tokenId: ngram.at(-1),
      context,
      repeated,
      scored: !repeated,
      gValues,
      meanG: gValues.reduce((sum, value) => sum + value, 0) / gValues.length,
    });
  }
  return { ...summarizeTrace(trace, config), trace };
}

function topIndices(logits, count) {
  return Array.from({ length: logits.length }, (_, index) => index)
    .sort((left, right) => logits[right] - logits[left])
    .slice(0, Math.min(count, logits.length));
}

export function applyTopKWatermark(
  logits,
  inputIds,
  {
    topK = DEFAULT_SYNTHID_CONFIG.topK,
    watermark = true,
    seenContexts = new Set(),
    config = DEFAULT_SYNTHID_CONFIG,
  } = {},
) {
  const source = Float32Array.from(logits);
  const selected = topIndices(source, topK);
  const result = new Float32Array(source.length);
  result.fill(-Infinity);
  if (selected.length === 0) return result;

  const maxLogit = Math.max(...selected.map((index) => source[index]));
  const probabilities = selected.map((index) => Math.exp(source[index] - maxLogit));
  let probabilityTotal = probabilities.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < probabilities.length; index += 1) probabilities[index] /= probabilityTotal;

  const ids = Array.from(inputIds, Number);
  const context = ids.slice(-(config.ngramLength - 1));
  const hash = contextHash(context).toString();
  const repeated = seenContexts.has(hash);
  seenContexts.add(hash);

  if (watermark && context.length === config.ngramLength - 1 && !repeated) {
    const matrix = selected.map((tokenId) => gValuesForNgram([...context, tokenId], config));
    for (let depth = 0; depth < config.keys.length; depth += 1) {
      let gMass = 0;
      for (let index = 0; index < probabilities.length; index += 1) {
        gMass += matrix[index][depth] * probabilities[index];
      }
      for (let index = 0; index < probabilities.length; index += 1) {
        probabilities[index] *= 1 + matrix[index][depth] - gMass;
      }
    }
  }

  probabilityTotal = probabilities.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < selected.length; index += 1) {
    result[selected[index]] = Math.log(Math.max(probabilities[index] / probabilityTotal, Number.MIN_VALUE));
  }
  return result;
}
