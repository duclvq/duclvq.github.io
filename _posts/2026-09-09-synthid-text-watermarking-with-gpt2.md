---
layout: post
title: "Making a text watermark visible with GPT-2 and SynthID"
date: 2026-09-09 22:50:00 +0700
description: "I built a local lab to generate, inspect, and detect SynthID-watermarked text—and to compare the server workflow with browser-native WebGPU inference."
demo_url: /lab/synthid-text-watermarking-with-gpt2/demo/
tags: [llm, watermarking, synthid, webgpu]
---

Text watermarking is easy to describe and surprisingly difficult to develop an
intuition for. There is no visible stamp in the output. The signal is introduced
while tokens are sampled, then recovered statistically from a long enough piece
of text.

I built **SynthID Text Lab** to make that process tangible: generate a passage,
copy it, paste it into a detector, and inspect the resulting score.

## Try the interactive WebGPU demo

The public browser edition runs **SmolLM2 135M Instruct** locally through
Transformers.js and WebGPU. It does not need my Python server, and your prompt
stays in your browser. Its q4f16 model download is about **112 MB**, replacing
the original 2.7 GB NanoChat download with a much more practical web experience.

<p><a class="button primary" href="/lab/synthid-text-watermarking-with-gpt2/demo/">Launch the WebGPU demo →</a></p>

The browser output is deliberately unwatermarked because public JavaScript cannot
protect a SynthID key. You can also [open the interactive SynthID mechanism
visualization](/lab/synthid-text-watermarking-with-gpt2/how-it-works/).

![SynthID Text Lab interface showing the generation and detection workflow]({{ '/assets/lab/synthid-text-lab.png' | relative_url }})

*The local interface exposes the full generate → copy → paste → detect loop.*

## The question

Can I build a small, inspectable implementation that demonstrates both sides of
a text watermark without pretending that a demo detector is production-ready?

I wanted the experiment to answer three practical questions:

1. How does SynthID influence GPT-2 generation?
2. Can the same configuration detect a generated passage after it is copied and pasted?
3. Which parts can safely run in a browser, and which must remain server-side?

## What I built

The Python path uses **GPT-2** from `openai-community/gpt2` with Hugging Face's
`SynthIDTextWatermarkingConfig`. The service lazy-loads the model, chooses Apple
MPS, CUDA, or CPU, and exposes Flask endpoints for generation and detection.
Generation can be repeated with a fixed seed and run with the watermark either
on or off.

For detection, the lab recomputes SynthID's context-dependent binary g-values.
It removes end-of-sequence and repeated-context positions, calculates their mean,
and reports a transparent normal-approximation z-score. The demo currently uses
a threshold of **3.0**.

The original experiment used **NanoChat d32** for browser inference. The public
demo now uses **SmolLM2 135M Instruct** through Transformers.js and WebGPU in a
module Web Worker. That keeps generation off the Flask backend, leaves the UI
responsive, and cuts the first-run download by roughly 24×.

There is one deliberate security boundary: browser WebGPU generations are
**not watermarked**. Shipping the keyed g-function to client-side JavaScript
would disclose the watermark key to every visitor. The complete SynthID workflow
therefore stays in the Python backend.

## A verified smoke run

I exercised the running HTTP service on Apple MPS with the same prompt, seed,
temperature, and output length for both conditions. Each continuation contained
160 generated tokens.

| Generation condition | Detector verdict after paste-back | z-score |
| --- | --- | ---: |
| SynthID enabled | Watermarked | **13.7406** |
| SynthID disabled | Not watermarked | **0.5627** |

The generate and detect endpoints both returned HTTP 200, and the end-to-end
assertions passed. This is a **single smoke run**, not an accuracy benchmark. It
shows that the implemented path works for this controlled pair; it does not
establish false-positive or false-negative rates.

## Verification around the experiment

The current implementation also passed:

- **19 Python tests** covering request validation, device selection, scoring,
  Flask routes, model-asset behavior, and the visual explainer;
- **4 JavaScript tests** for WebGPU capability checks, generation options,
  output extraction, and detector-response validation;
- **4 Playwright tests** exercising the browser WebGPU worker and UI state;
- an end-to-end HTTP smoke test for watermarked and unwatermarked paste-back detection.

The interface also contains a separate full-page visualization that explains
how the keyed sampling signal becomes a statistical detector score.

## What this experiment clarified

A watermark is not a post-processing label. SynthID biases token sampling using
a context-dependent keyed function, so the generated passage carries a weak
signal distributed across many token decisions.

That has two consequences. First, detection needs enough usable token contexts;
short or repetitive text is inherently less informative. Second, a believable
production detector needs calibration on representative data rather than a
single universal threshold.

The browser comparison exposed another useful distinction: local inference and
secure keyed watermarking are separate deployment problems. A model can run
privately in a browser, but a secret detector key cannot safely be embedded in
the same public JavaScript bundle.

## Limitations

This remains an educational implementation:

- The watermark configuration is public and deterministic rather than secret.
- The detector uses a reference mean-score statistic, not a trained Bayesian detector.
- The normal approximation treats layer g-values as Bernoulli samples and is useful
  for inspection, not as a production guarantee.
- Short passages, low-entropy outputs, translation, and extensive rewriting can
  weaken the detectable signal.
- A detector result is statistical evidence, not proof of authorship.

Hugging Face recommends training and calibrating a Bayesian detector on at least
10,000 examples for a production-style deployment. The next meaningful step is
therefore an evaluation set that measures detection quality across models,
lengths, temperatures, and transformation attacks—not just more hand-picked demos.

## References

- [Introducing SynthID Text — Hugging Face](https://huggingface.co/blog/synthid-text)
- [Scalable watermarking for identifying large language model outputs — Nature](https://www.nature.com/articles/s41586-024-08025-4)
- [NanoChat by Andrej Karpathy](https://github.com/karpathy/nanochat)
- [NanoChat d32 ONNX/WebGPU conversion](https://huggingface.co/onnx-community/nanochat-d32-ONNX)
- [SmolLM2 135M Instruct](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct)
- [SmolLM2 135M ONNX/WebGPU conversion](https://huggingface.co/onnx-community/SmolLM2-135M-Instruct-ONNX-GQA)
