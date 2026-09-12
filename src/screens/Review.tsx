import type { Diagnosis, Trade } from '../types';
import { ALL_TRADES } from '../types';
import { tradeLabel } from '../data/tradespeople';

interface Props {
  diagnosis: Diagnosis;
  analysing: boolean;
  onChange: (d: Diagnosis) => void;
  onBack: () => void;
  onNext: () => void;
}

export function Review({ diagnosis, analysing, onChange, onBack, onNext }: Props) {
  if (analysing) {
    return (
      <section>
        <h1>Looking at your job…</h1>
        <div className="loading">
          <span className="spinner" aria-hidden />
          Matching keywords and preparing a draft for tradies
        </div>
      </section>
    );
  }

  const pct = Math.round(diagnosis.confidence * 100);

  return (
    <section>
      <h1>Does this look right?</h1>
      <p className="lead">
        Our guess is based on your notes and photo names — edit anything before we find tradies.
      </p>

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
            Description for tradies
          </label>
          <textarea
            id="desc"
            className="textarea"
            style={{ minHeight: 120 }}
            value={diagnosis.description}
            onChange={(e) => onChange({ ...diagnosis, description: e.target.value })}
          />
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
