# duclvq.github.io

Personal website for **Le Viet Duc**, published with GitHub Pages at [duclvq.github.io](https://duclvq.github.io).

## Navigation

The site intentionally uses a minimal structure:

- **Home** — introduction and latest Lab entries
- **Lab** — experiments, technology notes, and build logs
- **Projects** — curated pet projects
- **About** — background and contact information

## Publish a Markdown Lab entry

Articles are normal Markdown files stored in `_posts/`. GitHub Pages rebuilds the website automatically after a commit reaches `main`.

### From the GitHub web editor

1. Open the [`_posts`](https://github.com/duclvq/duclvq.github.io/tree/main/_posts) directory.
2. Select **Add file → Create new file**.
3. Name the file `_posts/YYYY-MM-DD-title.md`, for example `_posts/2026-09-10-testing-a-local-model.md`.
4. Copy the front matter below, then write the article in Markdown.
5. Select **Commit changes**. GitHub Pages will publish it under `/lab/title/`.

```markdown
---
layout: post
title: "Testing a local model"
date: 2026-09-10 09:00:00 +0700
description: "What I tested and what happened."
tags: [ai, experiment]
---

Start writing here.

## Setup

Markdown content...

## Results

Markdown content...
```

### From a local checkout

Create `_posts/YYYY-MM-DD-title.md`, then run:

```bash
git add _posts/YYYY-MM-DD-title.md
git commit -m "post: publish article title"
git push origin main
```

An unpublished writing template is available at `_drafts/article-template.md`.

## Interactive Lab entries

Lab posts should keep a working interactive browser experience whenever the experiment can run safely on GitHub Pages. Put the demo under `/lab/<article-slug>/demo/`, set `demo_url` in the post front matter, and keep a clear fallback explanation when the required capability is unavailable. The homepage and Lab index automatically show a **Live demo** link when `demo_url` is present.

Do not move private keys or server-only credentials into browser JavaScript merely to make a demo static. When the complete experiment needs a backend, preserve a safe browser-side subset or explainer and clearly label what it does not reproduce.

## Supported Markdown

GitHub Pages renders headings, links, images, lists, blockquotes, fenced code blocks, inline code, and tables through Jekyll and Kramdown.
