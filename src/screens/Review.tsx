import type { Diagnosis, Trade } from '../types';
import { ALL_TRADES } from '../types';
import { tradeLabel } from '../data/tradespeople';

interface Props {
  diagnosis: Diagnosis;
  analysing: boolean;
  progressMsg?: string;
  onChange: (d: Diagnosis) => void;
  onBack: () => void;
  onNext: () => void;
}

export function Review({
  diagnosis,
  analysing,
  progressMsg,
  onChange,
  onBack,
  onNext,
}: Props) {
  if (analysing) {
    return (
      <section>
        <h1>Looking at your photo…</h1>
        <div className="loading">
          <span className="spinner" aria-hidden />
          {progressMsg ||
            'Generating a clear “what needs doing” summary from your photo'}
        </div>
        <p className="lead" style={{ marginTop: '1rem' }}>
          First run may download a free on-device vision model. After that it stays
          cached in your browser — no paid API.
        </p>
      </section>
    );
  }

  const pct = Math.round(diagnosis.confidence * 100);
  const fromPhoto = Boolean(diagnosis.generatedFromPhoto);

  return (
    <section>
      <h1>Does this look right?</h1>
      <p className="lead">
        {fromPhoto
          ? 'We generated this from your photo — correct the trade or summary before we find local tradies.'
          : 'Edit anything before we find tradies nearby.'}
      </p>

      {fromPhoto && (
        <div className="meta-row" style={{ marginBottom: '0.75rem' }}>
          <span className="chip chip-photo">Generated from your photo</span>
        </div>
      )}

      <div className="card">
        <div className="field">
          <label className="label" htmlFor="title">
            Job title
          </label>
          <input
            id="title"
            className="input"
            value={diagnosis.title}
            onChange={(e) => onChange({ ...diagnosis, title: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="trade">
            Trade
          </label>
          <select
            id="trade"
            className="select"
            value={diagnosis.trade}
            onChange={(e) => onChange({ ...diagnosis, trade: e.target.value as Trade })}
          >
            {ALL_TRADES.map((t) => (
              <option key={t} value={t}>
                {tradeLabel(t)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="desc">
            What needs doing
          </label>
          <textarea
            id="desc"
            className="textarea"
            style={{ minHeight: 140 }}
            value={diagnosis.description}
            onChange={(e) => onChange({ ...diagnosis, description: e.target.value })}
          />
          <p className="hint-ok" style={{ marginTop: '0.35rem' }}>
            Tradies will see this description — tweak it so it’s clear and accurate.
          </p>
        </div>

        <div className="meta-row">
          <span className="chip">Confidence ~{pct}%</span>
          <span className={`chip urgency-${diagnosis.urgency}`}>
            Urgency: {diagnosis.urgency}
          </span>
        </div>

        {diagnosis.hints.length > 0 && (
          <ul className="hints-list">
            {diagnosis.hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext} style={{ flex: 1 }}>
          Find local tradies
        </button>
      </div>
    </section>
  );
}
