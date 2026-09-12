import type { Screen } from '../types';

const ORDER: Screen[] = ['create', 'review', 'matches', 'confirm', 'done'];
const LABELS = ['Details', 'Review', 'Matches', 'Confirm', 'Done'];

export function ProgressSteps({ screen }: { screen: Screen }) {
  if (screen === 'landing' || screen === 'join') return null;
  const idx = ORDER.indexOf(screen);
  return (
    <div className="steps" role="list" aria-label="Progress">
      {ORDER.map((s, i) => (
        <div
          key={s}
          role="listitem"
          className={`step-dot ${i < idx ? 'done' : ''} ${i === idx ? 'active' : ''}`}
          title={LABELS[i]}
          aria-current={i === idx ? 'step' : undefined}
        />
      ))}
    </div>
  );
}
