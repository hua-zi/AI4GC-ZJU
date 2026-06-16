---
title: 'DAC-Bench: A Decision-Aware Benchmark for Compositional Mobile GUI Tasks'
date: Jun 2026
authorId: honghui-sheng-2025-22551298
links:
  - kind: code
    href: https://github.com/melonthrower/DAC-Bench
desc: >-
  830 episodes, 11,345 action steps across 35 apps, organized into Sequential,
  Conjunctive, Conditional, and Hierarchical graph structures, with weighted-LCS
  and decision-accuracy metrics that expose how current GUI agents struggle with
  long-horizon planning and conditional decision-making. Accepted to ACL 2026.
tags:
  - Mobile GUI Agent
  - Benchmark
  - Decision-Aware Evaluation
  - ACL 2026
---

## Background

Mobile GUI agents powered by large multimodal models can already perceive screens and follow instructions. Yet existing benchmarks largely stop at **short, linear workflows** and **step-level accuracy**, offering limited insight into long-horizon planning and decision-making under branching structures. We identify three limitations: limited instruction diversity (mostly template substitution / linear concatenation), overly sequential workflows (no conditional branching or fallback strategies), and narrow evaluation protocols (only step-level correctness or overall success).

## What is DAC-Bench

DAC-Bench is the first benchmark targeting **long-horizon, decision-aware** mobile GUI tasks:

- **Scale.** 830 task episodes, 11,345 action steps across 35 applications on both Android and iOS, with an average task depth of 13.3 steps.
- **Four graph-structured task types.** Sequential, Conjunctive, Conditional, and Hierarchical, reflecting real-world multi-step and branching interaction patterns.
- **Construction pipeline.** Human seeding + multi-LLM augmentation (GPT-4 / Claude / DeepSeek) + constraint induction + automated filtering and manual verification, using a mixture-of-generators strategy to balance executability and semantic diversity.

## Decision-aware metrics

Beyond standard step-level and success-rate metrics, we introduce:

- **Weighted Longest Common Subsequence** — a length-sensitive measure of long-horizon progress;
- **Decision Accuracy** — explicitly measuring whether branch nodes are taken correctly.

## Key findings

Systematic evaluation across 7 general-purpose, mobile-specialized, and reasoning agents shows substantial degradation compared to prior benchmarks: **success rates drop below 5% on 6–8 step tasks**, and **branch accuracy averages only 38%**, highlighting conditional decision-making as a core challenge. DAC-Bench thus serves as a challenging, diagnostic benchmark for advancing decision-aware mobile GUI agents.

Code and dataset: https://github.com/melonthrower/DAC-Bench
