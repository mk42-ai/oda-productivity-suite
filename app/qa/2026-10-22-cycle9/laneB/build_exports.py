#!/usr/bin/env python3
"""
Lane B: Generates master XLSX workbook and CSV export.
Uses xlsx_builder from xlsx-report-generator skill.
"""

import csv
import json
import os
import sys

# Add xlsx_builder skill path
sys.path.insert(0, "/home/appuser/work/6692b763e851d28a036ab30e/6ad835717bb80aa7c2d979d0/.goose/skills/xlsx-report-generator/scripts")
import xlsx_builder

APP_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
REPO_ROOT = os.path.dirname(APP_DIR)
DOCS_DATA_DIR = os.path.join(REPO_ROOT, "docs", "data")
DATA_DIR = os.path.join(APP_DIR, "src", "data", "uae_cc_v1")

os.makedirs(DOCS_DATA_DIR, exist_ok=True)

# Load master.json and orgs.json (for before coverages)
with open(os.path.join(DATA_DIR, "master.json"), "r", encoding="utf-8") as f:
    master_data = json.load(f)

with open(os.path.join(DATA_DIR, "orgs.json"), "r", encoding="utf-8") as f:
    orgs_raw = json.load(f)["organizations"]

orgs_before_cov = {o["id"]: round(o.get("coverage", 0) * 100, 1) for o in orgs_raw}

orgs = master_data["organizations"]

# 1. Sheet: Organizations
orgs_header = [
    "slug", "legal_name", "brand_name", "type", "sector", "hq_city", "emirate", "free_zone",
    "founded", "founders", "ceo", "ownership_parent", "headcount_band", "products", "models",
    "website", "linkedin_url", "x_url", "youtube_url", "github_url", "emails", "phones",
    "funding_rounds_count", "partnerships_count", "announcements_count", "sources_count",
    "coverage_pct", "confidence", "last_verified_at"
]

orgs_rows = []
for o in orgs:
    row = [
        o["slug"],
        o["legal_name"],
        o["brand_name"],
        o["type"],
        o["sector"],
        o["hq_city"],
        o["emirate"],
        o["free_zone"],
        o["founded"],
        " | ".join(o["founders"]) if o["founders"] else "unverified — no official source found",
        o["ceo"],
        o["ownership_parent"],
        o["headcount_band"],
        " | ".join(o["products"]) if o["products"] else "unverified — no official source found",
        " | ".join(o["models"]) if o["models"] else "none (no HF open models)",
        o["website"],
        o["linkedin_url"],
        o["x_url"],
        o["youtube_url"],
        o["github_url"],
        " | ".join(o["emails"]) if o["emails"] else "unverified — no official source found",
        " | ".join(o["phones"]) if o["phones"] else "unverified — no official source found",
        len(o.get("funding_rounds", [])),
        len(o.get("partnerships", [])),
        len(o.get("announcements", [])),
        len(o.get("sources", [])),
        o["coverage_pct"],
        o["confidence"],
        o["last_verified_at"]
    ]
    orgs_rows.append(row)

# 2. Sheet: Leadership
lead_header = ["slug", "org_name", "name", "role", "linkedin_url", "source_url", "as_of"]
lead_rows = []
for o in orgs:
    for l in o.get("leadership", []):
        lead_rows.append([
            o["slug"],
            o["brand_name"],
            l.get("name", ""),
            l.get("role", ""),
            l.get("linkedin_url", "unverified — lookup rate-limited"),
            l.get("source_url", ""),
            l.get("as_of", "")
        ])

# 3. Sheet: Funding
fund_header = ["slug", "org_name", "round", "amount", "currency", "date", "investors", "source_url", "status"]
fund_rows = []
for o in orgs:
    for r in o.get("funding_rounds", []):
        fund_rows.append([
            o["slug"],
            o["brand_name"],
            r.get("round", ""),
            str(r.get("amount", "")),
            r.get("currency", ""),
            r.get("date", ""),
            " | ".join(r.get("investors", [])),
            r.get("source_url", ""),
            r.get("status", "")
        ])

# 4. Sheet: Partnerships
part_header = ["slug", "org_name", "partner", "date", "status", "source"]
part_rows = []
for o in orgs:
    for p in o.get("partnerships", []):
        part_rows.append([
            o["slug"],
            o["brand_name"],
            p.get("partner", ""),
            p.get("date", ""),
            p.get("status", ""),
            p.get("source", "")
        ])

# 5. Sheet: Announcements
ann_header = ["slug", "org_name", "date", "title", "url", "source"]
ann_rows = []
for o in orgs:
    for a in o.get("announcements", []):
        ann_rows.append([
            o["slug"],
            o["brand_name"],
            a.get("date", ""),
            a.get("title", ""),
            a.get("url", ""),
            a.get("source", "")
        ])

# 6. Sheet: Sources
src_header = ["slug", "org_name", "url", "publisher", "published_at", "retrieved_at"]
src_rows = []
for o in orgs:
    for s in o.get("sources", []):
        src_rows.append([
            o["slug"],
            o["brand_name"],
            s.get("url", ""),
            s.get("publisher", ""),
            s.get("published_at", ""),
            s.get("retrieved_at", "")
        ])

# 7. Sheet: Logos
logo_header = ["slug", "org_name", "status"]
logo_rows = []
for o in orgs:
    logo_rows.append([
        o["slug"],
        o["brand_name"],
        o.get("logo", {}).get("status", "pending-lane-c")
    ])

# 8. Sheet: Coverage
cov_header = ["slug", "org_name", "coverage_pct_before", "coverage_pct_after", "missing_fields"]
cov_rows = []

fields_to_check = [
    "legal_name", "brand_name", "slug", "type", "sector", "hq_city", "emirate", "free_zone",
    "founded", "founders", "ceo", "leadership", "ownership_parent", "headcount_band",
    "products", "models", "funding_rounds", "partnerships", "announcements", "website",
    "linkedin_url", "x_url", "youtube_url", "github_url", "emails", "phones", "logo", "sources",
    "confidence", "last_verified_at"
]

for o in orgs:
    missing = []
    for f in fields_to_check:
        val = o.get(f)
        is_cov = False
        if isinstance(val, str):
            if val and not val.startswith("unverified") and val not in ("unavailable", "unknown"):
                is_cov = True
        elif isinstance(val, list):
            if len(val) > 0:
                is_cov = True
        elif isinstance(val, dict):
            if val and val.get("status") != "unverified":
                is_cov = True
        elif isinstance(val, (int, float)):
            if val > 0:
                is_cov = True
        if not is_cov:
            missing.append(f)

    cov_rows.append([
        o["slug"],
        o["brand_name"],
        orgs_before_cov.get(o["slug"], 0),
        o["coverage_pct"],
        " | ".join(missing) if missing else "none (100% complete)"
    ])

# Build the spec for xlsx_builder
spec = {
    "style": "plain",
    "sheets": [
        {
            "name": "Organizations",
            "header": orgs_header,
            "rows": orgs_rows,
            "as_table": True,
            "frozen_top_row": True
        },
        {
            "name": "Leadership",
            "header": lead_header,
            "rows": lead_rows,
            "as_table": True,
            "frozen_top_row": True
        },
        {
            "name": "Funding",
            "header": fund_header,
            "rows": fund_rows,
            "as_table": True,
            "frozen_top_row": True
        },
        {
            "name": "Partnerships",
            "header": part_header,
            "rows": part_rows,
            "as_table": True,
            "frozen_top_row": True
        },
        {
            "name": "Announcements",
            "header": ann_header,
            "rows": ann_rows,
            "as_table": True,
            "frozen_top_row": True
        },
        {
            "name": "Sources",
            "header": src_header,
            "rows": src_rows,
            "as_table": True,
            "frozen_top_row": True
        },
        {
            "name": "Logos",
            "header": logo_header,
            "rows": logo_rows,
            "as_table": True,
            "frozen_top_row": True
        },
        {
            "name": "Coverage",
            "header": cov_header,
            "rows": cov_rows,
            "as_table": True,
            "frozen_top_row": True
        }
    ]
}

xlsx_path = os.path.join(DOCS_DATA_DIR, "uae-ai-organizations-master.xlsx")
csv_path = os.path.join(DOCS_DATA_DIR, "uae-ai-organizations-master.csv")

print(f"Building XLSX: {xlsx_path} ...")
xlsx_builder.build(spec, xlsx_path)
xlsx_builder.ensure_openable(xlsx_path)

print(f"Building CSV: {csv_path} ...")
with open(csv_path, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(orgs_header)
    writer.writerows(orgs_rows)

print("Export complete!")
print(f"XLSX size: {os.path.getsize(xlsx_path) / 1024:.1f} KB")
print(f"CSV size: {os.path.getsize(csv_path) / 1024:.1f} KB")
print(f"Row counts:")
print(f"  Organizations: {len(orgs_rows)} rows")
print(f"  Leadership:    {len(lead_rows)} rows")
print(f"  Funding:       {len(fund_rows)} rows")
print(f"  Partnerships:  {len(part_rows)} rows")
print(f"  Announcements: {len(ann_rows)} rows")
print(f"  Sources:       {len(src_rows)} rows")
print(f"  Logos:         {len(logo_rows)} rows")
print(f"  Coverage:      {len(cov_rows)} rows")
