# Known Vulnerabilities — Dependency Audit

Captured from GitHub Dependabot alerts on 2026-05-12. These are **intentionally not yet patched** so they can be demonstrated in the workshop as a live example of what Dependabot and Trivy catch in a real project.

See `docs/mlops_pipeline.md` Step 8 for how security scanning fits into the pipeline.

---

## Summary

| Severity | Count | Packages affected |
|---|---|---|
| HIGH | 2 | `python-multipart` |
| MEDIUM | 22 | `pypdf` (21), `pytest` (1) |
| LOW | 3 | `pypdf` |
| **Total** | **27** | **3 packages** |

Current pinned versions in `backend/requirements.txt`:

```
python-multipart==0.0.20
pypdf==5.1.0
pytest==8.3.4
```

---

## HIGH Severity

### CVE-2026-42561 — python-multipart DoS via unbounded part headers

- **Package:** `python-multipart` (currently `0.0.20`)
- **Fix:** upgrade to `>= 0.0.27`
- **Impact:** Denial of service. When parsing `multipart/form-data`, `MultipartParser` had no limit on the number of part headers or the size of an individual part header. An attacker can send a request with many repeated headers or a single very large header value, causing excessive CPU work before rejection.
- **Relevance to this project:** This app accepts `multipart/form-data` on `POST /analyze` (resume file + text fields). The endpoint is directly exposed. An attacker could target it to exhaust a Render worker.

### CVE-2026-24486 — python-multipart Arbitrary File Write

- **Package:** `python-multipart` (currently `0.0.20`)
- **Fix:** upgrade to `>= 0.0.22`
- **Impact:** Arbitrary file write when using non-default configuration. In a default FastAPI/Starlette setup the risk is lower, but the library version in use is still affected.
- **Relevance:** Same upload endpoint. Lower practical risk in this deployment (Render ephemeral filesystem) but the vulnerability is real.

---

## MEDIUM Severity

### pypdf — Multiple Resource Exhaustion / Infinite Loop CVEs (21 issues)

- **Package:** `pypdf` (currently `5.1.0`)
- **Fix:** upgrade to `>= 6.10.2` (fixes all 21)
- **Pattern:** All 21 CVEs follow the same two patterns:
  1. **RAM exhaustion** — a malformed PDF with manipulated stream lengths, FlateDecode parameters, XMP metadata, or decode predictor values causes pypdf to allocate unbounded memory.
  2. **Infinite loop / long runtime** — malformed cross-reference streams, circular `/Prev` entries, missing EOF markers, or malformed startxref values cause pypdf to loop indefinitely.
- **Relevance to this project:** The `POST /analyze` endpoint accepts PDF uploads, which are parsed by pypdf in `backend/app/utils/pdf.py`. A user could upload a maliciously crafted PDF to exhaust the backend process's RAM or lock up the event loop.

Full CVE list (all fixed by `pypdf >= 6.10.2`):

| CVE | Summary | Min fix |
|---|---|---|
| CVE-2026-41314 | Manipulated FlateDecode image dimensions exhaust RAM | 6.10.2 |
| CVE-2026-41313 | Long runtimes for wrong size values in incremental mode | 6.10.2 |
| CVE-2026-41312 | Manipulated FlateDecode predictor parameters exhaust RAM | 6.10.2 |
| CVE-2026-41168 | Long runtimes for wrong size values in XRef/object streams | 6.10.1 |
| CVE-2026-40260 | Manipulated XMP metadata entity declarations exhaust RAM | 6.10.0 |
| CVE-2026-33699 | Infinite loop in DictionaryObject.read_from_stream | 6.9.2 |
| CVE-2026-33123 | Inefficient decoding of array-based streams | 6.9.1 |
| CVE-2026-31826 | Manipulated stream length values exhaust RAM | 6.8.0 |
| CVE-2026-28804 | Inefficient decoding of ASCIIHexDecode streams | 6.7.5 |
| CVE-2026-28351 | Manipulated RunLengthDecode streams exhaust RAM | 6.7.4 |
| CVE-2026-27888 | Manipulated FlateDecode XFA streams exhaust RAM | 6.7.3 |
| CVE-2026-27026 | Long runtimes for malformed FlateDecode streams | 6.7.1 |
| CVE-2026-27025 | Long runtimes/large memory for large /ToUnicode streams | 6.7.1 |
| CVE-2026-27024 | Infinite loop when processing TreeObject | 6.7.1 |
| CVE-2026-24688 | Infinite loop when processing outlines/bookmarks | 6.6.2 |
| CVE-2025-66019 | LZWDecode streams can exhaust RAM | 6.4.0 |
| CVE-2025-62708 | RAM exhaustion via manipulated LZWDecode streams | 6.1.3 |
| CVE-2025-62707 | Infinite loop reading DCT inline images without EOF marker | 6.1.3 |
| CVE-2025-55197 | Manipulated FlateDecode streams exhaust RAM | 6.0.0 |

### CVE-2025-71176 — pytest vulnerable tmpdir handling

- **Package:** `pytest` (currently `8.3.4`)
- **Fix:** upgrade to `>= 9.0.3`
- **Impact:** Insecure temporary directory handling in certain test configurations.
- **Relevance:** Dev/test only — pytest is not installed in the production Docker image (it's in `requirements.txt` which is also used for the test environment, but not in the final image layer that serves traffic). Lower risk, but worth patching to keep CI clean.

---

## LOW Severity

### pypdf — Infinite Loop / Long Runtime Edge Cases (3 issues)

All fixed by `pypdf >= 6.10.2`. Same package as the MEDIUM group.

| CVE | Summary |
|---|---|
| CVE-2026-27628 | Infinite loop loading circular /Prev entries in XRef streams |
| CVE-2026-22691 | Long runtimes for malformed startxref |
| CVE-2026-22690 | Long runtimes for missing /Root with large /Size values |

---

## Remediation Plan

When ready to patch (one PR, two version bumps):

```diff
# backend/requirements.txt
-python-multipart==0.0.20
+python-multipart==0.0.27

-pypdf==5.1.0
+pypdf==6.10.2

-pytest==8.3.4
+pytest==9.0.3
```

After bumping:
1. Run `pytest` to confirm no test breakage from the major pypdf version jump (API changes between 5.x → 6.x)
2. Run `trivy fs . --scanners vuln --severity HIGH,CRITICAL` to confirm all HIGH findings are cleared
3. Verify the PDF upload path still works end-to-end

---

## Workshop Teaching Points

**Why are these here?**
This is a deliberate snapshot of a real project with real, unpatched vulnerabilities — exactly what you'd find on a greenfield project that hasn't had a security review. Dependabot detected them automatically on push.

**What this shows:**
- Pinning exact versions (`==`) gives reproducibility but means you don't automatically get security fixes
- A single direct dependency (`pypdf`) can carry dozens of CVEs — transitive dependencies multiply this
- The attack surface matches the feature: because this app parses PDFs and accepts multipart uploads, those are exactly the libraries with vulnerabilities
- `pytest` in `requirements.txt` (not separated into `requirements-dev.txt`) means test tooling CVEs show up in the same scan as production code

**How to demo Dependabot:**
1. Go to the repo → Security tab → Dependabot alerts
2. Filter by severity — show the 2 HIGH alerts first
3. Click into CVE-2026-42561 — Dependabot links directly to the GitHub advisory and shows which line of `requirements.txt` is affected
4. Show that Dependabot can auto-open a PR to fix it (Dependabot PRs tab)
