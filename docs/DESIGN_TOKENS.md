# Design Tokens & Logo Asset System

This document specifies the design tokens, visual policies, dimensional standards, and asset variant scheme for organisation logos across the UAE Capability Census platform (Cycle 9, Lane C).

---

## 1. Visual Policy & Grayscale Interaction

The application adheres to a clean, high-contrast neutral interface policy:
- **Baseline Display**: All logos render on a fixed neutral tile in grayscale (`filter: grayscale(1)`, `opacity: 0.9`) to maintain visual harmony and avoid competing brand hues across dense dashboard listings.
- **Hover & Focus Interaction**: Full original brand colours and 100% opacity are restored when the logo tile or its enclosing interactive element (`<a>`, `<button>`, `tr`, `.card`, `[data-card]`) is hovered or receives `:focus-visible`.
- **Motion & Transitions**:
  - Transition duration: `150ms ease` on `filter` and `opacity`.
  - The transition explicitly **never touches** `outline-color` or border focus rings.
- **Implementation**: Styled through `src/components/uae/org-logo.css` via classes `.org-logo-tile` and `.org-logo-img`.

---

## 2. Standard Tile Dimensions

Logo tiles are rendered in square dimensions tailored to layout hierarchy:

| Layout Context | Token / Size Prop | Rendered Size | Primary Variant | Typical Usage |
| :--- | :--- | :--- | :--- | :--- |
| **List / Table View** | `size={28}` | 28 × 28 px | `list-64.png` (1x) / `list-128.png` (2x) | Overview lists, comparison table rows, navigation items |
| **Card View** | `size={44}` | 44 × 44 px | `list-128.png` | Watchlist cards, organisation directory grid cards |
| **Dossier / Header** | `size={64}` | 64 × 64 px | `card-512.png` | Organisation dossier header, detailed profiles |
| **Default Fallback** | `size={40}` | 40 × 40 px | `list-64.png` / `list-128.png` | Standard inline avatar |

---

## 3. Allowed Colour Palette Tokens

The design system enforces a disciplined white/grayscale palette:

| Token Name | Hex Value | Role & Usage Restrictions |
| :--- | :--- | :--- |
| **Background Neutral** | `#FFFFFF` | Default logo tile background, card backgrounds |
| **Border Neutral** | `#E5E5E5` | 1 px border on logo tiles, dividers, card boundaries |
| **Tile Placeholder** | `#F9F9F9` | Monogram tile background for unresolved entities |
| **Text Primary** | `#0D0D0D` | Monogram initials (Inter / system-ui, 600 weight), primary headings |
| **Text Muted** | `#6E6E71` | Secondary captions, metadata text |
| **Text Subdued** | `#8C8C8E` | Tertiary notes, provenance timestamps |
| **Interactive Blue** | `#2563EB` | **Links and keyboard focus rings ONLY**. Never decorative fills. |
| **Error / Alert Red** | `#B91C1C` | **Validation and critical system errors ONLY**. |

---

## 4. Logo Asset Architecture & Variant Scheme

Each organization is housed in `public/logos/<slug>/`:

```
public/logos/<slug>/
├── original.<ext>    # Untouched source asset (SVG, PNG, WEBP, or ICO)
├── card-512.png      # 512×512 square PNG (contained in 400×400, padded, uncropped)
├── list-128.png      # 128×128 square PNG (contained in 100×100, retina 2x)
├── list-64.png       # 64×64 square PNG (contained in 50×50, standard 1x)
└── monogram.svg      # (For unresolved entities) 512×512 flat SVG placeholder
```

### Resizing & Canvas Rules
- **Containment & Zero Distortion**: The source logo is fitted inside the inner target area (`fit: "contain"`) and centered on a transparent canvas. Aspect ratios are strictly preserved; logos are never stretched, cropped, or recoloured.
- **Card Variant (`card-512.png`)**: Fits within 400 × 400 px, centered on a 512 × 512 px canvas with 56 px padding on each side.
- **List Retina (`list-128.png`)**: Fits within 100 × 100 px, centered on a 128 × 128 px canvas with 14 px padding on each side.
- **List Standard (`list-64.png`)**: Fits within 50 × 50 px, centered on a 64 × 64 px canvas with 7 px padding on each side.
- **Vector Density**: All SVGs are rasterized at `density >= 300` DPI using Sharp.
- **ICO Handling**: 256 px entries are extracted via PIL `im.ico.getimage((256, 256))`.

### Legacy Backwards Compatibility
- `public/logos/uae/<slug>.png` stores a high-resolution copy (`list-128.png`) for all resolved organisations, ensuring legacy code referencing `/logos/uae/*.png` renders crisp retina assets.

---

## 5. Metadata & Provenance Manifest

- **`public/logos/manifest.json`**: Static manifest containing:
  - `generated_at`: ISO 8601 UTC timestamp.
  - `policy`: `"grayscale-by-default-colour-on-hover"`.
  - `items`: Map of `<slug>` -> `{ status, source_url, source_tier, retrieved_at, format, width, height, sha256, license_note, files, entity_check }`.
  - `unresolved`: Slugs of entities using monogram fallbacks.
- **`src/data/uae_cc_v1/logos.json`**: Application-accessible data bundle loaded by `src/lib/uae/logos.ts`.
