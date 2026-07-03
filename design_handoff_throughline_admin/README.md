# Handoff: Throughline Administrator (internal admin console)

## Overview
Internal ops console for the Throughline product family. It lets a small internal team:
1. **Administer subscribers** — search/filter, edit profile (plan, companion, status), suspend/reactivate, refund, cancel, impersonate ("view as"), invite new subscribers.
2. **Monitor subscriber progress** — three canonical metrics per subscriber: time engaged, photographs attached, chapters completed; plus family members added through companion dialogue and per-product engagement.
3. **Monitor all Throughline data sources and error logs** — ingestion counters, service health for all pipelines/products, and a filterable error log.

## About the Design Files
`design-reference/Throughline Administrator.dc.html` is a **design reference created in HTML** — a working prototype showing intended look and behavior, not production code to copy directly. The task is to **recreate this design in a production web stack** (see `CLAUDE_CODE_PROMPT.md` for the full build brief, backend schemas, and data-source wiring). The file uses a proprietary streaming-component runtime (`support.js`) and will not render standalone; treat it as the source of truth for markup structure, inline styles, copy, and interaction logic (the `class Component` script at the bottom contains all state, seed data, and handlers).

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and interactions are final and follow the Throughline Brand Bible v2. Recreate pixel-perfectly.

## Screens / Views

### Shell (all views)
- Full-viewport flex row. Left sidebar 236px, Deep River `#1E2A3A`, Parchment text.
- Sidebar: wordmark "Throughline" (Lora 700, 22px) with "Administrator" beneath (Lora 13px, Amber `#C4873A`); nav items (Inter 14px/500, 10px 12px padding, radius 8px; active = `rgba(242,230,188,0.14)` bg + amber 7px dot; inactive text `rgba(242,230,188,0.72)`); Subscribers item shows count badge (`#6B4C2A` pill). Bottom: animated 3px "brook" strip (Creek Blue `#5B8FA8` gradient, `background-position` loop 11s ease-in-out) above current-user row (30px amber circle avatar, name + "steward · production").
- Main column: header bar (padding 22px 30px 14px, bottom border `#D4CDBF`) with section title (Lora 700, 25px), muted subtitle (Inter 13px `#7A736A`), date right-aligned; scrollable content area padded 22–30px.
- Page background: Parchment `#F2E6BC` with two very soft radial washes (moss `rgba(74,124,89,0.10)` top-right, amber `rgba(196,135,58,0.08)` bottom-left) over a 165deg parchment gradient — the "subtle forest hint."
- Cards everywhere: Bark Shadow `#EDE4D0` bg, 1px `#D4CDBF` border, radius 12px, padding 16–18px.

### 1. Overview
- Row of 4 stat tiles: Photos ingested, Subscribers, Family members ingested, Historical events. Tile: uppercase 11px/600 label (`#7A736A`, 0.08em tracking), Lora 700 34px value, 12px `#6B4C2A` note.
- Two-column row (1.3fr/1fr): **Service health** (3-col grid of 9 clickable service chips: 8px status dot — ok `#4A7C59`, degraded `#C4873A` — name 12.5px/500, status 11px muted; click navigates to Sources & Logs filtered to that service) and **Needs attention** (top 4 non-info log entries: severity pill + message + "source · time").
- **On the path this week**: 4 cards for most-engaged active subscribers — name (Lora 600 16px), "with {companion} · {time}", amber chapter progress bar, "{Chapter x of 12} · {n} photographs". Click opens subscriber detail.

### 2. Subscribers — list
- Toolbar: search input (280px, `#EDE4D0` bg), status filter chips (All/Active/Invited/Suspended; selected = Deep River bg + Parchment text; unselected = transparent, `#6B4C2A` text, `#D4CDBF` border), right-aligned amber primary button "+ Invite a subscriber".
- Table card, 8-column grid: Subscriber (Lora 600 15px), Email, Plan, Companion, Status pill, Photos, Chapters (52px amber bar + "x/12"), Last active. Rows hover `#F2E6BC`, click → detail.
- Status pills: active `rgba(74,124,89,0.18)`/`#31573E`; invited `rgba(196,135,58,0.20)`/`#8A5D24`; suspended `rgba(107,76,42,0.20)`/`#6B4C2A`; cancelled `rgba(122,115,106,0.20)`/`#7A736A`.
- Empty search state: "No one on the path by that name. Try a different search." (italic, muted).

### 3. Subscribers — detail
- "← All subscribers" back link; header: 52px Deep River circle initial, name (Lora 700 26px) + status pill, "email · joined … · last active …".
- 4 metric tiles: Time on the path, Photographs attached ("stones placed in the River"), Chapters completed (with amber bar), People added ("through dialogue with {companion}").
- 3-column row: **Profile** card (selects for Plan Founding/Family/Solo, Companion Seth/Miriam, Status; then Actions: primary amber "View as {name}", outlined `#6B4C2A` "Suspend/Reactivate" and "Refund last payment", muted-outline "Cancel subscription"); **Family added through dialogue** (rows: 32px moss `#4A7C59` circle initial, name Lora 600, relation muted, right column "added {date} / in {chapter}"; empty state "No one yet. The walk hasn't started."); **Time by product** (per-product moss bars with h/m labels).

### 4. Progress
- 3 tiles: Avg. time engaged, Photographs attached, Chapters completed (of possible total).
- Table sorted by engagement: Subscriber, Time engaged (moss bar + label), Photographs, Chapters (amber bar + x/12), People added. Rows click through to detail.
- **Engagement by product** card: Creek Blue `#5B8FA8` bars (Weaver, Witness, Surfer, Reunion, Companion/Narrator, Scout), max-width 560px.

### 5. Sources & Logs
- Same 4 ingestion tiles as Overview.
- **Service health** card: 3-col grid of 9 cards (dot + name 13.5px/600 + note 12px; degraded cards get amber border). Click filters the log below to that source.
- **Error log** card: severity chips (All/Errors/Warnings/Info, same chip style), source `<select>`; rows in 64px/76px/150px/1fr grid — time, severity pill (ERROR solid `#6B4C2A` on parchment text; WARN `rgba(196,135,58,0.25)`/`#8A5D24`; INFO `rgba(91,143,168,0.20)`/`#3E637A`), source, message. Empty state: "Nothing in the log for that filter. Quiet water."

### Invite modal
- Overlay `rgba(28,23,18,0.45)`; 420px parchment card, radius 14px. Title "Invite someone to the path" (Lora 700 21px); sub-copy "They'll receive a letter, not a link-blast. Their companion is chosen when they arrive." Name + Email inputs; "Not now" ghost + "Send invitation" amber buttons. Empty-name validation toast: "A name, at least — the letter needs someone to greet."

### Toast
- Fixed bottom-center, Deep River bg, Parchment text, radius 10px, auto-dismiss ~3.2s. Copy examples: "Viewing the path as myke — impersonation session started", "{name} suspended — the stones are held safe", "{name} reactivated — back on the path", "{name}'s subscription cancelled — their River is preserved", "Invitation sent to {name} — the path is ready when they are".

## Interactions & Behavior
- Sidebar nav switches sections; subscriber detail is a sub-state of Subscribers (deep-linkable route in production: `/subscribers/:id`).
- Search filters name/email live; status chips and severity/source filters are single-select.
- Service chips (Overview + Sources) navigate to the log pre-filtered by source.
- Profile selects persist immediately (optimistic update + toast on failure in production).
- Suspend toggles active↔suspended; Cancel sets cancelled; Refund triggers a payment refund; Impersonate opens a read-only view-as session (audit-logged in production).
- Invite adds an `invited` subscriber and sends an email.
- Hovers: rows → `#F2E6BC`; cards/chips → amber border; buttons darken (`#B37A31`).

## State Management
Prototype state (see logic class): `section`, `selectedId`, `query`, `statusFilter`, `logSev`, `logSource`, `toastMsg`, invite modal fields, and `subs[]`. In production, replace `subs`, services, counters, and logs with API data (see CLAUDE_CODE_PROMPT.md).

## Design Tokens
- **Creek Stone `#1C1712`** primary text (never pure black) · **Parchment `#F2E6BC`** background · **Bark Shadow `#EDE4D0`** cards · **Dry Sand `#D4CDBF`** borders/dividers/track bars · **Trail Dust `#7A736A`** secondary text · **Amber Light `#C4873A`** primary accent/buttons/chapter bars (hover `#B37A31`) · **Wet Stone `#6B4C2A`** secondary accent, destructive-ish actions, ERROR pill · **Creek Moss `#4A7C59`** healthy status, engagement bars, family avatars · **Creek Blue `#5B8FA8`** reserved for "the water": brook strip + product-engagement bars · **Deep River `#1E2A3A`** sidebar, selected chips, toasts, avatars.
- **Type**: Lora (Georgia fallback) for story/display — titles, names, big numbers; Inter (system-ui fallback) for UI. Sizes as specified above; uppercase micro-labels 11px/600, 0.07–0.08em tracking.
- **Radii**: cards 12px, controls 8px, pills 99px, modal 14px. **Bars**: 5–6px tall, radius 3px, track `#D4CDBF`.
- Never pure black/white; WCAG AA contrast throughout.

## Voice
Warm, unhurried, never clinical (Brand Bible v2). Never say "unlock", "your journey", "seamlessly", "you're making great progress". Empty/error states use calm path/water language (examples above).

## Assets
None — Google Fonts (Lora, Inter) only. No images; forest hint is pure CSS gradient.

## Files
- `design-reference/Throughline Administrator.dc.html` — full prototype (template markup + logic class with all seed data)
- `CLAUDE_CODE_PROMPT.md` — self-contained build brief for Claude Code (stack, schemas, APIs, wiring, acceptance criteria)
