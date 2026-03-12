/**
 * PDF Converter v2.2 — Test Suite
 *
 * Tests cover:
 *   1. HTML structure & required elements
 *   2. CSS theme (Findex-style colours & fonts)
 *   3. Redaction regex patterns (all 4 groups)
 *   4. Utility functions (escCSV, toBase64, esc)
 *   5. Extraction helpers (clusterValues, buildLines logic)
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

// ── Load the HTML file ──────────────────────────────────────
const htmlPath = path.resolve(__dirname, "pdf-converter.html");
const htmlSource = fs.readFileSync(htmlPath, "utf-8");

// ── Extract the <style> block and <script> source ───────────
const styleMatch = htmlSource.match(/<style>([\s\S]*?)<\/style>/);
const cssSource = styleMatch ? styleMatch[1] : "";

const scriptMatch = htmlSource.match(/<script type="module">([\s\S]*?)<\/script>/);
const jsSource = scriptMatch ? scriptMatch[1] : "";

// ── Build a JSDOM instance for structural tests ─────────────
let dom, doc;
beforeAll(() => {
  dom = new JSDOM(htmlSource, { url: "http://localhost", runScripts: "outside-only" });
  doc = dom.window.document;
});

// ============================================================
// 1. HTML STRUCTURE
// ============================================================
describe("HTML structure", () => {
  test("contains required meta tags", () => {
    const charset = doc.querySelector('meta[charset="UTF-8"]');
    const viewport = doc.querySelector('meta[name="viewport"]');
    expect(charset).not.toBeNull();
    expect(viewport).not.toBeNull();
  });

  test("title includes version (v2.2)", () => {
    expect(doc.title).toContain("v2.2");
    expect(doc.title).toContain("PDF Converter");
  });

  test("header with logo text and version", () => {
    const logo = doc.querySelector(".logo-text");
    expect(logo).not.toBeNull();
    expect(logo.textContent).toContain("PDF Converter");
    expect(logo.textContent).toContain("v2.2");
  });

  test("logo underline element exists", () => {
    expect(doc.querySelector(".logo-underline")).not.toBeNull();
  });

  test("hero section exists", () => {
    expect(doc.querySelector(".hero")).not.toBeNull();
    expect(doc.querySelector(".hero h1")).not.toBeNull();
    expect(doc.querySelector(".hero-left")).not.toBeNull();
    expect(doc.querySelector(".hero-right")).not.toBeNull();
  });

  test("dropzone is inside hero-right", () => {
    const heroRight = doc.querySelector(".hero-right");
    expect(heroRight).not.toBeNull();
    const dropzone = heroRight.querySelector("#dropzone");
    expect(dropzone).not.toBeNull();
  });

  test("process button exists in hero-left", () => {
    const heroLeft = doc.querySelector(".hero-left");
    expect(heroLeft).not.toBeNull();
    const btn = heroLeft.querySelector("#processBtn");
    expect(btn).not.toBeNull();
    expect(btn.disabled).toBe(true);
  });

  test("file input exists and accepts PDF", () => {
    const input = doc.querySelector("#fileInput");
    expect(input).not.toBeNull();
    expect(input.getAttribute("accept")).toBe(".pdf");
    expect(input.style.display).toBe("none");
  });

  test("redact toggle and panel exist", () => {
    expect(doc.querySelector("#redactToggle")).not.toBeNull();
    expect(doc.querySelector("#toggleTrack")).not.toBeNull();
    expect(doc.querySelector("#toggleKnob")).not.toBeNull();
    expect(doc.querySelector("#toggleLabel")).not.toBeNull();
    expect(doc.querySelector("#redactPanel")).not.toBeNull();
  });

  test("NLP status element exists", () => {
    const nlp = doc.querySelector("#nlpStatus");
    expect(nlp).not.toBeNull();
    expect(nlp.textContent).toBe("");
  });

  test("error message element exists and is hidden", () => {
    const err = doc.querySelector("#errorMsg");
    expect(err).not.toBeNull();
    expect(err.classList.contains("hidden")).toBe(true);
  });

  test("results phase exists and is hidden", () => {
    const results = doc.querySelector("#resultsPhase");
    expect(results).not.toBeNull();
    expect(results.classList.contains("hidden")).toBe(true);
  });

  test("content section with Options heading exists", () => {
    const section = doc.querySelector(".content-section");
    expect(section).not.toBeNull();
    const title = section.querySelector(".section-title");
    expect(title).not.toBeNull();
    expect(title.textContent).toContain("Options");
  });

  test("uses Inter font", () => {
    const link = doc.querySelector('link[href*="Inter"]');
    expect(link).not.toBeNull();
  });
});

// ============================================================
// 2. CSS THEME (Findex-style)
// ============================================================
describe("CSS theme", () => {
  test("body uses light background (#f4f5f7)", () => {
    expect(cssSource).toContain("background:#f4f5f7");
  });

  test("body uses Inter font family", () => {
    expect(cssSource).toContain("font-family:'Inter'");
  });

  test("header uses dark background (#1e272e)", () => {
    expect(cssSource).toContain(".top-header{background:#1e272e");
  });

  test("hero uses dark background (#2d3436)", () => {
    expect(cssSource).toContain(".hero{background:#2d3436");
  });

  test("red accent colour (#e74c3c) used for key elements", () => {
    // Logo underline
    expect(cssSource).toContain(".logo-underline{");
    expect(cssSource).toContain("background:#e74c3c");
    // CTA button
    expect(cssSource).toContain(".glow-btn{");
    // Toggle track
    expect(cssSource).toContain(".toggle-track.on{background:#e74c3c");
    // Checkbox
    expect(cssSource).toContain(".chk.on{border-color:#e74c3c;background:#e74c3c");
  });

  test("CTA button is pill-shaped (border-radius:28px)", () => {
    expect(cssSource).toContain("border-radius:28px");
  });

  test("no purple accent colours remain (#a855f7, #6c3ce0)", () => {
    expect(cssSource).not.toContain("#a855f7");
    expect(cssSource).not.toContain("#6c3ce0");
    expect(cssSource).not.toContain("rgba(168,85,247");
  });

  test("no Crimson Pro font references remain", () => {
    expect(cssSource).not.toContain("Crimson Pro");
  });

  test("dropzone hover uses red accent", () => {
    expect(cssSource).toContain("rgba(231,76,60");
  });

  test("responsive media query exists", () => {
    expect(cssSource).toContain("@media(max-width:768px)");
  });

  test("section-title-bar uses red accent", () => {
    expect(cssSource).toContain(".section-title-bar{");
    expect(cssSource).toContain("background:#e74c3c");
  });
});

// ============================================================
// 3. REDACTION PATTERNS
// ============================================================
describe("Redaction patterns", () => {
  // Extract REDACTION_GROUPS from the JS source for pattern testing
  // We'll test the regex patterns directly

  describe("Email", () => {
    const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    test("matches standard emails", () => {
      expect("john@example.com".match(emailRe)).toEqual(["john@example.com"]);
      expect("user.name+tag@domain.co.uk".match(emailRe)).toEqual(["user.name+tag@domain.co.uk"]);
    });
    test("does not match non-emails", () => {
      expect("not-an-email".match(emailRe)).toBeNull();
      expect("@missing-local.com".match(emailRe)).toBeNull();
    });
  });

  describe("Phone", () => {
    const phoneRe = /\b04\d{2}[\s\-]?\d{3}[\s\-]?\d{3}\b/g;
    test("matches Australian mobile numbers", () => {
      expect("0412 345 678".match(phoneRe)).toEqual(["0412 345 678"]);
      expect("0412-345-678".match(phoneRe)).toEqual(["0412-345-678"]);
      expect("0412345678".match(phoneRe)).toEqual(["0412345678"]);
    });
  });

  describe("Credit Card", () => {
    const visaRe = /\b4\d{3}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g;
    const mcRe = /\b5[1-5]\d{2}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g;
    test("matches Visa", () => {
      expect("4111 1111 1111 1111".match(visaRe)).toEqual(["4111 1111 1111 1111"]);
      expect("4111111111111111".match(visaRe)).toEqual(["4111111111111111"]);
    });
    test("matches Mastercard", () => {
      expect("5111 1111 1111 1111".match(mcRe)).toEqual(["5111 1111 1111 1111"]);
    });
  });

  describe("Australian TFN", () => {
    const tfnRe = /\bTFN[\s:]*\d{3}[\s\-]?\d{3}[\s\-]?\d{3}\b/gi;
    test("matches TFN format", () => {
      expect("TFN: 123 456 789".match(tfnRe)).toEqual(["TFN: 123 456 789"]);
      expect("TFN:123-456-789".match(tfnRe)).toEqual(["TFN:123-456-789"]);
    });
  });

  describe("Australian ABN", () => {
    const abnRe = /\bABN[\s:]*\d{2}[\s]?\d{3}[\s]?\d{3}[\s]?\d{3}\b/gi;
    test("matches ABN format", () => {
      expect("ABN: 12 345 678 901".match(abnRe)).toEqual(["ABN: 12 345 678 901"]);
    });
  });

  describe("Australian Medicare", () => {
    const medicareRe = /\b[2-6]\d{3}[\s]?\d{5}[\s]?\d(?:\/\d)?\b/g;
    test("matches Medicare number", () => {
      expect("2123 45678 1".match(medicareRe)).toEqual(["2123 45678 1"]);
      expect("2123 45678 1/1".match(medicareRe)).toEqual(["2123 45678 1/1"]);
    });
  });

  describe("NZ IRD", () => {
    const irdRe = /\bIRD[\s:#]*\d{2,3}[\s\-]?\d{3}[\s\-]?\d{3}\b/gi;
    test("matches IRD number", () => {
      expect("IRD: 12-345-678".match(irdRe)).toEqual(["IRD: 12-345-678"]);
      expect("IRD:123-456-789".match(irdRe)).toEqual(["IRD:123-456-789"]);
    });
  });

  describe("Date of Birth patterns", () => {
    const dobRe1 = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g;
    const dobRe2 = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{2,4}\b/gi;
    test("matches DD/MM/YYYY", () => {
      expect("15/03/1990".match(dobRe1)).toEqual(["15/03/1990"]);
      expect("1-1-85".match(dobRe1)).toEqual(["1-1-85"]);
    });
    test("matches Month Day, Year", () => {
      expect("January 15, 1990".match(dobRe2)).toEqual(["January 15, 1990"]);
      expect("December 3 2000".match(dobRe2)).toEqual(["December 3 2000"]);
    });
  });

  describe("BSB / IBAN", () => {
    const bsbRe = /\bBSB[\s:]*\d{3}[\s\-]?\d{3}\b/gi;
    const ibanRe = /\bIBAN[\s:]*[A-Z]{2}\d{2}[\s]?[\dA-Z]{4,30}\b/gi;
    test("matches BSB", () => {
      expect("BSB: 062-000".match(bsbRe)).toEqual(["BSB: 062-000"]);
    });
    test("matches IBAN", () => {
      expect("IBAN DE89370400440532013000".match(ibanRe)).toEqual(["IBAN DE89370400440532013000"]);
    });
  });

  describe("URL pattern", () => {
    const urlRe = /https?:\/\/[^\s<>"',)]+/gi;
    test("matches URLs", () => {
      expect("https://example.com/path?q=1".match(urlRe)).toEqual(["https://example.com/path?q=1"]);
      expect("http://test.org".match(urlRe)).toEqual(["http://test.org"]);
    });
  });

  describe("Passport pattern", () => {
    const passportRe = /\bpassport[\s:#]*[A-Z]?\d{6,9}\b/gi;
    test("matches passport format", () => {
      expect("Passport: N1234567".match(passportRe)).toEqual(["Passport: N1234567"]);
      expect("passport:123456789".match(passportRe)).toEqual(["passport:123456789"]);
    });
  });
});

// ============================================================
// 4. UTILITY FUNCTIONS
// ============================================================
describe("Utility functions", () => {
  // Recreate the utility functions from the source
  function toBase64(str) {
    const bytes = Buffer.from(str, "utf-8");
    return bytes.toString("base64");
  }

  function escCSV(v) {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function hlr(html) {
    return html.replace(/\[REDACTED[^\]]*\]/g, '<span class="redacted-tag">$&</span>');
  }

  describe("toBase64", () => {
    test("encodes ASCII strings", () => {
      expect(toBase64("Hello")).toBe("SGVsbG8=");
    });
    test("encodes empty string", () => {
      expect(toBase64("")).toBe("");
    });
    test("encodes unicode", () => {
      const result = toBase64("café");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("escCSV", () => {
    test("returns plain strings unchanged", () => {
      expect(escCSV("hello")).toBe("hello");
    });
    test("wraps strings with commas", () => {
      expect(escCSV("hello,world")).toBe('"hello,world"');
    });
    test("escapes double quotes", () => {
      expect(escCSV('say "hi"')).toBe('"say ""hi"""');
    });
    test("wraps strings with newlines", () => {
      expect(escCSV("line1\nline2")).toBe('"line1\nline2"');
    });
    test("handles null/undefined", () => {
      expect(escCSV(null)).toBe("");
      expect(escCSV(undefined)).toBe("");
    });
  });

  describe("esc (HTML escape)", () => {
    test("escapes HTML entities", () => {
      expect(esc("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert('xss')&lt;/script&gt;");
    });
    test("escapes ampersands", () => {
      expect(esc("A & B")).toBe("A &amp; B");
    });
    test("handles null", () => {
      expect(esc(null)).toBe("");
    });
  });

  describe("hlr (highlight redacted)", () => {
    test("wraps redaction tags", () => {
      const result = hlr("text [REDACTED - Email] more");
      expect(result).toContain('<span class="redacted-tag">[REDACTED - Email]</span>');
    });
    test("handles multiple redactions", () => {
      const result = hlr("[REDACTED - Name] and [REDACTED - Phone]");
      expect(result.match(/redacted-tag/g).length).toBe(2);
    });
    test("leaves non-redacted text alone", () => {
      expect(hlr("normal text")).toBe("normal text");
    });
  });
});

// ============================================================
// 5. EXTRACTION HELPERS (tested via source patterns)
// ============================================================
describe("Extraction logic", () => {
  // Recreate clusterValues for testing
  function clusterValues(values, tolerance) {
    if (!values.length) return [];
    const sorted = [...values].sort((a, b) => a - b);
    const clusters = [[sorted[0]]];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] <= tolerance) clusters[clusters.length - 1].push(sorted[i]);
      else clusters.push([sorted[i]]);
    }
    return clusters.map(c => ({
      center: c.reduce((a, b) => a + b, 0) / c.length,
      count: c.length,
      min: c[0],
      max: c[c.length - 1]
    }));
  }

  describe("clusterValues", () => {
    test("empty input returns empty", () => {
      expect(clusterValues([], 10)).toEqual([]);
    });

    test("single value returns single cluster", () => {
      const result = clusterValues([42], 10);
      expect(result).toHaveLength(1);
      expect(result[0].center).toBe(42);
      expect(result[0].count).toBe(1);
    });

    test("clusters nearby values", () => {
      const result = clusterValues([10, 12, 14, 50, 52, 100], 5);
      expect(result).toHaveLength(3);
      expect(result[0].count).toBe(3); // 10,12,14
      expect(result[1].count).toBe(2); // 50,52
      expect(result[2].count).toBe(1); // 100
    });

    test("all values cluster together with large tolerance", () => {
      const result = clusterValues([1, 2, 3, 4, 5], 10);
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(5);
      expect(result[0].center).toBe(3);
    });

    test("no clustering with zero tolerance", () => {
      const result = clusterValues([10, 20, 30], 0);
      expect(result).toHaveLength(3);
    });
  });

  describe("Bullet regex patterns", () => {
    const BULLET_RE = /^[\u2022\u2023\u25E6\u2043\u2219\u25CF\u25CB\u25AA\u25AB\u2013\u2014\u2022\u00B7\u2219\u25CB\u25CF\u25E6\u25BA\u25B8\u2023\u002D\u2013\u2014]+\s*$/;
    const BULLET_PREFIX_RE = /^[\u2022\u2023\u25E6\u2043\u2219\u25CF\u25CB\u25AA\u25AB\u2013\u2014\u2022\u00B7\u2219\u25CB\u25CF\u25E6\u25BA\u25B8\u2023\u002D\u2013\u2014]+\s+/;
    const DOT_LEADER_RE = /^[.\u00B7\u2219\u2024\u2025\u2026\s]{3,}$/;

    test("BULLET_RE matches bullet characters", () => {
      expect(BULLET_RE.test("• ")).toBe(true);
      expect(BULLET_RE.test("– ")).toBe(true);
      expect(BULLET_RE.test("- ")).toBe(true);
      expect(BULLET_RE.test("Normal text")).toBe(false);
    });

    test("BULLET_PREFIX_RE strips bullet prefix", () => {
      expect("• Item text".replace(BULLET_PREFIX_RE, "")).toBe("Item text");
      expect("– List item".replace(BULLET_PREFIX_RE, "")).toBe("List item");
    });

    test("DOT_LEADER_RE matches TOC dot leaders", () => {
      expect(DOT_LEADER_RE.test("......")).toBe(true);
      expect(DOT_LEADER_RE.test(". . . .")).toBe(true);
      expect(DOT_LEADER_RE.test("Normal text")).toBe(false);
    });
  });
});

// ============================================================
// 6. JS SOURCE INTEGRITY
// ============================================================
describe("JS source integrity", () => {
  test("contains REDACTION_GROUPS definition", () => {
    expect(jsSource).toContain("const REDACTION_GROUPS = [");
  });

  test("contains all 4 redaction groups", () => {
    expect(jsSource).toContain('"personal"');
    expect(jsSource).toContain('"miscellaneous"');
    expect(jsSource).toContain('"australia"');
    expect(jsSource).toContain('"new_zealand"');
  });

  test("contains PDF.js import", () => {
    expect(jsSource).toContain('import * as pdfjsLib from');
    expect(jsSource).toContain("pdf.min.mjs");
  });

  test("contains NLP engine loader", () => {
    expect(jsSource).toContain("compromise");
    expect(jsSource).toContain("nlpReady");
  });

  test("contains processFile function", () => {
    expect(jsSource).toContain("async function processFile()");
  });

  test("contains all export formats", () => {
    expect(jsSource).toContain('state.exportFormat === "xlsx"');
    expect(jsSource).toContain('state.exportFormat === "docx"');
    expect(jsSource).toContain('state.exportFormat === "csv"');
  });

  test("contains renderResults function", () => {
    expect(jsSource).toContain("function renderResults()");
  });

  test("contains resetApp function", () => {
    expect(jsSource).toContain("function resetApp()");
  });

  test("contains applyRedactions function", () => {
    expect(jsSource).toContain("function applyRedactions(");
  });

  test("does not contain old purple theme colours", () => {
    expect(jsSource).not.toContain("#a855f7");
    expect(jsSource).not.toContain("#6c3ce0");
    expect(jsSource).not.toContain("Crimson Pro");
  });

  test("uses red accent colour in inline styles", () => {
    expect(jsSource).toContain("#e74c3c");
  });
});

// ============================================================
// 7. OCR ENGINE (Tesseract.js integration)
// ============================================================
describe("OCR engine integration", () => {
  test("contains Tesseract.js CDN script loader", () => {
    expect(jsSource).toContain("tesseract.min.js");
    expect(jsSource).toContain("cdn.jsdelivr.net/npm/tesseract.js@5");
  });

  test("contains ocrAvailable flag", () => {
    expect(jsSource).toContain("let ocrAvailable = false");
  });

  test("contains ocrReady promise", () => {
    expect(jsSource).toContain("const ocrReady = new Promise");
  });

  test("contains getOcrWorker function", () => {
    expect(jsSource).toContain("async function getOcrWorker()");
  });

  test("contains ocrFromCanvas function", () => {
    expect(jsSource).toContain("async function ocrFromCanvas(canvas)");
  });

  test("createWorker is called with English language", () => {
    expect(jsSource).toContain('Tesseract.createWorker("eng"');
  });

  test("OCR fallback triggers when page has no text items", () => {
    expect(jsSource).toContain("needsOcr");
    expect(jsSource).toContain("!items.length || !buildLines(items).length");
  });

  test("OCR fallback checks ocrAvailable before running", () => {
    expect(jsSource).toContain("if (ocrAvailable)");
  });

  test("OCR progress shown in process button", () => {
    expect(jsSource).toContain("OCR page ${i}/${numPages}");
  });

  test("OCR pages tagged in pageContents", () => {
    expect(jsSource).toContain("ocr: true");
  });

  test("OCR page separator includes (OCR) label", () => {
    expect(jsSource).toContain("Page ${i} (OCR)");
  });

  test("ocrPageCount tracked in results", () => {
    expect(jsSource).toContain("ocrPageCount");
    expect(jsSource).toContain("pageContents.filter(pc => pc.ocr).length");
  });

  test("results banner shows OCR page count when applicable", () => {
    expect(jsSource).toContain("via OCR");
  });

  test("OCR text is split into paragraphs", () => {
    // Verify OCR text gets split on double newlines into paragraph objects
    expect(jsSource).toContain("ocrText.split(");
    expect(jsSource).toContain("ocrParas");
  });

  test("OCR text appended to fullText for redaction", () => {
    // The ocrText is added to fullText so redaction patterns can match it
    expect(jsSource).toContain('fullText += ocrText + "\\n\\n"');
  });

  test("OCR renders at 4x scale for better resolution", () => {
    expect(jsSource).toContain("ocrScale = 4");
    expect(jsSource).toContain("ocrCanvas");
  });

  test("thumbnail renders at 1.5x scale separately from OCR canvas", () => {
    expect(jsSource).toContain("thumbScale = 1.5");
    expect(jsSource).toContain("thumbCanvas");
  });
});

// ============================================================
// 7b. OCR IMAGE PREPROCESSING PIPELINE
// ============================================================
describe("OCR image preprocessing", () => {
  test("contains preprocessForOcr function", () => {
    expect(jsSource).toContain("function preprocessForOcr(sourceCanvas)");
  });

  test("step 1: converts to grayscale using ITU-R BT.601 luma", () => {
    expect(jsSource).toContain("0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]");
  });

  test("step 2: performs contrast stretching", () => {
    expect(jsSource).toContain("Contrast stretch");
    expect(jsSource).toContain("clipLo");
    expect(jsSource).toContain("clipHi");
  });

  test("step 3: removes horizontal line artifacts with multi-pass", () => {
    expect(jsSource).toContain("Remove horizontal line artifacts");
    expect(jsSource).toContain("rowAvg");
    expect(jsSource).toContain("neighbourAvg");
    expect(jsSource).toContain("lineMargin = 6");
  });

  test("step 4: applies unsharp mask sharpening", () => {
    expect(jsSource).toContain("Unsharp mask sharpening");
    expect(jsSource).toContain("sharpenAmount");
    expect(jsSource).toContain("blurred");
    expect(jsSource).toContain("3x3 Gaussian");
  });

  test("step 5: applies Sauvola adaptive local thresholding", () => {
    expect(jsSource).toContain("Sauvola adaptive local thresholding");
    expect(jsSource).toContain("k_sauvola");
    expect(jsSource).toContain("intImg");
    expect(jsSource).toContain("intSq");
    expect(jsSource).toContain("integral image");
  });

  test("step 6: applies morphological dilation for broken strokes", () => {
    expect(jsSource).toContain("Morphological dilation");
    expect(jsSource).toContain("cross structuring element");
    expect(jsSource).toContain("dilated");
  });

  test("step 7: removes salt-and-pepper noise", () => {
    expect(jsSource).toContain("Noise removal");
    expect(jsSource).toContain("blackNeighbours");
  });

  test("ocrFromCanvas calls preprocessForOcr before recognition", () => {
    expect(jsSource).toContain("preprocessForOcr(canvas)");
  });

  test("Tesseract configured with PSM 6 for uniform text blocks", () => {
    expect(jsSource).toContain("tessedit_pageseg_mode");
    expect(jsSource).toContain('"6"');
  });

  test("Tesseract configured to preserve interword spaces", () => {
    expect(jsSource).toContain("preserve_interword_spaces");
  });
});

// ============================================================
// 8. OCR TEXT PARAGRAPH SPLITTING (unit test)
// ============================================================
describe("OCR paragraph splitting logic", () => {
  // Mirrors the splitting done in the OCR fallback path
  function splitOcrText(ocrText) {
    return ocrText.split(/\n\s*\n/).filter(p => p.trim()).map(p => ({ text: p.trim(), type: "body", page: 1 }));
  }

  test("splits double-newline separated text into paragraphs", () => {
    const result = splitOcrText("First paragraph.\n\nSecond paragraph.");
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("First paragraph.");
    expect(result[1].text).toBe("Second paragraph.");
  });

  test("single block of text returns one paragraph", () => {
    const result = splitOcrText("Just one block of text here.");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Just one block of text here.");
  });

  test("empty OCR text returns no paragraphs", () => {
    const result = splitOcrText("");
    expect(result).toHaveLength(0);
  });

  test("whitespace-only text returns no paragraphs", () => {
    const result = splitOcrText("   \n\n   \n   ");
    expect(result).toHaveLength(0);
  });

  test("paragraphs get type body and page number", () => {
    const result = splitOcrText("Hello world");
    expect(result[0].type).toBe("body");
    expect(result[0].page).toBe(1);
  });

  test("trims whitespace from each paragraph", () => {
    const result = splitOcrText("  spaced out  \n\n  another one  ");
    expect(result[0].text).toBe("spaced out");
    expect(result[1].text).toBe("another one");
  });

  test("handles multiple consecutive blank lines", () => {
    const result = splitOcrText("First\n\n\n\nSecond\n\n\n\n\nThird");
    expect(result).toHaveLength(3);
  });
});

// ============================================================
// 9. OCR PREPROCESSING ALGORITHMS (unit tests)
// ============================================================
describe("OCR preprocessing algorithms", () => {
  // Sauvola threshold — mirrors the implementation
  describe("Sauvola adaptive thresholding", () => {
    function sauvolaThreshold(mean, std, k, R) {
      return mean * (1 + k * (std / R - 1));
    }

    test("white background pixel stays white (high mean, low std)", () => {
      // Mean 220, std 5 → threshold should be below 220 → pixel 220 > thresh → white
      const thresh = sauvolaThreshold(220, 5, 0.2, 128);
      expect(220).toBeGreaterThan(thresh);
    });

    test("dark text pixel goes black (low mean region)", () => {
      // Mean 60, std 40 → threshold ~= 60*(1 + 0.2*(40/128-1)) ~= 60*0.8375 ≈ 50.25
      const thresh = sauvolaThreshold(60, 40, 0.2, 128);
      expect(thresh).toBeLessThan(60);
      expect(thresh).toBeGreaterThan(30);
    });

    test("high contrast area: threshold adapts to local mean", () => {
      const lightThresh = sauvolaThreshold(200, 30, 0.2, 128);
      const darkThresh = sauvolaThreshold(80, 30, 0.2, 128);
      expect(lightThresh).toBeGreaterThan(darkThresh);
    });

    test("uniform area with zero std: threshold drops below mean", () => {
      // std=0 → thresh = mean*(1 + k*(0-1)) = mean*(1-k) = mean*0.8
      const thresh = sauvolaThreshold(200, 0, 0.2, 128);
      expect(thresh).toBe(200 * 0.8);
    });

    test("k parameter controls sensitivity", () => {
      const lowK = sauvolaThreshold(150, 20, 0.1, 128);
      const highK = sauvolaThreshold(150, 20, 0.4, 128);
      // Higher k → threshold drops more → more pixels survive as white
      expect(lowK).toBeGreaterThan(highK);
    });
  });

  // Integral image for fast local stats
  describe("Integral image computation", () => {
    function buildIntegralImage(pixels, w, h) {
      const iw = w + 1;
      const intImg = new Float64Array(iw * (h + 1));
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const v = pixels[y * w + x];
          const idx = (y + 1) * iw + (x + 1);
          intImg[idx] = v + intImg[idx - 1] + intImg[idx - iw] - intImg[idx - iw - 1];
        }
      }
      return intImg;
    }

    function regionSum(intImg, x1, y1, x2, y2, iw) {
      return intImg[(y2 + 1) * iw + (x2 + 1)] - intImg[y1 * iw + (x2 + 1)] - intImg[(y2 + 1) * iw + x1] + intImg[y1 * iw + x1];
    }

    test("sum of entire 3x3 image", () => {
      const pixels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const intImg = buildIntegralImage(pixels, 3, 3);
      expect(regionSum(intImg, 0, 0, 2, 2, 4)).toBe(45);
    });

    test("sum of sub-region", () => {
      const pixels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const intImg = buildIntegralImage(pixels, 3, 3);
      // Top-left 2x2: 1+2+4+5 = 12
      expect(regionSum(intImg, 0, 0, 1, 1, 4)).toBe(12);
    });

    test("single pixel region", () => {
      const pixels = [10, 20, 30, 40];
      const intImg = buildIntegralImage(pixels, 2, 2);
      expect(regionSum(intImg, 1, 1, 1, 1, 3)).toBe(40);
    });
  });

  // Contrast stretching
  describe("Contrast stretching", () => {
    function contrastStretch(pixels, lo, hi) {
      const range = Math.max(hi - lo, 1);
      return pixels.map(v => Math.round(Math.min(255, Math.max(0, (v - lo) * 255 / range))));
    }

    test("stretches narrow range to full 0-255", () => {
      const result = contrastStretch([100, 150, 200], 100, 200);
      expect(result[0]).toBe(0);
      expect(result[2]).toBe(255);
    });

    test("midpoint maps correctly", () => {
      const result = contrastStretch([150], 100, 200);
      expect(result[0]).toBe(128);
    });

    test("values below lo clamp to 0", () => {
      expect(contrastStretch([50], 100, 200)[0]).toBe(0);
    });

    test("values above hi clamp to 255", () => {
      expect(contrastStretch([250], 100, 200)[0]).toBe(255);
    });
  });

  // Unsharp mask
  describe("Unsharp mask sharpening", () => {
    function unsharpMask(original, blurred, amount) {
      return Math.round(Math.min(255, Math.max(0, original + amount * (original - blurred))));
    }

    test("sharpens edge (original > blurred)", () => {
      // Dark-to-light edge: original=200, blur=150, amount=1.5 → 200+1.5*50=275→255
      expect(unsharpMask(200, 150, 1.5)).toBe(255);
    });

    test("darkens dark side of edge (original < blurred)", () => {
      // Light-to-dark edge: original=50, blur=100, amount=1.5 → 50+1.5*(-50)=-25→0
      expect(unsharpMask(50, 100, 1.5)).toBe(0);
    });

    test("no change when original equals blurred (flat area)", () => {
      expect(unsharpMask(128, 128, 1.5)).toBe(128);
    });

    test("amount=0 means no sharpening", () => {
      expect(unsharpMask(200, 100, 0)).toBe(200);
    });
  });

  // Morphological dilation
  describe("Morphological dilation (cross element)", () => {
    function dilate3x3Cross(grid, w, h) {
      const out = new Uint8Array(w * h);
      for (let i = 0; i < out.length; i++) out[i] = grid[i];
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (grid[y * w + x] === 0) continue;
          if (grid[(y - 1) * w + x] === 0 || grid[(y + 1) * w + x] === 0 ||
              grid[y * w + (x - 1)] === 0 || grid[y * w + (x + 1)] === 0) {
            out[y * w + x] = 0;
          }
        }
      }
      return out;
    }

    test("dilates single black pixel into cross shape", () => {
      // 5x5 grid with single black pixel at center
      const g = new Uint8Array(25).fill(255);
      g[12] = 0; // center of 5x5
      const result = dilate3x3Cross(g, 5, 5);
      expect(result[12]).toBe(0); // center stays
      expect(result[7]).toBe(0);  // above
      expect(result[17]).toBe(0); // below
      expect(result[11]).toBe(0); // left
      expect(result[13]).toBe(0); // right
      expect(result[6]).toBe(255); // diagonal — not dilated
    });

    test("all-white grid stays white", () => {
      const g = new Uint8Array(9).fill(255);
      const result = dilate3x3Cross(g, 3, 3);
      expect(result.every(v => v === 255)).toBe(true);
    });

    test("all-black grid stays black", () => {
      const g = new Uint8Array(9).fill(0);
      const result = dilate3x3Cross(g, 3, 3);
      expect(result.every(v => v === 0)).toBe(true);
    });
  });

  // Isolated pixel removal
  describe("Isolated pixel noise removal", () => {
    function isIsolatedBlack(grid, x, y, w) {
      if (grid[y * w + x] !== 0) return false;
      let blackNeighbours = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (dy === 0 && dx === 0) continue;
        if (grid[(y + dy) * w + (x + dx)] === 0) blackNeighbours++;
      }
      return blackNeighbours <= 1;
    }

    test("detects isolated black pixel (no black neighbours)", () => {
      const grid = [255, 255, 255, 255, 0, 255, 255, 255, 255];
      expect(isIsolatedBlack(grid, 1, 1, 3)).toBe(true);
    });

    test("does not flag black pixel with 2+ black neighbours", () => {
      const grid = [0, 0, 255, 255, 0, 255, 255, 255, 255];
      expect(isIsolatedBlack(grid, 1, 1, 3)).toBe(false);
    });

    test("pixel with exactly 1 black neighbour is still isolated", () => {
      const grid = [0, 255, 255, 255, 0, 255, 255, 255, 255];
      expect(isIsolatedBlack(grid, 1, 1, 3)).toBe(true);
    });

    test("white pixel is never isolated", () => {
      const grid = [0, 0, 0, 0, 255, 0, 0, 0, 0];
      expect(isIsolatedBlack(grid, 1, 1, 3)).toBe(false);
    });
  });

  // Horizontal line detection
  describe("Horizontal line detection", () => {
    function isLineArtifact(rowAvg, y, margin) {
      let aboveSum = 0, belowSum = 0;
      for (let m = 1; m <= margin; m++) { aboveSum += rowAvg[y - m]; belowSum += rowAvg[y + m]; }
      const neighbourAvg = (aboveSum + belowSum) / (margin * 2);
      return rowAvg[y] < neighbourAvg - 25;
    }

    test("dark row among light rows is a line artifact", () => {
      const rowAvg = new Array(13).fill(200);
      rowAvg[6] = 100;
      expect(isLineArtifact(rowAvg, 6, 6)).toBe(true);
    });

    test("row matching neighbours is not a line artifact", () => {
      const rowAvg = new Array(13).fill(200);
      rowAvg[6] = 195;
      expect(isLineArtifact(rowAvg, 6, 6)).toBe(false);
    });

    test("row within 25 tolerance is not flagged", () => {
      const rowAvg = new Array(13).fill(200);
      rowAvg[6] = 180;
      expect(isLineArtifact(rowAvg, 6, 6)).toBe(false);
    });
  });
});
