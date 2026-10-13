---
name: OHC Motors
description: Racing-livery catalog for OHC Motors sport steering wheels, built phone first.
colors:
  livery-blue: "#214fa1"
  livery-blue-hover: "#2a63c9"
  signal-blue: "#3b7bff"
  livery-red: "#ed1c24"
  livery-white: "#eef1f4"
  gloss-black: "#0b0d11"
  panel-black: "#12151b"
  photo-well: "#0e1116"
  lit-chip-ground: "#182033"
  rule-line: "#262b33"
  keyline: "#2b313b"
  keyline-hover: "#5b6572"
  steel: "#9aa6b8"
  muted-label: "#8b95a3"
  soft-text: "#c9d0d8"
  pending-blue: "#afc8ff"
  whatsapp-green: "#25d366"
  whatsapp-green-hover: "#1fb855"
  whatsapp-ink: "#0b2416"
  whatsapp-link: "#3fd97a"
typography:
  display:
    fontFamily: "Bebas Neue, Impact, sans-serif"
    fontSize: "clamp(52px, 12vw, 104px)"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "0.025em"
  headline:
    fontFamily: "Bebas Neue, Impact, sans-serif"
    fontSize: "clamp(40px, 8vw, 72px)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "0.025em"
  title:
    fontFamily: "Bebas Neue, Impact, sans-serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.025em"
  body:
    fontFamily: "Montserrat, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  card-name:
    fontFamily: "Montserrat, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.375
  label:
    fontFamily: "Montserrat, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
  data:
    fontFamily: "Montserrat, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.06em"
    fontFeature: "\"tnum\" 1"
rounded:
  sm: "2px"
  md: "6px"
  full: "9999px"
spacing:
  gutter-phone: "20px"
  gutter-tablet: "32px"
  gutter-desktop: "48px"
  container: "1240px"
  card-pad: "14px"
  panel-pad: "16px"
  section-phone: "80px"
  section-desktop: "128px"
components:
  button-primary:
    backgroundColor: "{colors.livery-blue}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.livery-blue-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.livery-white}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
    height: "44px"
  button-whatsapp:
    backgroundColor: "{colors.whatsapp-green}"
    textColor: "{colors.whatsapp-ink}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    height: "44px"
  button-whatsapp-hover:
    backgroundColor: "{colors.whatsapp-green-hover}"
  decal-panel:
    backgroundColor: "{colors.panel-black}"
    textColor: "{colors.livery-white}"
    rounded: "{rounded.md}"
    padding: "{spacing.panel-pad}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.soft-text}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.lit-chip-ground}"
    textColor: "#ffffff"
  field:
    backgroundColor: "{colors.panel-black}"
    textColor: "{colors.livery-white}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  fitment-plate-cell:
    backgroundColor: "{colors.gloss-black}"
    textColor: "{colors.livery-white}"
    padding: "10px 12px"
---

# Design System: OHC Motors

## Overview

**Creative North Star: "The Homologation Decal Sheet"**

The public site wears OHC's racing livery. One stripe module (a blue field, a white hairline, a red field) crosses the screen at a fixed skew and carries the visitor's path: car, wheel, fit, WhatsApp. Everything else on the page is a decal applied to gloss-black bodywork: flat panels with a hairline keyline and one clipped corner, ruled fitment plates that read like a homologation sticker, and tabular data bands that put chassis, years and code in the same place on every product.

Persuasion comes from the real object, not the wrapper. The real 3D wheel and real product photos sit on plain black with no glow; the livery is the only loud thing, and it is loud on purpose: as tall painted lettering, as a lit underline on a selected chip, as a short rule under a committed choice. The ground stays black and quiet so the stripe and the product can both be read at a glance on a phone held in one hand.

The build explicitly refuses the dark-glow template it replaced: no light rays, blobs or radial glows behind content, no decrypt/split/blur text, no tilt or spotlight cards, no count-ups, no marquee.

**Key Characteristics:**
- Gloss-black ground, no glows; colour arrives only as livery.
- One stripe module, always whole, always skewed -8deg.
- Decal panels: flat, 1px inset keyline, 16px clipped top-right corner, 6px radius.
- Bebas Neue as painted livery lettering; Montserrat for everything you read or tap.
- Fitment data in ruled, tabular cells; missing values say "a confirmar", never a guess.
- State is a mark: selected lights the stripe, unselected is an outline.

## Colors

Three livery colours on a black-and-steel bodywork; the WhatsApp green is the only colour outside the livery and is reserved for the purchase channel.

### Primary
- **Livery Blue** (`livery-blue`): the top field of the stripe, the primary button, the selected-chip keyline, text selection and native checkbox accent. Hover deepens to the brighter **Livery Blue Lift** (`livery-blue-hover`).
- **Signal Blue** (`signal-blue`): functional only. Focus outline, input focus border and ring, caret, active nav underline, FAQ plus sign. Never a fill.

### Secondary
- **Livery Red** (`livery-red`): the bottom field of the stripe, the active hotspot dot, and the tint of error notices (at 10-35% alpha). It is never used for body text or as a standalone button.

### Tertiary
- **WhatsApp Green** (`whatsapp-green`) with **WhatsApp Ink** (`whatsapp-ink`) text: the WhatsApp button and floating button only. Inline WhatsApp links on cards use **WhatsApp Link Green** (`whatsapp-link`).

### Neutral
- **Gloss Black** (`gloss-black`): page ground, plate cells, mobile menu sheet, theme-color.
- **Panel Black** (`panel-black`): decal panels, form fields, alternating full-width bands.
- **Photo Well** (`photo-well`): the square behind product photos inside a card.
- **Lit Chip Ground** (`lit-chip-ground`): background of a selected chip and of the protocol number box.
- **Livery White** (`livery-white`): body text, headings, the stripe's hairline.
- **Soft Text** (`soft-text`): secondary paragraphs, field labels, unselected chip text.
- **Steel** (`steel`): data bands, captions, chip counts, select chevron.
- **Muted Label** (`muted-label`): plate cell labels and inactive list rows.
- **Pending Blue** (`pending-blue`): "a confirmar" values and inline text links.
- **Rule Line** (`rule-line`): section borders, card dividers, field borders, ghost button border.
- **Keyline** (`keyline`): plate rules and chip outlines. **Keyline Hover** (`keyline-hover`) on chip hover.

### Named Rules
**The Whole Stripe Rule.** Blue, white hairline and red always appear together, in that order, top to bottom. Never use one livery colour as a gradient, a glow or a solo band.

**The No-Glow Rule.** Colour never leaks into the ground. No radial blooms, coloured shadows or tinted blurs behind content; depth comes from the 3D scene and the photo, not from light effects.

**The Green Is the Till Rule.** WhatsApp green means "talk to OHC about this SKU". It appears on nothing else.

## Typography

**Display Font:** Bebas Neue (with Impact, sans-serif), self-hosted, weight 400 only.
**Body Font:** Montserrat (with system-ui, sans-serif), self-hosted, weights 400/600/700/800.

**Character:** Bebas is the livery lettering: tall, condensed, uppercase, painted on the stripe or set huge on black. Montserrat is the spec sheet: geometric, tabular where numbers matter, never decorative.

### Hierarchy
- **Display** (Bebas 400, `clamp(52px,12vw,104px)` on catalog; hero and footer reach `clamp(40px,10vw,112px)`; line-height 0.86): two-line livery titles painted on the stripe, one per page.
- **Headline** (Bebas 400, `clamp(40px,8vw,72px)` to `clamp(44px,9vw,104px)`, line-height 0.92): section headings on black, often capped at 9-10ch.
- **Title** (Bebas 400, 26-34px, line-height 1): the "Qual é o seu carro?" prompt, hotspot list items, brand group headings, plate values on the trust plate.
- **Body** (Montserrat 400, 16px, line-height ~1.6): paragraphs in Soft Text, capped at 44-48ch.
- **Card name** (Montserrat 700, 14-15px, line-height 1.375): product names inside cards; they wrap and hyphenate, never truncate.
- **Label** (Montserrat 600, 13px): field labels, nav links, chip text, button text (700, 14px).
- **Data** (Montserrat 600, 12px, uppercase, 0.06em tracking, tabular numerals): the data band holding SKU, chassis and years.

### Named Rules
**The Painted Lettering Rule.** Bebas is only ever display: titles, prompts and price-as-statement ("Sob consulta"). Product names, labels, buttons and data are Montserrat.

**The Tabular Code Rule.** Every SKU, year and protocol number uses tabular numerals; the SKU never breaks across lines.

## Layout

Phone first, single column, with a centred container of 1240px max and side gutters of 20px (phone), 32px (sm) and 48px (lg). Sections breathe vertically: roughly 80px on phones and 112-128px from md up; full-width bands in Panel Black with top and bottom Rule Line borders alternate with sections on Gloss Black.

The livery titles break the container: they are full bleed, with the skew's corners clipped by an overflow-hidden wrapper padded by 7.5vw so the band never adds horizontal scroll. Lettering inside the band still aligns to the container gutter.

On phones, product rows become a horizontal snap row (cards 72vw, max 300px) and filter chips become one swipeable row bleeding to the screen edge; from md up they turn into a 3-4 column grid and wrapping chip lists. The sticky header is 68px; anchors scroll with 84px padding so focus lands below it. Tap targets are at least 44px everywhere; form controls are 48px with 16px text so iOS does not zoom.

## Elevation & Depth

Flat. Surfaces sit on the same plane and are separated by tone (Gloss Black vs Panel Black vs Photo Well) and by 1px keylines drawn as inset box-shadows or 1px grid gaps, never by drop shadows. Real depth exists only inside the 3D wheel scene (a dark vignette at its edges) and, as functional exceptions, the floating WhatsApp button and the static fallback image of the wheel.

### Shadow Vocabulary
- **Decal keyline** (`box-shadow: inset 0 0 0 1px rgba(238,241,244,0.12)`): the edge of every decal panel.
- **Chip keyline** (`box-shadow: inset 0 0 0 1px #2b313b`, hover `#5b6572`, selected `#214fa1`): outline state for chips.
- **Field focus ring** (`box-shadow: 0 0 0 3px rgba(59,123,255,0.22)`): input and select focus.
- **Floating WhatsApp** (`box-shadow: 0 6px 18px rgba(0,0,0,.4)`): the only lifted element, so it reads above content while scrolling.

### Named Rules
**The Keyline-Not-Shadow Rule.** A panel is defined by a 1px inset keyline or by tone, never by a border plus a drop shadow.

## Shapes

Gently squared corners (6px) everywhere a visitor taps or reads: buttons, chips, fields, panels, plates. The one signature silhouette is the decal cut: a 16px clipped top-right corner on panels and cards, with the cut edge redrawn as a faint diagonal hairline inside the box. Livery bands are hard-edged parallelograms (skewY -8deg) with no radius. Full circles appear only on hotspot dots and the phone-size floating WhatsApp button. Small livery rules (9px tall, 2px radius) mark the current item in the mobile menu and committed choices.

## Components

### Buttons
Short, solid, squared; text does the work.
- **Shape:** gently squared (6px), min height 44px (48px in the car picker).
- **Primary:** Livery Blue fill, white Montserrat 700 14px, 14px/24px padding.
- **Hover / Focus:** hover lifts to Livery Blue Lift; press nudges 1px down; focus is a 2px Signal Blue outline offset 3px. Transitions 150ms on transform, background and border.
- **Ghost:** transparent with a Rule Line border; hover turns the border Steel.
- **WhatsApp:** WhatsApp Green with WhatsApp Ink text, 12px/20px padding; hover darkens. Used in the header (desktop), mobile menu, product page and final CTA.
- **Disabled:** 45% opacity, not-allowed cursor.

### Chips
- **Style:** transparent, Soft Text, 44px tall, 14px side padding, 1px inset Keyline; a tabular count in Steel sits inside.
- **State:** selected (`aria-pressed="true"`) gets Lit Chip Ground, white text, a Livery Blue keyline and a 4px livery stripe along its bottom edge. Colour and keyline change in 160ms.

### Cards / Containers
- **Corner Style:** 6px with the decal's 16px clipped corner.
- **Background:** Panel Black; the photo sits in a square Photo Well with 7% inner padding, `object-contain`.
- **Shadow Strategy:** none; decal keyline only (see Elevation & Depth).
- **Border:** internal dividers in Rule Line between body, data row and WhatsApp row.
- **Internal Padding:** 14px phone, 16px from sm.
- **Content order:** photo, name, fitment plate (application, years), data row (SKU left in the data band, price or "Consultar" right), then a full-width "Pedir no WhatsApp" row. Compact cards drop the plate and the WhatsApp row.

### Inputs / Fields
- **Style:** Panel Black fill, 1px Rule Line border, 6px radius, 48px tall, 16px text, 16px side padding; labels above in Montserrat 600 13px Soft Text. Selects draw their own Steel chevron.
- **Focus:** border turns Signal Blue with a 3px 22%-alpha Signal Blue ring.
- **Error:** a Livery Red tinted notice box (10% fill, 35% border, pale red text) below the form.

### Navigation
- **Desktop (xl+):** 68px sticky bar; logo left, Montserrat 600 13px links with a 2px Signal Blue underline on the current page, account link, WhatsApp button right. Transparent over the hero, then Gloss Black with a Rule Line bottom border once scrolled.
- **Mobile:** logo left, account icon and a 44px outlined menu button right. The menu is a full-screen Gloss Black sheet; items are Bebas `clamp(30px,8vw,48px)` rows ruled by Rule Line, the current one marked with a small livery rule, WhatsApp button at the foot. It closes instantly on Esc.

### Livery Title (signature)
The page's H1 (or final CTA) painted on the stripe: line one sits in the blue field, the white hairline (0.07em) runs between, line two sits in the red field; white Bebas, uppercase, line-height 0.86. Bands are built from the type's own size so lettering and stripe always register. On wide screens the hero draws the stripe behind the 3D canvas and lays the lettering on top. The stripe may paint across once (scaleX from the left, 700ms, ease-out) on page entry or on committing a car; reduced motion shows it already painted.

### Fitment Plate (signature)
A homologation-style plate: 2-4 ruled cells (Aplicação, Anos, Código) separated by 1px Keyline gaps on a 6px-radius plate, each cell with a 12px Muted Label `dt` and a 14px Montserrat 600 value. Missing values read "a confirmar" in Pending Blue. The code cell never wraps.

### Car Picker (signature)
"Qual é o seu carro?" as a working decal panel: Bebas prompt, brand select, optional model/chassis input, primary "Ver volantes" button, and a Steel note that the team confirms fit before purchase. Committing a car paints a livery rule along the panel's bottom edge, then navigates to the filtered catalog. A compact one-row variant drops the prompt and the model field.

## Do's and Don'ts

### Do:
- **Do** use the livery stripe whole (blue / white hairline / red) and at -8deg skew every time it appears.
- **Do** build containers as decal panels: Panel Black, 1px inset keyline at 12% Livery White, 16px clipped top-right corner, 6px radius.
- **Do** put application, years and code in a Fitment Plate or data band on every product, with "a confirmar" when unknown.
- **Do** mark selection with the lit stripe (Livery Blue keyline plus a 4px livery underline); leave unselected states as outlines.
- **Do** keep everything a visitor taps at 44px or taller, fields at 48px with 16px text.
- **Do** limit motion to the 3D scroll scene, the one-time stripe paint and short (about 160ms) colour or opacity changes, with a static path under `prefers-reduced-motion`.

### Don't:
- **Don't** add glows, light rays, blobs, radial gradients or coloured shadows to the ground.
- **Don't** use decrypt, split, blur-in or count-up text, tilt or spotlight cards, or a brand marquee.
- **Don't** combine a border with a drop shadow on a panel; use the keyline or tone.
- **Don't** set product names, buttons or data in Bebas; Bebas is painted lettering only.
- **Don't** use WhatsApp green for anything except the WhatsApp channel.
- **Don't** use a single livery colour as a solo band, gradient or text colour.
