interface Props {
  onStart: () => void;
  hasLastJob: boolean;
  onResume: () => void;
  onJoin: () => void;
}

export function Landing({ onStart, hasLastJob, onResume, onJoin }: Props) {
  return (
    <section className="hero">
      <p className="hero-kicker">For UK homeowners</p>
      <h1><span className="hero-highlight">Snap the job.</span> Local tradies get the email.</h1>
      <p className="lead">
        Photograph the problem, we’ll suggest the right trade, find nearby tradespeople,
        and prepare emails for you to send — you stay in control.
      </p>
      <div className="hero-promise">
        No accounts. No spam. You confirm before anyone is contacted.
      </div>
      <div className="btn-row">
        <button type="button" className="btn btn-primary btn-block" onClick={onStart}>
          Start a job
        </button>
        {hasLastJob && (
          <button type="button" className="btn btn-secondary btn-block" onClick={onResume}>
            Resume last job
          </button>
        )}
      </div>
      <div className="feature-grid">
        <div className="feature">
          <strong>1. Snap</strong>
          <span className="muted">Photo + postcode + a few details</span>
        </div>
        <div className="feature">
          <strong>2. Match</strong>
          <span className="muted">Local tradies near your outcode</span>
        </div>
        <div className="feature">
          <strong>3. Confirm</strong>
          <span className="muted">Preview the email, then send</span>
        </div>
      </div>
      <p className="tradie-invite">
        You do the work?{' '}
        <button type="button" className="header-link" onClick={onJoin}>
          Get listed free
        </button>
      </p>
    </section>
  );
}
