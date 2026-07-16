import { useState } from 'react';
import { request } from '../socket';
import type { LobbyView } from '../App';
import { PLAYER_COLOR_HEX } from '../ui';
import { PLAYER_COLORS } from '@shared/types';
import RulesModal from './RulesModal';
import { getTutorialPref, setTutorialPref } from './tutorialPref';

interface Props {
  room: LobbyView;
  onError: (message: string) => void;
  onLeave: () => void;
}

export default function LobbyScreen({ room, onError, onLeave }: Props) {
  const [busy, setBusy] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [teachMe, setTeachMe] = useState(getTutorialPref);
  const isHost = room.you === room.hostId;
  const canStart = room.players.length >= 2;

  const toggleTeachMe = () => {
    const next = !teachMe;
    setTeachMe(next);
    setTutorialPref(next);
  };

  const act = async (event: string, payload?: unknown) => {
    if (busy) return;
    setBusy(true);
    const res = await request(event, payload);
    setBusy(false);
    if (!res.ok) onError(res.error);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      onError('Room code copied!');
    } catch {
      onError(`Room code: ${room.code}`);
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-parchment-200/60">
            Room code
          </p>
          <button
            className="mt-1 font-mono text-4xl font-bold tracking-[0.3em] text-brass-400 transition hover:text-brass-500"
            onClick={copyCode}
            title="Copy room code"
          >
            {room.code}
          </button>
          <p className="mt-1 text-xs text-parchment-200/50">tap to copy — share it with friends</p>
        </div>

        <ul className="mb-5 space-y-2">
          {room.players.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5"
            >
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/40"
                style={{ background: PLAYER_COLOR_HEX[PLAYER_COLORS[i]] }}
              />
              <span className="flex-1 truncate text-sm font-medium">
                {p.name}
                {p.id === room.you && <span className="text-parchment-200/50"> (you)</span>}
              </span>
              {p.isBot && (
                <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brass-400">
                  Bot
                </span>
              )}
              {p.id === room.hostId && (
                <span className="rounded bg-brass-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brass-400">
                  Host
                </span>
              )}
              {!p.isBot && !p.connected && (
                <span className="text-[10px] font-semibold uppercase text-rail-500">
                  offline
                </span>
              )}
              {isHost && p.isBot && (
                <button
                  className="ml-1 rounded p-1 text-parchment-200/50 transition hover:text-rail-500"
                  title="Remove bot"
                  onClick={() => act('removeBot', { playerId: p.id })}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
          {Array.from({ length: 5 - room.players.length }).map((_, i) => (
            <li
              key={`empty-${i}`}
              className="flex items-center gap-3 rounded-lg border border-dashed border-ink-700 px-3 py-2.5 text-sm text-parchment-200/40"
            >
              <span className="h-3.5 w-3.5 rounded-full border border-dashed border-ink-600" />
              Empty seat
            </li>
          ))}
        </ul>

        <button
          className={`mb-4 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
            teachMe
              ? 'border-brass-400 bg-brass-500/15'
              : 'border-ink-700 bg-ink-800 hover:border-ink-600'
          }`}
          onClick={toggleTeachMe}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
              teachMe ? 'border-brass-400 bg-brass-500 text-ink-950' : 'border-ink-500'
            }`}
          >
            {teachMe ? '✓' : ''}
          </span>
          <span>
            <span className="font-semibold">Teach me how to play</span>
            <span className="block text-xs text-parchment-200/50">
              A guide walks you through your first few turns (just for you)
            </span>
          </span>
        </button>

        {isHost ? (
          <div className="space-y-2">
            <button
              className="btn-secondary w-full"
              disabled={room.players.length >= 5 || busy}
              onClick={() => act('addBot')}
            >
              + Add a bot
            </button>
            <button
              className="btn-primary w-full"
              disabled={!canStart || busy}
              onClick={() => act('startGame')}
            >
              {canStart ? 'Start game' : 'Need at least 2 players'}
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-parchment-200/60">
            Waiting for the host to start the game…
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-5">
          <button
            className="text-xs font-semibold text-brass-400 transition hover:text-brass-500"
            onClick={() => setShowRules(true)}
          >
            📖 How to play
          </button>
          <button
            className="text-xs text-parchment-200/40 transition hover:text-rail-500"
            onClick={onLeave}
          >
            Leave room
          </button>
        </div>
      </div>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
