import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import { Landing } from './screens/Landing';
import { CreateJob } from './screens/CreateJob';
import { Review } from './screens/Review';
import { Matches } from './screens/Matches';
import { Confirm } from './screens/Confirm';
import { Done } from './screens/Done';
import { Join } from './screens/Join';
import type {
  CustomerDetails,
  Diagnosis,
  EmailDraft,
  JobPhoto,
  JobState,
  Screen,
  SendReceipt,
  Tradie,
} from './types';
import { analyseJob } from './utils/analyser';
import { findNearbyTradies } from './utils/distance';
import { buildEmail } from './utils/email';
import { loadLastJob, saveLastJob, loadJoinedTradies, saveJoinedTradie } from './utils/storage';

const emptyCustomer = (): CustomerDetails => ({
  name: '',
  email: '',
  phone: '',
  postcode: '',
  notes: '',
});

const emptyJob = (): JobState => ({
  photos: [],
  customer: emptyCustomer(),
  diagnosis: null,
  matches: [],
  email: null,
  receipt: null,
  confirmed: false,
});

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [job, setJob] = useState<JobState>(emptyJob);
  const [analysing, setAnalysing] = useState(false);
  const [farNote, setFarNote] = useState<string | undefined>();
  const [hasStored, setHasStored] = useState(false);
  const [joined, setJoined] = useState<Tradie[]>([]);

  useEffect(() => {
    setHasStored(Boolean(loadLastJob()));
    setJoined(loadJoinedTradies());
  }, []);

  useEffect(() => {
    if (screen === 'landing') return;
    saveLastJob({ screen, job, farNote, savedAt: new Date().toISOString() });
    setHasStored(true);
  }, [screen, job, farNote]);

  const selected = useMemo(
    () => job.matches.filter((m) => m.selected && (m.email || m.phone)),
    [job.matches],
  );

  const reset = useCallback(() => {
    setJob(emptyJob());
    setFarNote(undefined);
    setAnalysing(false);
    setScreen('landing');
  }, []);

  const startFresh = useCallback(() => {
    setJob(emptyJob());
    setFarNote(undefined);
    setAnalysing(false);
    setScreen('create');
  }, []);

  function resume() {
    const stored = loadLastJob();
    if (!stored) return;
    setJob(stored.job);
    setFarNote(stored.farNote);
    setScreen(stored.screen === 'landing' ? 'create' : stored.screen);
  }

  async function runAnalysis() {
    setAnalysing(true);
    setScreen('review');
    // Brief pause so the loading state is visible
    await new Promise((r) => setTimeout(r, 450));
    const diagnosis = await analyseJob(job.photos, job.customer.notes);
    setJob((j) => ({ ...j, diagnosis }));
    setAnalysing(false);
  }

  function goToMatches() {
    if (!job.diagnosis) return;
    const result = findNearbyTradies(job.diagnosis.trade, job.customer.postcode, 12, joined);
    setFarNote(result.nearestNote);
    setJob((j) => ({
      ...j,
      matches: result.matches,
      email: null,
      confirmed: false,
      receipt: null,
    }));
    setScreen('matches');
  }

  function goToConfirm() {
    if (!job.diagnosis) return;
    const email = buildEmail(job.customer, job.diagnosis, job.customer.postcode);
    setJob((j) => ({ ...j, email, confirmed: false }));
    setScreen('confirm');
  }

  function handleSent(receipt: SendReceipt) {
    setJob((j) => ({ ...j, receipt }));
    setScreen('done');
  }

  function setPhotos(photos: JobPhoto[]) {
    setJob((j) => ({ ...j, photos }));
  }

  function setCustomer(customer: CustomerDetails) {
    setJob((j) => ({ ...j, customer }));
  }

  function setDiagnosis(diagnosis: Diagnosis) {
    setJob((j) => ({ ...j, diagnosis }));
  }

  function toggleTradie(id: string) {
    setJob((j) => ({
      ...j,
      matches: j.matches.map((m) =>
        m.id === id && (m.email || m.phone) ? { ...m, selected: !m.selected } : m,
      ),
    }));
  }

  function selectAllWithEmail() {
    setJob((j) => ({
      ...j,
      matches: j.matches.map((m) => ({
        ...m,
        selected: Boolean(m.email || m.phone),
      })),
    }));
  }

  function clearSelection() {
    setJob((j) => ({
      ...j,
      matches: j.matches.map((m) => ({ ...m, selected: false })),
    }));
  }

  function setEmail(email: EmailDraft) {
    setJob((j) => ({ ...j, email }));
  }

  function setConfirmed(confirmed: boolean) {
    setJob((j) => ({ ...j, confirmed }));
  }

  return (
    <Layout screen={screen} onHome={reset} onJoin={() => setScreen('join')}>
      {screen === 'landing' && (
        <Landing onStart={startFresh} hasLastJob={hasStored} onResume={resume} onJoin={() => setScreen('join')} />
      )}
      {screen === 'create' && (
        <CreateJob
          photos={job.photos}
          customer={job.customer}
          onPhotos={setPhotos}
          onCustomer={setCustomer}
          onBack={reset}
          onNext={() => void runAnalysis()}
        />
      )}
      {screen === 'review' && job.diagnosis && (
        <Review
          diagnosis={job.diagnosis}
          analysing={analysing}
          onChange={setDiagnosis}
          onBack={() => setScreen('create')}
          onNext={goToMatches}
        />
      )}
      {screen === 'review' && !job.diagnosis && analysing && (
        <Review
          diagnosis={{
            title: '',
            trade: 'other',
            description: '',
            confidence: 0,
            urgency: 'low',
            hints: [],
          }}
          analysing
          onChange={() => undefined}
          onBack={() => setScreen('create')}
          onNext={() => undefined}
        />
      )}
      {screen === 'matches' && (
        <Matches
          matches={job.matches}
          farNote={farNote}
          onToggle={toggleTradie}
          onSelectAllWithEmail={selectAllWithEmail}
          onClear={clearSelection}
          onBack={() => setScreen('review')}
          onNext={goToConfirm}
        />
      )}
      {screen === 'confirm' && job.email && (
        <Confirm
          email={job.email}
          selected={selected}
          confirmed={job.confirmed}
          onConfirmed={setConfirmed}
          onEmailChange={setEmail}
          onSent={handleSent}
          onBack={() => setScreen('matches')}
        />
      )}
      {screen === 'done' && job.diagnosis && job.receipt && (
        <Done
          customer={job.customer}
          diagnosis={job.diagnosis}
          receipt={job.receipt}
          onHome={reset}
          onNew={startFresh}
        />
      )}
      {screen === 'join' && (
        <Join
          onBack={reset}
          onJoin={(tradie) => {
            const next = saveJoinedTradie(tradie);
            setJoined(next);
          }}
        />
      )}
    </Layout>
  );
}

