/** Minimal typing for the GoatCounter count.js global (https://www.goatcounter.com/help/js). */
interface GoatCounterCountVars {
  path?: string | ((path: string) => string | null);
  title?: string;
  referrer?: string;
  event?: boolean;
}

interface GoatCounter {
  count?: (vars?: GoatCounterCountVars) => void;
  no_onload?: boolean;
  allow_local?: boolean;
  [key: string]: unknown;
}

interface Window {
  goatcounter?: GoatCounter;
}
