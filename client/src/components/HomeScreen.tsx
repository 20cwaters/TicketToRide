import { useState } from 'react';
import RulesModal from './RulesModal';
import { LocomotiveHero, RailwayBackdrop } from './art';

interface Props {
  onEnter: (
    kind: 'createRoom' | 'joinRoom',
    payload: { name: string; code?: string },
  ) => Promise<void>;
}

export default function HomeScreen({ onEnter }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [showRules, setShowRules] = useState(false);

  const submit = async () => {
    if (!name.trim() || busy) return;
    if (mode === 'join' && code.trim().length < 4) return;
    setBusy(true);
    try {
      await onEnter(
        mode === 'create' ? 'createRoom' : 'joinRoom',
        mode === 'create'
          ? { name: name.trim() }
          : { name: name.trim(), code: code.trim().toUpperCase() },
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 py-10">
      <RailwayBackdrop className="absolute inset-0 h-full w-full" />

      <div className="relative z-10 mb-6 text-center">
        <LocomotiveHero className="mx-auto -mb-1 w-60 drop-shadow-lg sm:w-72" />
        <h1 className="font-display text-4xl font-bold uppercase tracking-widest text-brass-400 drop-shadow sm:text-5xl">
          Ticket to Ride
        </h1>
        <p className="mt-2.5 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.3em] text-parchment-200/70">
          <span className="inline-block h-px w-10 bg-brass-500/60" />
          United States
          <span className="inline-block h-px w-10 bg-brass-500/60" />
        </p>
      </div>

      <div className="panel-glass relative z-10 w-full max-w-sm p-6">
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-ink-800 p-1">
          <button
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              mode === 'create'
                ? 'bg-brass-500 text-ink-950'
                : 'text-parchment-200/70 hover:text-parchment-50'
            }`}
            onClick={() => setMode('create')}
          >
            New game
          </button>
          <button
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              mode === 'join'
                ? 'bg-brass-500 text-ink-950'
                : 'text-parchment-200/70 hover:text-parchment-50'
            }`}
            onClick={() => setMode('join')}
          >
            Join game
          </button>
        </div>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-parchment-200/60">
          Your name
        </label>
        <input
          className="input mb-4"
          placeholder="e.g. Casey"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoFocus
        />

        {mode === 'join' && (
          <>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-parchment-200/60">
              Room code
            </label>
            <input
              className="input mb-4 font-mono uppercase tracking-[0.35em]"
              placeholder="ABCDE"
              maxLength={5}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </>
        )}

        <button
          className="btn-primary w-full"
          disabled={!name.trim() || busy || (mode === 'join' && code.trim().length < 4)}
          onClick={submit}
        >
          {busy ? 'Connecting…' : mode === 'create' ? 'Create room' : 'Join room'}
        </button>

        <p className="mt-4 text-center text-xs leading-relaxed text-parchment-200/50">
          2–5 players. Fill empty seats with bots to play solo — share the room code
          to play with friends.
        </p>
      </div>

      <button
        className="relative z-10 mt-5 text-sm font-semibold text-brass-400 transition hover:text-brass-500"
        onClick={() => setShowRules(true)}
      >
        📖 How to play
      </button>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
