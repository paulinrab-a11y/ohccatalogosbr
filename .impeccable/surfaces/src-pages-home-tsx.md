---
version: 1
slug: "src-pages-home-tsx"
primary_target: "src/pages/Home.tsx"
related_targets: ["src/pages/Catalogo.tsx","src/pages/Produto.tsx","src/pages/Compatibilidade.tsx"]
---

# Surface brief: site público OHC (home, catálogo, produto, compatibilidade)

Scope: public site, mobile first. Visitor mode: Persuade (home), with Operate-grade catalog filtering.
Audience/job: enthusiast from Instagram finds the wheel for their car, checks fit, opens WhatsApp. Proof: real photos, real 3D wheel, fitment data (chassis, years, SKU), human compatibility check.
Constraints: keep 3D wheel scroll scene and GLB; brand blue/red/white on black, Bebas Neue + Montserrat, original logo; no invented claims; Whynot Visuals credit.

## Direction contract

THESIS: The site wears OHC's racing livery: one blue-white-red stripe crosses the screen and carries the path car → wheel → fit → WhatsApp. Refuses the dark-glow template (rays, blobs, eyebrow labels, decrypt/blur text, tilt cards, count-ups, marquee).
OWN-WORLD: Gloss-black ground #0b0d11 with no glows; livery stripe = blue #214fa1 / white hairline #eef1f4 / red #ed1c24 band at a fixed -8° skew, built from one stripe module repeated whole; colour fields own ≥30% of decision screens. Decal language: white-keyline cut panels with one clipped corner, 6px radius, flat (no shadow+border). Bebas set huge as livery lettering; Montserrat 600 tabular data bands (chassis · years · SKU) on every product. State is a mark: selected = stripe lit, unselected = outline.
STORY: Visitor sees their kind of wheel turning, reads "O volante do seu carro" painted on the stripe, picks their car in the field under it, lands on a filtered catalog, opens a product with its fitment band, confirms fit, talks on WhatsApp. The site remembers their car.
FIRST VIEWPORT: Phone 390×844: slim nav (logo left, menu 44px right); real 3D wheel top ~45%; livery band crossing at ~45-75% with H1 in white Bebas ~76px painted on it; directly below, the working "Qual é o seu carro?" decal field (brand → model) as primary action; secondary "Ver catálogo" outline. Desktop: band runs full width behind the wheel, field sits on the band's lower edge.
FORM: Racing livery & homologation decal sheet, candidate 4 of 7 on my list. seed: none (unavailable)
Signature interaction: the stripe paints across (one transform wipe) when the visitor commits a car; filter chips light their stripe. Motion grammar: 3D scroll scene + stripe wipe only; everything else 160ms fades, reduced-motion = static.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
