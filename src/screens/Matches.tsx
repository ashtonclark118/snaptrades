import type { MatchedTradie } from '../types';
import { tradeLabel } from '../data/tradespeople';

interface Props {
  matches: MatchedTradie[];
  farNote?: string;
  onToggle: (id: string) => void;
  onSelectAllWithEmail: () => void;
  onClear: () => void;
  onBack: () => void;
  onNext: () => void;
}

function stars(rating: number) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

function canContact(t: MatchedTradie) {
  return Boolean(t.email || t.phone);
}

export function Matches({
  matches,
  farNote,
  onToggle,
  onSelectAllWithEmail,
  onClear,
  onBack,
  onNext,
}: Props) {
  const selected = matches.filter((m) => m.selected && canContact(m));
  const selectedCount = selected.length;

  return (
    <section>
      <h1>Local matches</h1>
      <p className="lead">
        Tick who to contact. Live listings show a public phone from the firm’s own site.
      </p>

      {farNote && <div className="far-banner">{farNote}</div>}

      <div className="btn-row" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onSelectAllWithEmail}>
          Select all with contact
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClear}>
          Clear
        </button>
      </div>

      <div className="tradie-list">
        {matches.map((t) => (
          <label
            key={t.id}
            className={`tradie-card ${t.selected ? 'selected' : ''} ${!canContact(t) ? 'no-email' : ''}`}
          >
            <input
              type="checkbox"
              className="tradie-check"
              checked={t.selected}
              disabled={!canContact(t)}
              onChange={() => onToggle(t.id)}
              aria-label={`Select ${t.name}`}
            />
            <div>
              <p className="tradie-name">
                {t.name}
                {t.real ? <span className="live-pill">Live listing</span> : null}
              </p>
              <p className="tradie-meta">
                {tradeLabel(t.trade)} · {t.town}
                {t.miles < 900 ? ` · ~${t.miles} miles` : ''}
              </p>
              {t.rating > 0 ? (
                <p className="tradie-meta stars" aria-label={`Rating ${t.rating} out of 5`}>
                  {stars(t.rating)} {t.rating.toFixed(1)}
                </p>
              ) : (
                <p className="tradie-meta muted">No star rating yet — public listing only</p>
              )}
              <div className="tradie-contact">
                {t.phone ? (
                  <a
                    className="call-btn"
                    href={telHref(t.phone)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Call {t.phone}
                  </a>
                ) : (
                  <span className="muted">No phone</span>
                )}
                {t.email ? <span>{t.email}</span> : <span className="muted">No email</span>}
              </div>
            </div>
          </label>
        ))}
      </div>

      {matches.length === 0 && (
        <div className="card">
          <p>No matches found. Try editing the trade on the previous step.</p>
        </div>
      )}

      <p className="muted" style={{ marginTop: '1rem' }}>
        {selectedCount} tradie{selectedCount === 1 ? '' : 's'} selected
      </p>

      <div className="btn-row">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={selectedCount === 0}
          onClick={onNext}
        >
          Preview email
        </button>
      </div>
    </section>
  );
}
