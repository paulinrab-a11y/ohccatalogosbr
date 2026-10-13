# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: car enthusiasts in Brazil who own a sport or premium car (BMW, Mercedes-Benz, Audi, Ford Mustang, Chevrolet Corvette, Porsche, Lamborghini, RAM, Honda and others) and arrive mostly from OHC Motors' Instagram posts and Reels, usually on a phone. Their job: find the steering wheel made for their car, see real photos and details of it, confirm it fits their exact model/year/generation, and then talk to OHC on WhatsApp to close the purchase. (Confirmed by the owner, 13/10/2026.)

## Product Purpose

A catalog site for OHC Motors' sport steering wheels (leather, carbon fibre, Alcântara, some with shift light and paddle shifters), Mercedes grilles with LED and automotive accessories. The site exists to turn an Instagram visitor into a WhatsApp conversation about a specific SKU, after a compatibility check. Success: the visitor finds their car's wheel quickly on a phone and starts the WhatsApp/compatibility flow with the right SKU.

## Positioning

OHC Motors makes its own wheels ("volantes fabricados pela OHC Motors") and checks fitment by a human before any payment: the visitor sends brand, model, year, version and photos of the current wheel, and the team confirms which SKU fits. Stock and dispatch are in Brás, São Paulo; there is no physical showroom; service is by WhatsApp with shipping to all of Brazil.

## Operating Context

- Visitors come from Instagram (Reels and posts) on mobile; desktop is secondary.
- Purchase happens outside the site: WhatsApp conversation, payment link by InfinitePay (PIX with discount or up to 12x on card).
- Compatibility requests go through `/compatibilidade` (form with photos, protocol number) and are answered by staff.
- Customers can create an account (Supabase Auth, OTP) and track requests in `/minha-conta`; there is a separate admin area.

## Capabilities and Constraints

- Stack: Vite + React 18 + TypeScript + Tailwind 4, custom router, Vercel serverless APIs, Supabase (catalog table `catalog_products`, Auth). Workflow is issue → branch → PR → Vercel preview; merges to `main` publish and need the owner's authorization.
- Catalog data comes from Supabase; products without SKU are hidden. Some items use internal codes (`ACS.*`, `PROV.*`).
- Prices are mostly "Consultar"/"Sob consulta". No checkout, cart or online payment; do not add them.
- Compatibility is never an automatic promise; it is confirmed by a person.
- The real 3D model `public/models/steering-wheel-original.glb` must not be replaced or redesigned.
- Nine wheels from PR #7 and five more still wait for names from the owner; never invent names, materials, LEDs or fitment.

## Brand Commitments

- Original OHC Motors logo (`public/ohc-logo.webp`).
- Dark site, brand blue (#214fa1 / #3b7bff) and red (#ed1c24), Bebas Neue and Montserrat.
- Real product photos only.
- The 3D steering wheel that turns with scroll on the home page stays (owner chose to keep it, 13/10/2026). Other current effects (light rays, glows, decrypt/split/blur text, count-up stats, tilt/spotlight cards, brand marquee, loader) are not commitments.
- Footer credit "Desenvolvido por Whynot Visuals" stays.
- Owner wants a redesign of the visual wrapper because the current site "looks AI-made" (13/10/2026).

## Evidence on Hand

- Product photos per SKU in `public/img/p/<SKU>.webp` (plus `-2` alternates), mostly cut-outs on black or supplier photos on white.
- Confirmed policies: PIX with discount or up to 12x via InfinitePay; 90 days warranty against manufacturing defects; 7 days to regret purchase (CDC); shipping to all of Brazil; no installation service (installers indicated in São Paulo).
- Real detail facts for the BMW M3 featured wheel (3.02.B02.00002): shift light display, Alcântara grips, carbon fibre, M tricolour stitching.
- No testimonials, reviews, sales numbers, customer photos or press exist; do not fabricate them.

## Product Principles

1. The car comes first: the fastest path is "my car → my wheel → confirm fit → WhatsApp".
2. Show the real object: real photos and the real 3D model carry the persuasion; decoration never competes with them.
3. Honest fitment: say what is confirmed, ask for what is not, never promise compatibility.
4. Phone first: every flow must be smooth and readable one-handed on a mid-range phone.

## Accessibility & Inclusion

WCAG 2.2 AA as the working standard; respect `prefers-reduced-motion`; text contrast ≥ 4.5:1; tap targets ≥ 44px.
