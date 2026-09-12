import type { CustomerDetails, Diagnosis, SendReceipt } from '../types';
import { tradeLabel } from '../data/tradespeople';

interface Props {
  customer: CustomerDetails;
  diagnosis: Diagnosis;
  receipt: SendReceipt;
  onHome: () => void;
  onNew: () => void;
}

export function Done({ customer, diagnosis, receipt, onHome, onNew }: Props) {
  const when = new Date(receipt.sentAt).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <section>
      <h1>You’re all set</h1>
      <p className="lead">
        Thanks, {customer.name.split(' ')[0] || 'there'}. Here’s your job summary and send
        receipt.
      </p>

      <div className="card">
        <h2>Job summary</h2>
        <dl className="summary-dl">
          <dt>Title</dt>
          <dd>{diagnosis.title}</dd>
          <dt>Trade</dt>
          <dd>{tradeLabel(diagnosis.trade)}</dd>
          <dt>Postcode</dt>
          <dd>{customer.postcode}</dd>
          <dt>Urgency</dt>
          <dd style={{ textTransform: 'capitalize' }}>{diagnosis.urgency}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>Send receipt</h2>
        <div className="receipt">
          <p className="muted" style={{ margin: 0 }}>
            {when}
            {receipt.mailtoUsed ? ' · opened mail app' : ' · recorded in SnapTrades only'}
          </p>
          <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>{receipt.subject}</p>
          <ul>
            {receipt.recipients.map((r) => (
              <li key={`${r.email}-${r.phone}-${r.name}`}>
                {r.name} ({r.town})
                {r.phone ? ` — ${r.phone}` : ''}
                {r.email ? ` — ${r.email}` : ''}
              </li>
            ))}
          </ul>
          {receipt.recipients.length === 0 && (
            <p className="hint-error">No recipients were included.</p>
          )}
        </div>
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={onNew} style={{ flex: 1 }}>
          Start another job
        </button>
        <button type="button" className="btn btn-secondary" onClick={onHome}>
          Home
        </button>
      </div>
    </section>
  );
}
