# SnapTrades

**Snap the job. Local tradies get the email.**

A mobile-first UK web app for homeowners. Photograph a household problem, get a suggested trade, find nearby tradespeople, and prepare emails — nothing is sent until you confirm.

## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command           | What it does              |
|-------------------|---------------------------|
| `npm run dev`     | Start the Vite dev server |
| `npm run build`   | Typecheck + production build |
| `npm run preview` | Preview the production build |

## Customer flow

1. **Landing** — promise and primary CTA  
2. **Create job** — photos, UK postcode, notes, contact details  
3. **Review** — heuristic diagnosis (editable trade + description)  
4. **Matches** — local tradies; tick who to contact  
5. **Confirm** — preview subject/body; confirm; mailto or receipt  
6. **Done** — summary + send receipt (last job stored in `localStorage`)

## Tech

- Vite + React + TypeScript (no backend)
- Heuristic analyser (keywords from notes/filenames + optional colour hint)
- Seed directory of 90 UK tradespeople (Reading / Berkshire / Thames Valley focus)
- Distance at outcode level (approx centroids + haversine)
- Email via `mailto:` BCC fallback — no SMTP

## Notes

- British English (en-GB) throughout
- Camera via `<input type="file" accept="image/*" capture="environment">`
- Confirmation is required before any “send”
- Unselected tradies are never included in the receipt or mailto
