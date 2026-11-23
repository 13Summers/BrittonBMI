# BrittonBMI — Home (HTML/CSS/JS)

Built from the Figma file **Britton BMI Website**, page **Home**, frame **Britton - Home** (Desktop 1440).
Motion modeled on barberhauler.com. Static, no build step: open `index.html`.

```
britton-bmi-site/
├── index.html          single page, semantic sections in Figma order
├── css/styles.css      tokens (Figma variable names), components, sections, motion, responsive
├── js/main.js          split text, scroll reveals, parallax, marquee, count-up, header, mobile menu
├── assets/images/      photos (stand-ins), logos, logos/ (13 trust logos)
├── README.md
└── ASSETS.md           what's final vs. stand-in
```

## Motion (modeled on barberhauler.com)
- **Hero headline** reveals letter by letter from behind a mask (0.7s, 0.03s stagger — the same values Barber Hauler uses).
- **Section headings** rise line by line from masks as they scroll into view.
- **Buttons**: the block scales in from the left, then the label slides up; on hover a fill sweeps across.
- **Photos** open with a clip-path wipe while the image settles from 125% scale, then drift with scroll parallax.
- **Panel stack**: How We Work pins to the screen and holds for half a screen of scrolling, then Full-Service Care slides up over it. Full-Service Care then pins and holds the same way while Who We Serve slides over it. Each covered panel recedes (scales to 94% and dims), like Barber Hauler's advisory panels. Panels taller than the screen (on phones) pin by their bottom edge so nothing is skipped; the hold is a third of a screen on phones. Change it with `HOLD` in `js/main.js`.
- **Services panel** wipes open from the right; its copy and checklist cascade in after it.
- **Process** connector lines draw across and the numbered circles pop, step by step.
- **Stats** count up (35+, 100%).
- **Header** slides away on scroll down, returns on scroll up.
- **Trust logos**: seamless, slow auto-scroll (32 px/s), pauses on hover/focus, faded edges.
- **Smooth scrolling** via Lenis (loaded from jsDelivr). If the CDN is unavailable the page falls back to native scrolling with everything else intact.
- **Mobile**: cards slide in from alternating sides, checklist and value-bar lines sweep in, each process step draws as it reaches the screen, menu items drop in, and buttons/cards respond to taps.
- `prefers-reduced-motion`: all motion is switched off and the logo strip becomes a manual scroller.

## Breakpoints
No mobile frame exists in Figma, so these are defaults:
- ≥1280: as designed. 1100–1279: tighter page margin and type.
- ≤1100: orange band and footer stack.
- ≤960: About and CTA photos move above their copy; process steps stack; sector grid 2-up.
- ≤767: mobile header with menu, single-column everything.

## Decisions to review
1. **Photos** are the full images supplied by the client (1×, 1440px wide for the full-bleed ones). Retina 2× versions with the same names would sharpen them.
2. **Fonts**: Georgia and Calibri are used as designed (system fonts). Gelasio and Carlito (metric-compatible, OFL) are self-hosted in `assets/fonts` as fallbacks so line breaks match the design everywhere.
3. **Nav anchors**: Services → services section, Why Britton BMI → the orange "Consistency" band, About Us → "Who we are". Other pages don't exist yet.
4. **"Schedule a walk-through" / "Contact us"** open an email to TellMeMore@brittonbmi.com — swap for a form or contact page when ready. Footer legal, social and **Careers** links are `#` placeholders. The header **Contact Us** button jumps to the contact section.
5. Hidden Figma layers were not built (alternate buttons, the "Speak to an Expert" block, DFW/5 stat cards, decorative "11" icons).
7. **Hero paragraph** is capped at 545px so it breaks on the same words as the Figma render.
