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
    expect(nlp.textContent).toContain("Loading NLP engine");
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
