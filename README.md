# SnapTrades

**Snap the job. Local tradies get the email.**

A mobile-first UK web app for homeowners. Photograph a household problem, get a suggested trade and plain-English “what needs doing” summary from the photo, find nearby tradespeople, and prepare emails — nothing is sent until you confirm.

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
2. **Create job** — photos, UK postcode, optional notes, contact details  
3. **Review** — photo diagnosis (editable trade + “what needs doing”)  
4. **Matches** — local tradies; tick who to contact  
5. **Confirm** — preview subject/body; confirm; mailto or receipt  
6. **Done** — summary + send receipt (last job stored in `localStorage`)

## Tech

- Vite + React + TypeScript (static GitHub Pages — no backend)
- Photo diagnosis: free client-side CLIP (`@huggingface/transformers` / Xenova CLIP) when the model loads, plus canvas colour/texture cues and keyword heuristics as fallback — **no paid API key**
- Seed directory of real local UK tradespeople (Reading / Berkshire / Thames Valley focus)
- Distance at outcode level (approx centroids + haversine)
- Email via `mailto:` BCC fallback — no SMTP
- Tradies can Join via FormSubmit

## Notes

- British English (en-GB) throughout
- Camera via `<input type="file" accept="image/*" capture="environment">`
- Confirmation is required before any “send”
- Unselected tradies are never included in the receipt or mailto
- Live site: https://ashtonclark118.github.io/snaptrades/
