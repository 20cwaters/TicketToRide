import { useMemo, useState } from 'react';
import type { Action, PlayerGameView, TrainCard } from '@shared/types';
import { request } from '../socket';
import type { LobbyView } from '../App';
import MapBoard from './MapBoard';
import PlayersBar from './PlayersBar';
import CardArea from './CardArea';
import TicketsPanel from './TicketsPanel';
import LogFeed from './LogFeed';
import ClaimDialog from './ClaimDialog';
import TicketChoiceModal from './TicketChoiceModal';
import GameOverModal from './GameOverModal';
import RulesModal from './RulesModal';
import TutorialCoach from './TutorialCoach';
import { TUTORIAL_PREF_KEY } from './tutorialPref';

interface Props {
  room: LobbyView;
  game: PlayerGameView;
  onError: (message: string) => void;
  onLeave: () => void;
}

export default function GameScreen({ room, game, onError, onLeave }: Props) {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showRules, setShowRules] = useState(false);
  // The tutorial only starts with a fresh game (not on mid-game rejoins).
  const [tutorialOn, setTutorialOn] = useState(() => {
    try {
      return (
        localStorage.getItem(TUTORIAL_PREF_KEY) === '1' &&
        game.phase === 'ticket_selection'
      );
    } catch {
      return false;
    }
  });

  const finishTutorial = () => {
    setTutorialOn(false);
    try {
      localStorage.removeItem(TUTORIAL_PREF_KEY);
    } catch {
      /* ignore */
    }
  };

  const current = game.players[game.currentPlayerIndex];
  const isMyTurn = game.phase === 'playing' && current?.id === game.you.id;
  const pending = game.you.pendingTickets;
  const canAct = isMyTurn && !pending;
  const isHost = room.you === room.hostId;

  const highlightCities = useMemo(() => {
    const cities = new Set<string>();
    for (const { ticket, completed } of game.you.tickets) {
      if (completed) continue;
      cities.add(ticket.from);
      cities.add(ticket.to);
    }
    return cities;
  }, [game.you.tickets]);

  const act = async (action: Action): Promise<boolean> => {
    const res = await request('gameAction', { action });
    if (!res.ok) onError(res.error);
    return res.ok;
  };

  const noCardsLeft =
    game.trainDeckCount + game.discardCount + game.faceUp.length === 0;

  const status = (() => {
    if (game.phase === 'finished') return 'Game over';
    if (game.phase === 'ticket_selection') {
      return pending ? 'Pick your starting tickets' : 'Waiting for other players…';
    }
    if (pending) return 'Pick your tickets';
    if (isMyTurn) {
      return game.cardsDrawnThisTurn === 1 ? 'Draw one more card' : 'Your turn';
    }
    return `${current?.name ?? '…'}'s turn`;
  })();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-ink-800 px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">🚂</span>
          <span className="hidden font-display font-bold tracking-wider text-brass-400 sm:inline">
            TICKET TO RIDE
          </span>
          <span className="rounded bg-ink-800 px-2 py-0.5 font-mono text-xs tracking-[0.25em] text-parchment-200/70">
            {room.code}
          </span>
        </div>
        <div
          className={`truncate text-sm font-semibold ${
            isMyTurn ? 'text-brass-400' : 'text-parchment-200/70'
          }`}
        >
          {status}
        </div>
        <div className="flex items-center gap-3">
          {canAct && noCardsLeft && (
            <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => act({ type: 'pass' })}>
              Pass
            </button>
          )}
          <button
            className="text-xs font-semibold text-brass-400 transition hover:text-brass-500"
            onClick={() => setShowRules(true)}
          >
            📖 Rules
          </button>
          <button
            className="text-xs text-parchment-200/40 transition hover:text-rail-500"
            onClick={onLeave}
          >
            Leave
          </button>
        </div>
      </header>

      {game.phase === 'playing' && game.finalTurnsRemaining !== null && (
        <div className="bg-rail-600/90 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-widest text-white">
          Final round — {game.finalTurnsRemaining} turn
          {game.finalTurnsRemaining === 1 ? '' : 's'} left
        </div>
      )}

      <PlayersBar
        game={game}
        onReplaceWithBot={async (playerId) => {
          const res = await request('replaceWithBot', { playerId });
          if (!res.ok) onError(res.error);
        }}
      />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative h-[44vh] shrink-0 border-y border-ink-800 bg-[#10151c] lg:h-auto lg:min-h-0 lg:flex-1 lg:border-y-0 lg:border-r">
          <div className="scrollbar-slim h-full overflow-auto">
            <div
              className="mx-auto p-2"
              style={{ width: `${zoom * 100}%`, minWidth: `${zoom * 660}px`, maxWidth: zoom === 1 ? '1100px' : undefined }}
            >
              <MapBoard
                game={game}
                onRouteClick={setSelectedRoute}
                highlightCities={highlightCities}
                selectedRouteId={selectedRoute}
                previewTickets={pending?.tickets}
              />
            </div>
          </div>
          <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
            <button
              className="h-9 w-9 rounded-lg border border-ink-600 bg-ink-900/90 text-lg font-bold text-parchment-50 shadow-card transition hover:bg-ink-700 disabled:opacity-40"
              onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.5).toFixed(1)))}
              disabled={zoom >= 2.5}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              className="h-9 w-9 rounded-lg border border-ink-600 bg-ink-900/90 text-lg font-bold text-parchment-50 shadow-card transition hover:bg-ink-700 disabled:opacity-40"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))}
              disabled={zoom <= 1}
              aria-label="Zoom out"
            >
              −
            </button>
          </div>
        </div>

        <aside className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 lg:w-[390px] lg:flex-none">
          <CardArea
            game={game}
            canAct={canAct}
            onDrawDeck={() => act({ type: 'drawTrainDeck' })}
            onDrawFaceUp={(index) => act({ type: 'drawFaceUp', index })}
            onDrawTickets={() => act({ type: 'drawTickets' })}
          />
          <TicketsPanel game={game} />
          <LogFeed game={game} />
        </aside>
      </main>

      {pending && (
        <TicketChoiceModal
          pending={pending}
          onChoose={(keepIndices) => act({ type: 'chooseTickets', keepIndices })}
        />
      )}

      {selectedRoute && !pending && game.phase !== 'finished' && (
        <ClaimDialog
          routeId={selectedRoute}
          game={game}
          canAct={canAct && game.cardsDrawnThisTurn === 0}
          onClaim={async (routeId, cards: TrainCard[]) => {
            const ok = await act({ type: 'claimRoute', routeId, cards });
            if (ok) setSelectedRoute(null);
          }}
          onClose={() => setSelectedRoute(null)}
        />
      )}

      {tutorialOn && <TutorialCoach game={game} onFinish={finishTutorial} />}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {game.phase === 'finished' && (
        <GameOverModal
          game={game}
          isHost={isHost}
          onBackToLobby={async () => {
            const res = await request('returnToLobby');
            if (!res.ok) onError(res.error);
          }}
          onLeave={onLeave}
        />
      )}
    </div>
  );
}
