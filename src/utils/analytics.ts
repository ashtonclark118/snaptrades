/**
 * Lightweight GoatCounter helpers. All calls are no-ops if the script is
 * blocked (adblockers) or hasn't loaded yet, and never throw.
 */
function count(vars: GoatCounterCountVars): void {
  try {
    if (typeof window === 'undefined') return;
    window.goatcounter?.count?.(vars);
  } catch {
    // Analytics must never break the app.
  }
}

/** Record a virtual pageview for an in-app screen change. */
export function trackScreen(screenName: string): void {
  count({ path: '/snaptrades/' + screenName, title: screenName });
}

/** Record a GoatCounter event (e.g. 'call-click'). */
export function trackEvent(path: string, title?: string): void {
  count({ path, title: title ?? path, event: true });
}
