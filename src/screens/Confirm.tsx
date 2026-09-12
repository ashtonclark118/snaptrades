import type { EmailDraft, MatchedTradie, SendReceipt } from '../types';
import { buildMailto, makeReceipt } from '../utils/email';

interface Props {
  email: EmailDraft;
  selected: MatchedTradie[];
  confirmed: boolean;
  onConfirmed: (v: boolean) => void;
  onEmailChange: (e: EmailDraft) => void;
  onSent: (receipt: SendReceipt) => void;
  onBack: () => void;
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

export function Confirm({
  email,
  selected,
  confirmed,
  onConfirmed,
  onEmailChange,
  onSent,
  onBack,
}: Props) {
  const withEmail = selected.filter((t) => t.email);
  const withPhone = selected.filter((t) => t.phone);

  function recordSend(mailtoUsed: boolean) {
    const receipt = makeReceipt(selected, email.subject, mailtoUsed);
    onSent(receipt);
  }

  function openMailto() {
    if (!confirmed) return;
    const href = buildMailto(email, withEmail);
    window.location.href = href;
    recordSend(true);
  }

  function recordOnly() {
    if (!confirmed) return;
    recordSend(false);
  }

  return (
    <section>
      <h1>Confirm &amp; send</h1>
      <p className="lead">
        Check the email, then confirm. You can email them, call them, or both.
      </p>

      <div className="card">
        <div className="field">
          <label className="label" htmlFor="subject">
            Subject
          </label>
          <input
            id="subject"
            className="input"
            value={email.subject}
            onChange={(e) => onEmailChange({ ...email, subject: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="body">
            Body
          </label>
          <textarea
            id="body"
            className="textarea email-preview"
            style={{ minHeight: 220 }}
            value={email.body}
            onChange={(e) => onEmailChange({ ...email, body: e.target.value })}
          />
        </div>
        <p className="label">Selected tradies</p>
        <div className="contact-list">
          {selected.map((t) => (
            <div className="contact-row" key={t.id}>
              <div>
                <strong>{t.name}</strong>
                <div className="muted">
                  {t.town}
                  {t.email ? ` · ${t.email}` : ''}
                  {t.phone ? ` · ${t.phone}` : ''}
                </div>
              </div>
              {t.phone && (
                <a className="call-btn" href={telHref(t.phone)}>
                  Call
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <label className="confirm-box">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onConfirmed(e.target.checked)}
        />
        <span>
          <strong>I confirm</strong> I want to contact the selected tradies. SnapTrades
          does not send email or place the call for you.
        </span>
      </label>

      <div className="btn-row">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn btn-amber"
          disabled={!confirmed || withEmail.length === 0}
          onClick={openMailto}
          style={{ flex: 1 }}
        >
          Open mail app
        </button>
      </div>
      {withPhone.length > 0 && confirmed && (
        <p className="muted" style={{ marginTop: '0.75rem' }}>
          {withPhone.length} number{withPhone.length === 1 ? '' : 's'} ready to call from
          the list above.
        </p>
      )}
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-secondary btn-block"
          disabled={!confirmed}
          onClick={recordOnly}
        >
          Record send receipt only
        </button>
      </div>
    </section>
  );
}
