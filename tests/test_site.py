from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class MarkdownPublishingTests(unittest.TestCase):
    def test_minimal_site_sections_and_markdown_pipeline_exist(self):
        required = [
            "_config.yml",
            "_layouts/default.html",
            "_layouts/post.html",
            "lab/index.html",
            "projects/index.html",
            "about/index.html",
            "_posts/2026-09-09-welcome-to-my-lab.md",
        ]
        missing = [path for path in required if not (ROOT / path).is_file()]
        self.assertEqual([], missing, f"Missing site files: {missing}")

    def test_navigation_uses_the_minimal_tab_set(self):
        layout = (ROOT / "_layouts/default.html").read_text()
        for destination in ["/", "/lab/", "/projects/", "/about/"]:
            self.assertIn(f"'{destination}' | relative_url", layout)
        self.assertNotIn("/notes/", layout)
        self.assertIn("https://github.com/duclvq", layout)

    def test_about_page_has_contact_email(self):
        about = (ROOT / "about/index.html").read_text()
        self.assertIn("mailto:leduchtth@gmail.com", about)
        self.assertIn("leduchtth@gmail.com", about)

    def test_markdown_entries_render_in_lab_and_home(self):
        config = (ROOT / "_config.yml").read_text()
        lab = (ROOT / "lab/index.html").read_text()
        home = (ROOT / "index.html").read_text()
        post_layout = (ROOT / "_layouts/post.html").read_text()
        self.assertIn("permalink: /lab/:title/", config)
        self.assertIn("site.posts", lab)
        self.assertIn("{{ content }}", post_layout)
        self.assertTrue(home.startswith("---\n"), "Home must be processed by Jekyll")
        self.assertIn("site.posts", home)

    def test_example_entry_is_valid_markdown_with_front_matter(self):
        entry = (ROOT / "_posts/2026-09-09-welcome-to-my-lab.md").read_text()
        self.assertTrue(entry.startswith("---\n"))
        for field in ["layout: post", "title:", "date:", "description:", "tags:"]:
            self.assertIn(field, entry)
        self.assertIn("\n## ", entry)

    def test_authoring_template_and_instructions_exist(self):
        template_path = ROOT / "_drafts/article-template.md"
        stylesheet_path = ROOT / "assets/site.css"
        self.assertTrue(template_path.is_file())
        self.assertTrue(stylesheet_path.is_file())
        readme = (ROOT / "README.md").read_text()
        self.assertIn("_posts/YYYY-MM-DD-title.md", readme)
        self.assertIn("GitHub web editor", readme)
        layout = (ROOT / "_layouts/default.html").read_text()
        self.assertIn("/assets/site.css", layout)

    def test_mobile_layout_guards_against_horizontal_overflow(self):
        css = (ROOT / "assets/site.css").read_text()
        self.assertIn("overflow-x: hidden", css)
        self.assertIn("width: calc(100% - 40px)", css)
        self.assertIn("width: calc(100% - 32px)", css)
        self.assertIn("min-width: 0", css)

    def test_synthid_experiment_is_published_with_evidence(self):
        article_path = ROOT / "_posts/2026-09-09-synthid-text-watermarking-with-gpt2.md"
        image_path = ROOT / "assets/lab/synthid-text-lab.png"
        self.assertTrue(article_path.is_file())
        self.assertTrue(image_path.is_file())
        article = article_path.read_text()
        for evidence in [
            "GPT-2",
            "SynthID",
            "13.7406",
            "0.5627",
            "19 Python tests",
            "4 JavaScript tests",
            "4 Playwright tests",
            "single smoke run",
        ]:
            self.assertIn(evidence, article)

    def test_synthid_lab_keeps_an_interactive_webgpu_demo(self):
        demo_root = ROOT / "lab/synthid-text-watermarking-with-gpt2/demo"
        asset_root = ROOT / "assets/demos/synthid-text"
        required = [
            demo_root / "index.html",
            ROOT / "lab/synthid-text-watermarking-with-gpt2/how-it-works/index.html",
            asset_root / "app.css",
            asset_root / "app.js",
            asset_root / "webgpu-worker.js",
            asset_root / "webgpu-runtime.mjs",
            asset_root / "synthid-demo.mjs",
        ]
        missing = [str(path.relative_to(ROOT)) for path in required if not path.is_file()]
        self.assertEqual([], missing, f"Missing interactive demo files: {missing}")

        article = (ROOT / "_posts/2026-09-09-synthid-text-watermarking-with-gpt2.md").read_text()
        self.assertIn("demo_url: /lab/synthid-text-watermarking-with-gpt2/demo/", article)
        self.assertIn("/lab/synthid-text-watermarking-with-gpt2/demo/", article)
        lab_index = (ROOT / "lab/index.html").read_text()
        home = (ROOT / "index.html").read_text()
        self.assertIn("post.demo_url", lab_index)
        self.assertIn("post.demo_url", home)
        draft = (ROOT / "_drafts/article-template.md").read_text()
        readme = (ROOT / "README.md").read_text()
        self.assertIn("demo_url:", draft)
        self.assertIn("Interactive Lab entries", readme)
        app = (asset_root / "app.js").read_text()
        worker = (asset_root / "webgpu-worker.js").read_text()
        runtime = (asset_root / "webgpu-runtime.mjs").read_text()
        demo = (demo_root / "index.html").read_text()
        self.assertIn('new URL("./webgpu-worker.js", import.meta.url)', app)
        self.assertNotIn("/api/", app)
        self.assertNotIn('new URL("/models/"', worker)
        self.assertIn("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0", worker)
        self.assertIn('onnx-community/SmolLM2-135M-Instruct-ONNX-GQA', runtime)
        self.assertIn('dtype: "q4f16"', worker)
        self.assertIn("about 112 MB", demo)
        self.assertNotIn("2.7 GB", demo)
        self.assertIn('device: "webgpu"', worker)
        self.assertIn('if (hasWebGPU(window)) {\n  setGenerateBusy(false);', app)
        demo_css = (asset_root / "app.css").read_text()
        self.assertIn(".intro > div { min-width: 0; }", demo_css)
        self.assertIn("font-size: clamp(2.45rem, 13.5vw, 3.2rem)", demo_css)
        for element_id in [
            'id="watermark"',
            'id="sendToDetectorBtn"',
            'id="detectText"',
            'id="detectBtn"',
            'id="verdictContent"',
            'id="signalTrace"',
        ]:
            self.assertIn(element_id, demo)
        self.assertIn('type === "detect"', worker)
        self.assertIn("LogitsProcessor", worker)


if __name__ == "__main__":
    unittest.main()
