import { useState } from 'react';
import type { CustomerDetails, JobPhoto } from '../types';
import { PhotoCapture } from '../components/PhotoCapture';
import { validatePostcode } from '../utils/postcode';

interface Props {
  photos: JobPhoto[];
  customer: CustomerDetails;
  onPhotos: (p: JobPhoto[]) => void;
  onCustomer: (c: CustomerDetails) => void;
  onBack: () => void;
  onNext: () => void;
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function CreateJob({ photos, customer, onPhotos, onCustomer, onBack, onNext }: Props) {
  const [touched, setTouched] = useState(false);
  const pc = validatePostcode(customer.postcode);
  const errors: string[] = [];
  if (touched) {
    if (!photos.length) errors.push('Please add at least one photo of the problem.');
    if (!pc.ok) errors.push(pc.message ?? 'Invalid postcode');
    if (!customer.name.trim()) errors.push('Please enter your name.');
    if (!isEmail(customer.email)) errors.push('Please enter a valid email address.');
    if (!customer.phone.trim() || customer.phone.trim().length < 10) {
      errors.push('Please enter a UK phone number.');
    }
  }

  function submit() {
    setTouched(true);
    const check = validatePostcode(customer.postcode);
    if (
      !photos.length ||
      !check.ok ||
      !customer.name.trim() ||
      !isEmail(customer.email) ||
      customer.phone.trim().length < 10
    ) {
      return;
    }
    onCustomer({ ...customer, postcode: check.normalised! });
    onNext();
  }

  return (
    <section>
      <h1>Tell us about the job</h1>
      <p className="lead">A clear photo helps tradies decide if they can help.</p>

      <div className="card">
        <label className="label">Photos</label>
        <PhotoCapture photos={photos} onChange={onPhotos} />
        {touched && !photos.length && (
          <p className="hint-error">Add at least one photo to continue.</p>
        )}
      </div>

      <div className="card">
        <div className="field">
          <label className="label" htmlFor="postcode">
            UK postcode
          </label>
          <input
            id="postcode"
            className="input"
            placeholder="e.g. RG1 1AA"
            autoComplete="postal-code"
            value={customer.postcode}
            onChange={(e) => onCustomer({ ...customer, postcode: e.target.value })}
            onBlur={() => {
              const v = validatePostcode(customer.postcode);
              if (v.ok && v.normalised) onCustomer({ ...customer, postcode: v.normalised });
            }}
          />
          {customer.postcode && pc.ok && (
            <p className="hint-ok">Postcode looks good: {pc.normalised}</p>
          )}
          {touched && !pc.ok && <p className="hint-error">{pc.message}</p>}
        </div>

        <div className="field">
          <label className="label" htmlFor="notes">
            Notes <span className="muted">(optional)</span>
          </label>
          <textarea
            id="notes"
            className="textarea"
            placeholder="e.g. Tap dripping under the kitchen sink since Tuesday"
            value={customer.notes}
            onChange={(e) => onCustomer({ ...customer, notes: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            className="input"
            autoComplete="name"
            value={customer.name}
            onChange={(e) => onCustomer({ ...customer, name: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            autoComplete="email"
            value={customer.email}
            onChange={(e) => onCustomer({ ...customer, email: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            className="input"
            autoComplete="tel"
            placeholder="07…"
            value={customer.phone}
            onChange={(e) => onCustomer({ ...customer, phone: e.target.value })}
          />
        </div>
      </div>

      {errors.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(179,58,46,0.35)' }}>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--danger)' }}>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="btn-row">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn btn-primary" onClick={submit} style={{ flex: 1 }}>
          Analyse job
        </button>
      </div>
    </section>
  );
}
