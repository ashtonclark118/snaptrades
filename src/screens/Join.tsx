import { useState } from 'react';
import { ALL_TRADES, type Trade, type Tradie } from '../types';
import { tradeLabel } from '../data/tradespeople';
import { validatePostcode } from '../utils/postcode';

interface Props {
  onBack: () => void;
  onJoin: (t: Tradie) => void;
}

export function Join({ onBack, onJoin }: Props) {
  const [name, setName] = useState('');
  const [trade, setTrade] = useState<Trade>('plumber');
  const [town, setTown] = useState('');
  const [postcode, setPostcode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState<Tradie | null>(null);
  const [error, setError] = useState('');

  function submit() {
    const pc = validatePostcode(postcode);
    if (!name.trim()) return setError('Add your name or trading name.');
    if (!town.trim()) return setError('Add your town.');
    if (!pc.ok) return setError(pc.message ?? 'Need a valid UK postcode.');
    if (!phone.trim() && !email.trim()) return setError('Add a phone or an email so jobs can reach you.');
    setError('');
    const tradie: Tradie = {
      id: `join-${Date.now()}`,
      name: name.trim(),
      trade,
      town: town.trim(),
      postcode: pc.normalised ?? postcode.trim(),
      email: email.trim(),
      phone: phone.trim(),
      rating: 0,
      real: true,
    };
    onJoin(tradie);
    void notifyInbox(tradie);
    setDone(tradie);
  }

  async function notifyInbox(tradie: Tradie) {
    try {
      await fetch('https://formsubmit.co/ajax/Snaptrades118@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: tradie.name,
          trade: tradie.trade,
          town: tradie.town,
          postcode: tradie.postcode,
          phone: tradie.phone,
          email: tradie.email,
          _subject: `New SnapTrades tradie: ${tradie.name}`,
        }),
      });
    } catch {
      // Stay on the thank-you screen even if the inbox ping fails.
    }
  }

  if (done) {
    return (
      <section>
        <h1>You’re on the list</h1>
        <p className="lead">
          {done.name} is now a live listing for {tradeLabel(done.trade)} near {done.postcode}.
          Homeowners in that area will see your number when they snap a job.
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={onBack}>
            Back to SnapTrades
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <p className="hero-kicker">For tradespeople</p>
      <h1>Get jobs from photos, not lead fees</h1>
      <p className="lead">
        Start with Reading and the Thames Valley. No monthly fee to be listed. You only
        hear from people who chose you.
      </p>
      <div className="card">
        <div className="field">
          <label className="label" htmlFor="tname">Name or trading name</label>
          <input id="tname" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="ttrade">Trade</label>
          <select id="ttrade" className="select" value={trade} onChange={(e) => setTrade(e.target.value as Trade)}>
            {ALL_TRADES.filter((x) => x !== 'other').map((x) => (
              <option key={x} value={x}>{tradeLabel(x)}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="ttown">Town</label>
          <input id="ttown" className="input" value={town} onChange={(e) => setTown(e.target.value)} placeholder="Reading" />
        </div>
        <div className="field">
          <label className="label" htmlFor="tpc">Postcode</label>
          <input id="tpc" className="input" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="RG1 1AA" />
        </div>
        <div className="field">
          <label className="label" htmlFor="tphone">Phone</label>
          <input id="tphone" className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="temail">Email <span className="muted">(optional)</span></label>
          <input id="temail" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {error && <p className="hint-error">{error}</p>}
      </div>
      <div className="btn-row">
        <button type="button" className="btn btn-ghost" onClick={onBack}>Back</button>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>
          List me
        </button>
      </div>
    </section>
  );
}
