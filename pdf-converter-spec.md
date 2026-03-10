# PDF Converter - Rebuild Specification

## Overview

A standalone HTML file (single file, no build step, no installation) that extracts text and tables from PDFs, optionally redacts sensitive data using three detection methods, and exports to Excel (.xls), CSV, or editable HTML. Everything runs in the browser. No data leaves the device. No API keys required.

## Delivery Format

Single `.html` file. No frameworks, no build tools, no npm. User double-clicks it in Chrome/Edge/Firefox and it works. All CSS is inline in a `<style>` block. All JS is in a single `<script type="module">` block.

## External Dependencies (loaded from CDN)

- **pdf.js 4.4.168** - PDF rendering and text extraction
  - `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs` (ES module import)
  - `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs` (worker)
- **Compromise.js 14.14.3** - NLP entity extraction (names, places, dates)
  - `https://unpkg.com/compromise@14.14.3/builds/compromise.min.js` (loaded via script tag, not import)
  - Loaded asynchronously. App works without it (falls back to pattern-only redaction).
- **Google Fonts** - Crimson Pro (body) and JetBrains Mono (code/data)

## User Flow

1. User opens HTML file in browser
2. NLP engine loads in background (status shown at top)
3. User drops/selects a PDF file
4. Optionally toggles "Auto-Redact" and selects redaction categories
5. Clicks "Extract & Convert"
6. App renders each page as an image, extracts text, detects tables vs text, applies redactions
7. Results shown: success banner, redaction stats, sheet previews (tables and text), page thumbnails
8. User picks export format (Excel/CSV/HTML) and clicks "Prepare"
9. Download link appears using data: URI (not blob URL - blob URLs are blocked in some sandboxed environments)

---

## Architecture

### State

Single `state` object:
```
{
  file: File | null,
  fileData: ArrayBuffer | null,
  redactEnabled: boolean,
  redactState: { [categoryId]: boolean },  // built from REDACTION_GROUPS defaults
  customKeywords: string,
  result: { title, sheets[], pageImages[], redactionStats } | null,
  exportFormat: "xlsx" | "csv" | "html"
}
```

### Processing Pipeline

For each page of the PDF:

1. **Render page image** - pdf.js renders page to canvas at 1.5x scale, exported as PNG data URL
2. **Extract text items** - `page.getTextContent()` returns items with `str`, `transform[6]` (transform matrix), `width`, `height`, `fontName`
3. **Build structured lines** - group items by Y proximity, merge adjacent fragments, strip bullet markers
4. **Detect body font size** - frequency analysis of all font sizes to find the most common (body) size
5. **Detect table regions** - column clustering on x-positions to find aligned tabular data
6. **Build table sheets** - map items to columns, merge wrapped rows, drop empty/bullet-only columns
7. **Build text paragraphs** - group remaining lines into paragraphs using gap analysis, font changes, and indentation
8. **Apply redactions** (if enabled) - three-pass redaction: regex patterns, NLP entities, context labels

---

## PDF Extraction Engine (the hardest part - details matter)

### Transform Matrix

pdf.js text items have a `transform` array: `[scaleX, 0, 0, scaleY, translateX, translateY]`

- `transform[0]` = font size (horizontal scale). Use `Math.abs(transform[0])` or fall back to `Math.abs(transform[3])` or `item.height`
- `transform[4]` = X position (left edge of text)
- `transform[5]` = Y position (baseline, PDF coordinates = bottom-up, so higher Y = higher on page)

### Line Building (`buildLines`)

1. Filter items to non-empty strings
2. Sort by Y descending (top to bottom), then X ascending (left to right)
3. Group into lines: items within Y tolerance of 3 units belong to the same line
4. **Bullet stripping**: Before merging fragments, detect and remove bullet markers that are their own text items. Bullet characters: `bullet, middot, circle, dash, arrow variants`. Also strip bullet prefixes from the start of text items. This is critical because PDFs often render bullet points as separate text items that create phantom columns in table detection.
5. Merge adjacent fragments on the same line: if gap between items is less than 0.8x font size, merge into one string. Add a space if gap is > 0.3x font size.
6. Calculate line properties: `text`, `itemCount`, `minX`, `maxX`, `fontSize`

Bullet regex patterns to detect standalone bullets:
```
/^[bullet_unicode_chars]\s*$/   - standalone bullet items
/^[bullet_unicode_chars]\s+/    - bullet prefix on text
/^[o]\s*$/                       - sub-bullet "o"
```

### Body Font Size Detection

Count all font sizes across all lines, return the most frequent. This is the "body" size used to detect headings (anything 20%+ larger than body = heading).

### Table Detection (`detectTableRegions`)

1. Find lines with 2+ items (potential table rows)
2. Collect all x-positions, quantized to nearest 3 units
3. Cluster x-positions with tolerance of 15 units to find column boundaries
4. A line "fits" the column pattern if 60%+ of its x-positions snap to known columns (within 18 units)
5. Find consecutive runs of matching lines (allowing 1-line gaps) with at least 2 lines
6. Everything not in a table region becomes text content

### Table Sheet Building (`buildTableSheet`)

1. Re-cluster x-positions within the table region to get column centers
2. Map each line's items to the nearest column
3. **Merge continuation rows**: if a row has content in only one column and the previous row has content in the same column, append it (this handles text wrapping in PDF tables)
4. **Drop empty/bullet columns**: after building the table, identify columns where every cell is either empty or contains only a bullet character, and remove those columns entirely
5. Clean remaining bullet prefixes from cell values
6. First row becomes headers, rest become data rows

### Text Paragraph Building (`buildTextSections`)

1. Calculate typical line spacing: sort all line gaps, take the 30th percentile as "normal" spacing
2. Paragraph break threshold = 1.4x typical spacing
3. Walk through text lines, detecting paragraph breaks via:
   - **Vertical gap** larger than threshold
   - **Indentation change** of more than 2x body font size
   - **Font name change** between consecutive lines (different font = new paragraph)
4. Detect headings: font size > 1.2x body AND text length < 80 characters
5. Headings get flagged with `isHeading: true` and prefixed with `[H]` in output
6. All paragraphs from one page go into a single sheet (not separate sheets per heading/section)

### Sheet Structure

Each sheet has:
```
{
  name: string (max 31 chars for Excel),
  type: "table" | "text",
  headers: string[],
  rows: string[][],
  textContent?: string  // for text-type sheets
}
```

Table sheets: headers from first detected row, rows from remaining data
Text sheets: headers are `["#", "Content"]`, each row is `[lineNumber, paragraphText]`

---

## Redaction System

### Three Detection Methods

Each redaction category can use one or more methods:

1. **RGX (Regex patterns)** - direct pattern matching on text
2. **NLP (Compromise.js)** - entity extraction from full page text, then match those entities everywhere
3. **CTX (Context labels)** - detect "Label: value" patterns and redact the value

Each category shows method badges in the UI: purple NLP, green CTX, yellow RGX.

### Redaction Application Order

1. **Regex pass**: apply all active category patterns. Skip if text already contains `[REDACTED` nearby.
2. **NLP pass**: run NLP extraction functions on full document text to find entities (names, places, dates). Build regex patterns from discovered entities and apply them.
3. **Context pass**: for each category's context labels, build a regex like `(?:label1|label2)\s*[:=]?\s*([^\n,;]{2,50})` and redact capture group 1.

Replacement format: `[REDACTED - Tag]` where Tag is category-specific (e.g. "Email", "Financial", "AU TFN").

Anti-double-redaction: before replacing a match, check if the 12 characters before the match contain `[REDACTED`. If so, skip.

### Redaction Categories

Organised into 4 groups with Select All toggles. Each item has: id, label, default on/off state, tag name, regex patterns array, context labels array, and optional nlpExtract function.

**Personal Info** (12 items):
| ID | Label | Default | Tag | Methods |
|----|-------|---------|-----|---------|
| dob | Date of Birth | ON | DOB | RGX, CTX |
| age | Age | OFF | Age | RGX, CTX |
| email | Email Address | ON | Email | RGX, CTX |
| financial_account | Financial Account Number | ON | Financial | RGX, CTX |
| location | Location | OFF | Location | RGX, CTX, NLP |
| medical_record | Medical Record Number | ON | Medical Record | RGX, CTX |
| person_name | Person Name | OFF | Name | CTX, NLP |
| gender | Gender | OFF | Gender | RGX, CTX |
| ethnic_group | Ethnic Group | OFF | Ethnicity | CTX |
| passport | Passport | ON | Passport | RGX, CTX |
| phone | Phone Number | ON | Phone | RGX, CTX |
| vin | Vehicle Identification Number | ON | VIN | RGX, CTX |

**Miscellaneous** (15 items):
| ID | Label | Default | Tag | Methods |
|----|-------|---------|-----|---------|
| advertising_id | Advertising ID | OFF | Ad ID | RGX |
| domain_name | Domain Name | OFF | Domain | RGX, CTX |
| iccid | ICCID Number | OFF | ICCID | RGX, CTX |
| imsi | IMSI ID | OFF | IMSI | RGX, CTX |
| location_coords | Location Coordinates | OFF | Coordinates | RGX, CTX |
| url | URL | OFF | URL | RGX, CTX |
| swift_code | Swift Code | OFF | Swift | RGX, CTX |
| date | Date | OFF | Date | RGX, CTX, NLP |
| storage_signed_policy | Storage Signed Policy Document | OFF | Storage Policy | RGX |
| storage_signed_url | Storage Signed URL | OFF | Signed URL | RGX |
| time | Time | OFF | Time | RGX, CTX |
| credit_card | Credit Card Number | ON | Card Number | RGX, CTX |
| credit_card_track | Credit Card Track Number | ON | Card Track | RGX |
| ssl_cert | SSL Certificate | OFF | SSL Cert | RGX |
| tink_keyset | Tink Keyset | OFF | Tink Key | RGX |

**Australia** (4 items, all ON):
| ID | Label | Tag | Methods |
|----|-------|----|---------|
| au_drivers | Australia Drivers License Number | AU License | CTX |
| au_medicare | Australia Medicare Number | AU Medicare | RGX, CTX |
| au_passport | Australia Passport | AU Passport | RGX, CTX |
| au_tfn | Australia Tax File Number | AU TFN | RGX, CTX |

**New Zealand** (2 items, all ON):
| ID | Label | Tag | Methods |
|----|-------|----|---------|
| nz_ird | New Zealand IRD Number | NZ IRD | RGX, CTX |
| nz_nhi | New Zealand NHI Number | NZ NHI | RGX, CTX |

Plus **Custom Keywords** - user enters comma-separated terms, each becomes a case-insensitive regex.

### Key Regex Patterns (partial list - most important ones)

**Email**: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`

**Financial amounts**: `(?:[$euro pound yen]|AU\$|NZ\$|US\$)\s*[\d,]+\.?\d*` and `\b\d[\d,]+\.\d{2}\b`

**Financial context labels**: account, total, subtotal, gst, tax, amount, balance, payment, price, cost, fee, charge, deposit, refund, invoice total, amount due, amount paid, net, gross

**AU mobile**: `\b04\d{2}[\s-]?\d{3}[\s-]?\d{3}\b`

**AU Medicare**: `\b[2-6]\d{3}[\s]?\d{5}[\s]?\d(?:\/\d)?\b` (starts with 2-6)

**AU TFN/ABN/ACN**: prefixed patterns like `\bTFN[\s:]*\d{3}[\s-]?\d{3}[\s-]?\d{3}\b`

**Credit cards**: Visa (4xxx), Mastercard (51-55xx), Amex (34/37xx), Discover (6011/65xx) with specific prefix validation

**Person names** (NLP): `doc.people().out("array")` via compromise.js

**Locations** (NLP): `doc.places().out("array")` via compromise.js

**Dates** (NLP): `doc.dates().out("array")` via compromise.js

---

## Export Formats

### Excel (.xls)

HTML table format with Office XML namespace headers so Excel recognises it. Each sheet becomes an `<x:ExcelWorksheet>`. Redacted cells get yellow background `#fff3cd` and dark gold text `#856404`. Uses data: URI with MIME `application/vnd.ms-excel`.

### CSV

Plain text. Multiple sheets separated by `--- Sheet Name ---`. Standard CSV escaping (double-quote wrapping for commas/quotes/newlines).

### Editable HTML

Full HTML document with `contenteditable="true"` on body. Includes inline CSS for print. Redacted values wrapped in `<span class="redacted">`. Page images embedded as `<img>` tags with data: URI src. User can edit in browser then File > Print > Save as PDF.

---

## Visual Design

Dark theme with purple/blue gradient background. Crimson Pro for body text, JetBrains Mono for data/code.

- Background: `linear-gradient(145deg, #0a0a0f, #12121f, #1a1028)`
- Primary accent: purple `#a855f7` / `#6c3ce0`
- Redaction accent: amber `#fbbf24`
- Success: green `#4ade80`
- Error: red `#f87171`
- Buttons: gradient purple glow with hover lift effect
- Cards: subtle white-alpha borders on dark backgrounds
- Toggle: iOS-style track/knob with amber active state

### UI Components

- **Drop zone**: dashed border, drag-over highlight, click to browse
- **Redaction toggle**: master on/off switch with active count
- **Category groups**: collapsible boxes with Select All buttons showing none/some/all states
- **Item chips**: checkboxes with method badges (NLP purple, CTX green, RGX yellow)
- **Detection legend**: shows what NLP/CTX/RGX mean
- **Results**: success/redaction banners, scrollable table previews (max 10 rows shown), page thumbnails
- **Export panel**: format chips (radio-style), prepare button, download link

---

## Known Issues / Areas for Improvement

1. **Table detection threshold tuning** - the column clustering tolerance (15 units) and line matching threshold (60%) work well for most structured tables but can struggle with loosely formatted content. PDFs with unusual spacing may need different values.

2. **Text paragraph merging** - the gap-based paragraph detection (1.4x typical spacing) is a heuristic. Some PDFs have inconsistent spacing that causes over-splitting or under-splitting of paragraphs.

3. **Font-based heading detection** - relies on font size being 20%+ larger than body. Documents that use bold at the same size for headings (common in Q&A formats) may not detect headings properly. The font name comparison helps but is imperfect since pdf.js font names are internal identifiers, not human-readable names.

4. **Wrapped text in tables** - the continuation-row merging works when a cell wraps to the next line in the same column position, but can fail if the wrapped text starts at a slightly different x-position.

5. **Multi-page tables** - tables that span page boundaries are treated as separate tables. There is no cross-page table merging.

6. **Scanned PDFs** - no OCR capability. If the PDF is a scanned image with no text layer, extraction returns nothing (page images are still rendered).

7. **Complex layouts** - multi-column layouts, sidebars, and floating text boxes are not handled. All text is processed in reading order (top-to-bottom, left-to-right).

8. **Excel format** - uses HTML-based .xls format (not true XLSX). This triggers a warning in newer Excel versions about file format mismatch, but opens correctly. For proper XLSX, would need a library like SheetJS.

9. **Large PDFs** - page images are stored as PNG data URLs in memory. A 50-page PDF can use significant RAM. No streaming/pagination.

---

## File Structure

The entire application is one HTML file with this structure:

```
<!DOCTYPE html>
<html>
<head>
  <meta charset, viewport>
  <title>
  <link> Google Fonts
  <style> All CSS (~80 lines)
</head>
<body>
  <div class="wrap">
    Header (logo, title, subtitle, NLP status)
    Upload Phase (dropzone, file input, redact toggle, redact panel, process button)
    Results Phase (dynamically rendered)
  </div>
  <script type="module">
    pdf.js import
    compromise.js async load
    REDACTION_GROUPS definition
    State management
    DOM references
    File handling
    Redaction UI (toggle, panel, groups, items)
    Redaction engine (applyRedactions with 3-pass system)
    Extraction engine:
      - getFontSize, clusterValues
      - buildLines (with bullet stripping)
      - getBodyFontSize
      - detectTableRegions
      - buildTableSheet (with row merging + column cleanup)
      - buildTextSections (with gap/font/indent detection)
      - paragraphsToSheet
    processFile (main pipeline)
    renderResults
    Export functions (toBase64, escCSV, handleExport for xlsx/csv/html)
    Utility (esc, hlr, showError, hideError, resetApp)
  </script>
</body>
</html>
```
