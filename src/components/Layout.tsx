import type { ReactNode } from 'react';
import type { Screen } from '../types';
import { ProgressSteps } from './ProgressSteps';

interface Props {
  screen: Screen;
  children: ReactNode;
  onHome?: () => void;
  onJoin?: () => void;
}

export function Layout({ screen, children, onHome, onJoin }: Props) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <button type="button" className="logo btn-ghost" onClick={onHome} aria-label="SnapTrades home">
          <span className="logo-mark" aria-hidden>S</span>
          <span className="logo-text">SnapTrades</span>
        </button>
        <div className="header-actions">
          {screen !== 'join' && (
            <button type="button" className="header-link" onClick={onJoin}>
              I&apos;m a tradie
            </button>
          )}
          <span className="badge-pill">UK · start local</span>
        </div>
      </header>
      <ProgressSteps screen={screen} />
      <main>{children}</main>
      <p className="footer-note">
        SnapTrades helps you prepare emails to local tradies. Nothing is sent until you confirm.
      </p>
    </div>
  );
}
