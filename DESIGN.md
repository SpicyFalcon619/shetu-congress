---
name: Shetu
description: A bridge from her leave back to her career. Leave cover planning for managers and HR.
colors:
  crimson: "#bf092f"
  crimson-ink: "#a10727"
  crimson-deep: "#8c0622"
  blush: "#fbe6ea"
  rose: "#f2b8c3"
  rail: "#7a051d"
  rail-hover: "#8f0a26"
  rail-text: "#f9dfe4"
  leaf: "#1f7a48"
  leaf-soft: "#e1f3e7"
  gold: "#d99a1e"
  gold-soft: "#fbf0d8"
  gold-ink: "#7a520a"
  paper: "#f8f4ec"
  panel: "#ffffff"
  sunk: "#f3ede2"
  line: "#e7dfd2"
  line-strong: "#d6cbb9"
  ink: "#222023"
  ink-2: "#4a4448"
  muted: "#6f676a"
typography:
  headline:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: "24px"
  body:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
  micro:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: "16px"
  bangla:
    fontFamily: "Hind Siliguri, Nirmala UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  bubble: "16px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.crimson}"
    textColor: "{colors.panel}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.crimson-ink}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.sunk}"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.ink}"
  button-sm:
    padding: "0 10px"
    height: "28px"
  badge-neutral:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.ink-2}"
    typography: "{typography.micro}"
    rounded: "{rounded.sm}"
    padding: "0 6px"
    height: "20px"
  badge-crimson:
    backgroundColor: "{colors.blush}"
    textColor: "{colors.crimson-ink}"
    rounded: "{rounded.sm}"
  badge-gold:
    backgroundColor: "{colors.gold-soft}"
    textColor: "{colors.gold-ink}"
    rounded: "{rounded.sm}"
  badge-leaf:
    backgroundColor: "{colors.leaf-soft}"
    textColor: "{colors.leaf}"
    rounded: "{rounded.sm}"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.lg}"
  panel-header:
    padding: "16px 20px"
  input-text:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  nav-rail:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.rail-text}"
    width: "240px"
  nav-rail-item:
    textColor: "{colors.rail-text}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  nav-rail-item-hover:
    backgroundColor: "{colors.rail-hover}"
    textColor: "{colors.panel}"
  nav-rail-item-active:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.crimson-ink}"
  avatar:
    backgroundColor: "{colors.blush}"
    textColor: "{colors.crimson-ink}"
    rounded: "{rounded.full}"
    size: "32px"
---

# Design System: Shetu

## Overview

**Creative North Star: "The Bridge With Four Piers"**

Shetu (সেতু) means bridge, and the product is built around one: a leave is a span with four piers (map, cover, during, return), and the interface shows where the leave stands on that span before it shows any table. Everything else is a calm, dense operations tool that stays out of the way: paper ground, white panels drawn with hairlines, ink type at product density, and a deep crimson rail anchoring navigation.

Colour is state, not decoration. Crimson means "act here" or "this is blocked"; leaf green means a rule passes; gold means something waits for a person's decision. Surfaces are flat and quiet so that those three signals carry. The system is light only and carries no emoji; icons are Lucide line icons at 16px.

**Key Characteristics:**
- Paper ground, white hairline panels, deep crimson rail.
- Product density: 13px body, 11 to 15px UI, tabular figures everywhere.
- Crimson, leaf and gold are state colours with fixed meanings.
- The arch is a working control (the stage tabs), not an illustration.
- Light theme only; no emoji; Lucide line icons.

## Colors

A warm paper-and-ink neutral set carrying one brand crimson family and two signal hues.

### Primary
- **Shetu Crimson** (crimson): primary buttons, the filled arch and done piers, blocked piers, failing-rule markers, focus rings, caret, selected-tab underline. Action and blocking share this colour on purpose: both demand the manager.
- **Pressed Crimson** (crimson-ink): primary hover, and crimson text on light grounds (blocked notes, crimson badges, active rail item, avatars) where full crimson would be too loud for small type.
- **Deep Crimson** (crimson-deep): selection text; the darkest brand step.
- **Pale Blush** (blush): crimson badge and error-note ground, avatars, text selection.
- **Rose Hanger** (rose): the bridge hangers behind completed progress. Quiet structure only, never text or fills for controls.

### Rail
- **Rail Crimson** (rail): the 240px sidebar. **Rail Hover** (rail-hover) for item hover. **Rail Blush** (rail-text) for rail labels and secondary text.

### Signal
- **Leaf** (leaf) on **Leaf Mist** (leaf-soft): passing rules, confirmed duties, approved changes, closed leaves, within-capacity bars.
- **Harvest Gold** (gold) with **Gold Wash** (gold-soft) and **Gold Ink** (gold-ink): pending decisions, open change reports (rows stay washed gold until acknowledged), the "Synthetic demo data" chip, the planning status.

### Neutral
- **Paper** (paper): page ground and the translucent top bar.
- **Panel White** (panel): panels, inputs, secondary buttons.
- **Sunk Paper** (sunk): hover fill, selected stage tab, neutral badges, skeletons.
- **Hairline** (line): panel borders, dividers, table rules, empty bridge track.
- **Strong Hairline** (line-strong): input and secondary-button borders, waiting piers, scrollbar.
- **Ink** (ink), **Ink 2** (ink-2), **Muted** (muted): primary text, secondary text, captions and table heads.

### Named Rules
**The Three Signals Rule.** Crimson is action or blocking, leaf is passing, gold is pending. Never use one of them for another meaning, and never add a fourth signal hue.

**The Readable Green Rule.** The deck's green (#2E9E5B) shipped as the darker leaf (#1f7a48) so small text on leaf-soft meets WCAG AA. Use leaf, not the deck green, for text and icons.

## Typography

**UI Font:** Plus Jakarta Sans (with Segoe UI, system-ui)
**Bangla Font:** Hind Siliguri (with Nirmala UI)

**Character:** A friendly geometric grotesque held at product sizes; weight, not size, carries hierarchy. Hind Siliguri sits beside it for the সেতু wordmark and Bangla summaries.

### Hierarchy
- **Headline** (800, 24px, 1.25, -0.02em, balanced): page titles only, one per page.
- **Title** (700, 15px, 24px): panel headers. Smaller panel and inspector headers use 13px bold.
- **Body** (400, 13px, 1.5): nearly all UI text, table cells, inputs, chat bubbles. The document root is 14px.
- **Label** (600, 12px): button-sm text, stage notes, secondary metadata.
- **Micro** (600, 11px, 16px): badges, table column heads (muted, sentence case), rail footer.
- **Bangla** (400, 15px, relaxed): Bangla summaries; wordmark at 17px semibold.

### Named Rules
**The Tabular Rule.** `font-variant-numeric: tabular-nums` is set on body; dates, counts and hours must align in columns. Do not switch it off.

**The Sentence Case Rule.** Labels, table heads and badges are sentence case with normal tracking. There are no uppercase tracked labels and no eyebrow lines above headings.

## Layout

Desktop-first app shell: a fixed 240px crimson rail (from 1024px), a 56px sticky top bar on translucent paper with a backdrop blur, and main content capped at 1320px with 16px gutters (32px from 640px) and 24 to 32px top padding. Below 1024px the rail becomes a horizontal tab strip under the top bar with a 2px crimson underline on the current item.

Spacing rhythm is 4px-based: 6 and 8px inside controls, 12px between inline groups, 20px panel padding and between panels (gap-5), 32px page gutters. The leave workspace stacks header, full-width bridge, then a two-column split of stage work (left) and rules inspector (right).

## Elevation & Depth

Flat and tonal. Depth comes from paper versus white panel versus sunk fill, separated by hairlines. The only shadows are 1px contact shadows on buttons and the persona select, so they read as pressable; panels never cast shadows.

### Shadow Vocabulary
- **Crimson contact** (`box-shadow: 0 1px 2px rgba(122,5,29,.25)`): primary button only.
- **Ink contact** (`box-shadow: 0 1px 2px rgba(34,32,35,.06)`): secondary button and persona select.

### Named Rules
**The Hairline Rule.** Panels separate by a 1px line border on white, never by shadow.

## Shapes

Gently rounded throughout: 12px panels and the bridge frame, 8px buttons, inputs, rail items and stage tabs, 6px badges and chips, full circles for avatars, piers and rule markers. Chat bubbles use 16px with one 2px tucked corner on the speaker side. Lines in the bridge use round caps.

## Components

### Buttons
Compact and solid.
- **Shape:** gently curved (8px), 36px tall (28px small), 13px semibold (12px small), 6px icon gap.
- **Primary:** crimson fill, white text, crimson contact shadow; hover to crimson-ink.
- **Secondary:** white with strong hairline border and ink contact shadow; hover to sunk.
- **Ghost:** ink-2 text, no border; hover sunk fill and ink text.
- **Busy / Disabled:** a 14px spinning ring precedes the label; disabled at 50% opacity with not-allowed cursor.
- **Focus:** global 2px crimson outline, 2px offset.

### Badges
- **Style:** 20px tall, 6px radius, 11px semibold, tinted ground with matching ink: neutral (sunk/ink-2), crimson (blush/crimson-ink), gold (gold-soft/gold-ink), leaf (leaf-soft/leaf). An optional 12px icon may lead.

### Panels
- **Corner Style:** 12px.
- **Background:** panel white on paper.
- **Border:** 1px hairline; a pending-decision panel may take a gold border at 60% with a gold-soft header wash.
- **Header:** 16px by 20px padding, hairline bottom border, title plus optional muted 13px description and right-aligned actions.
- **Lists inside:** rows divided by hairlines, 12 to 16px vertical padding.

### Inputs / Fields
- **Style:** white, 1px strong hairline, 8px radius, 8px by 12px padding, 13px text, muted placeholder.
- **Focus:** border shifts to crimson.
- **Error:** ErrorNote, a blush panel with crimson-ink text and a 16px alert icon, role alert.

### Navigation
- **Rail:** rail crimson, logo plus Shetu wordmark and সেতু in Hind Siliguri, 36px items at 13px semibold with 16px icons. Hover rail-hover with white text; active item is a white pill with crimson-ink text. The footer carries the persona and the synthetic-data line.
- **Top bar:** gold synthetic-data chip and persona select at the right.
- **Mobile:** tab strip, muted labels, current item in ink with a crimson 2px bottom border.

### Rule Inspector
Each rule row has a 20px round marker: leaf-soft with leaf check when passing, solid crimson with white cross when failing. The header states "All passing" in leaf or "N failing" in crimson-ink.

### The Bridge (signature)
A full-width SVG arch over an ink deck in a panel, four piers sitting over four equal-width stage tabs so they align at every width.
- **Progress:** the crimson arch draws from the start to the current pier (to the end when closed) over 1s on the expo ease; hangers behind progress turn rose, those ahead stay hairline.
- **Pier states:** done is solid crimson; active is a white pier with a crimson ring; blocked is solid crimson with a 30% crimson halo and a crimson-ink note naming the blocking rule; waiting is a white pier with a strong-hairline ring.
- **Tabs:** the piers' labels are a real tablist (arrow keys move between stages). Selected tab gets a sunk fill and a 40px crimson underline; tab icons mirror pier states (crimson check disc, crimson alert triangle, crimson ring, hairline ring).
- **Mobile:** the arch hides and the tabs become a 2 by 2 grid.
- **Stage Dots:** the compact form for tables, 10px dots joined by 20px connectors that turn crimson after a done stage; blocked adds a 4px crimson ring at 20%.

### Change Rows
Reported changes during leave sit on a gold-soft wash with a gold "Waiting for decision" badge until acknowledged, then return to white with a leaf or neutral badge.

## Do's and Don'ts

### Do:
- **Do** keep crimson for action and blocking, leaf for passing, gold for pending (The Three Signals Rule).
- **Do** separate surfaces with a 1px hairline on white panels; keep panels shadowless.
- **Do** set UI text at 13px with tabular figures; let weight (600 to 800) carry hierarchy.
- **Do** use Lucide line icons at 16px (12px inside badges and markers), always paired with a text or aria label.
- **Do** keep the bridge a working control with real states and keyboard tabs.
- **Do** show the synthetic-data notice on every screen.
- **Do** set Bangla in Hind Siliguri via the bangla font token.

### Don't:
- **Don't** use emoji anywhere in the interface.
- **Don't** add a dark theme; the system is light only.
- **Don't** put uppercase tracked eyebrow labels above headings.
- **Don't** mark rows or cards with coloured side stripes; state lives in badges, markers, washes and the bridge.
- **Don't** use the deck green (#2E9E5B) for text; use leaf.
- **Don't** use rose for text or controls; it is the hangers' structural tint.
