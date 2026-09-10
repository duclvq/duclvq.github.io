---
layout: post
title: "Two ways to serve the same local LLM"
date: 2026-09-10 11:40:00 +0700
description: "A short concurrency experiment: llama.cpp and vLLM feel the same to one user, but not to a small crowd."
tags: [llm, benchmark, inference, gpu]
---

I put two local LLM servers on the same GPU: **llama.cpp** and **vLLM**. Both served the same 27B Qwen-family model, with roughly 512 input tokens and 256 generated tokens per request. The useful question was not which one won a one-user speed test—it was what happened when other people arrived.

| concurrent users | llama.cpp / user | vLLM / user |
|---|---:|---:|
| 1 | 29.0 tok/s | 28.9 tok/s |
| 4 | 16.7 tok/s | 25.3 tok/s |
| 16 | 6.5 tok/s | 18.8 tok/s |
| 24 | 5.3 tok/s | 13.2 tok/s |

For a single request, they were effectively tied. Under load, vLLM's continuous batching made the difference: at 16 simultaneous users it still delivered text at a comfortable reading pace, while llama.cpp fell below it.

There is a trade-off. The vLLM configuration could admit only 12 sequences on this 24 GB card, so callers beyond that limit waited for a slot before receiving their first token. llama.cpp accepted all 24 immediately, but made every caller slower.

The lesson is simple: **single-stream token speed is not capacity planning**. For a personal endpoint or one active user, llama.cpp remains wonderfully direct. For a shared service, measure per-user speed and time to first token while the queue is full—those are the numbers people actually feel.
