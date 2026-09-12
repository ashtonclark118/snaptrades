import type { CustomerDetails, Diagnosis, EmailDraft, MatchedTradie, SendReceipt } from '../types';
import { tradeLabel } from '../data/tradespeople';

export function buildEmail(
  customer: CustomerDetails,
  diagnosis: Diagnosis,
  postcode: string,
): EmailDraft {
  const subject = `SnapTrades job: ${diagnosis.title} near ${postcode}`;
  const body = [
    `Hello,`,
    ``,
    `A homeowner nearby has a ${tradeLabel(diagnosis.trade).toLowerCase()} job and would like a quote or visit.`,
    ``,
    `—— Job ——`,
    `Title: ${diagnosis.title}`,
    `Trade: ${tradeLabel(diagnosis.trade)}`,
    `Urgency: ${diagnosis.urgency}`,
    `Postcode: ${postcode}`,
    ``,
    `Description:`,
    diagnosis.description,
    ``,
    customer.notes.trim()
      ? `Extra notes from customer:\n${customer.notes.trim()}\n`
      : '',
    `—— Customer contact ——`,
    `Name: ${customer.name}`,
    `Email: ${customer.email}`,
    `Phone: ${customer.phone}`,
    ``,
    `Please reply directly to the customer. This message was prepared via SnapTrades.`,
    ``,
    `Thanks,`,
    `SnapTrades`,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return { subject, body };
}

export function buildMailto(draft: EmailDraft, selected: MatchedTradie[]): string {
  const withEmail = selected.filter((t) => t.email);
  const bcc = withEmail.map((t) => t.email).join(',');
  const params = new URLSearchParams();
  params.set('subject', draft.subject);
  params.set('body', draft.body);
  if (bcc) params.set('bcc', bcc);
  // mailto with empty to, BCC recipients
  return `mailto:?${params.toString().replace(/\+/g, '%20')}`;
}

export function makeReceipt(
  selected: MatchedTradie[],
  subject: string,
  mailtoUsed: boolean,
): SendReceipt {
  return {
    sentAt: new Date().toISOString(),
    recipients: selected.map((t) => ({
      name: t.name,
      email: t.email,
      phone: t.phone,
      town: t.town,
    })),
    subject,
    mailtoUsed,
  };
}
