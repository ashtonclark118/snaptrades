export type Trade =
  | 'plumber'
  | 'electrician'
  | 'plasterer'
  | 'painter & decorator'
  | 'roofer'
  | 'carpenter'
  | 'gas engineer'
  | 'builder'
  | 'locksmith'
  | 'gardener'
  | 'tiler'
  | 'handyman'
  | 'other';

export const ALL_TRADES: Trade[] = [
  'plumber',
  'electrician',
  'plasterer',
  'painter & decorator',
  'roofer',
  'carpenter',
  'gas engineer',
  'builder',
  'locksmith',
  'gardener',
  'tiler',
  'handyman',
  'other',
];

export type Urgency = 'low' | 'medium' | 'high';

export interface Tradie {
  id: string;
  name: string;
  trade: Trade;
  town: string;
  postcode: string;
  email: string;
  phone: string;
  rating: number;
  real?: boolean;
  sourceUrl?: string;
}

export interface JobPhoto {
  id: string;
  dataUrl: string;
  fileName: string;
}

export interface Diagnosis {
  title: string;
  trade: Trade;
  description: string;
  confidence: number;
  urgency: Urgency;
  hints: string[];
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  postcode: string;
  notes: string;
}

export interface MatchedTradie extends Tradie {
  miles: number;
  selected: boolean;
}

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface SendReceipt {
  sentAt: string;
  recipients: { name: string; email: string; phone: string; town: string }[];
  subject: string;
  mailtoUsed: boolean;
}

export interface JobState {
  photos: JobPhoto[];
  customer: CustomerDetails;
  diagnosis: Diagnosis | null;
  matches: MatchedTradie[];
  email: EmailDraft | null;
  receipt: SendReceipt | null;
  confirmed: boolean;
}

export type Screen =
  | 'landing'
  | 'create'
  | 'review'
  | 'matches'
  | 'confirm'
  | 'done'
  | 'join';
