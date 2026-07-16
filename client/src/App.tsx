import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlayerGameView } from '@shared/types';
import { clearSession, loadSession, request, saveSession, socket } from './socket';
import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';

export interface LobbyView {
  code: string;
  hostId: string;
  phase: 'lobby' | 'playing';
  you: string;
  players: { id: string; name: string; isBot: boolean; connected: boolean }[];
}

interface JoinData {
  roomCode: string;
  playerId: string;
  token: string;
  room: LobbyView;
  game: PlayerGameView | null;
}

export default function App() {
  const [room, setRoom] = useState<LobbyView | null>(null);
  const [game, setGame] = useState<PlayerGameView | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const onRoom = (snapshot: LobbyView) => {
      setRoom(snapshot);
      if (snapshot.phase === 'lobby') setGame(null);
    };
    const onGame = (view: PlayerGameView) => setGame(view);
    const onRoomClosed = () => {
      setRoom(null);
      setGame(null);
      clearSession();
      showToast('The room was closed.');
    };
    socket.on('room', onRoom);
    socket.on('game', onGame);
    socket.on('roomClosed', onRoomClosed);

    const tryRejoin = async () => {
      const session = loadSession();
      if (!session) return;
      const res = await request<JoinData>('rejoin', session);
      if (res.ok) {
        setRoom(res.room);
        setGame(res.game);
      } else {
        clearSession();
      }
    };
    if (socket.connected) void tryRejoin();
    socket.on('connect', tryRejoin);

    return () => {
      socket.off('room', onRoom);
      socket.off('game', onGame);
      socket.off('roomClosed', onRoomClosed);
      socket.off('connect', tryRejoin);
    };
  }, [showToast]);

  const handleEnterRoom = useCallback(
    async (kind: 'createRoom' | 'joinRoom', payload: { name: string; code?: string }) => {
      const res = await request<JoinData>(kind, payload);
      if (!res.ok) {
        showToast(res.error);
        return;
      }
      saveSession({ code: res.roomCode, playerId: res.playerId, token: res.token });
      setRoom(res.room);
      setGame(res.game);
    },
    [showToast],
  );

  const handleLeave = useCallback(() => {
    clearSession();
    setRoom(null);
    setGame(null);
    socket.disconnect();
    socket.connect();
  }, []);

  return (
    <div className="flex h-full flex-col">
      {!room && <HomeScreen onEnter={handleEnterRoom} />}
      {room && !game && (
        <LobbyScreen room={room} onError={showToast} onLeave={handleLeave} />
      )}
      {room && game && (
        <GameScreen room={room} game={game} onError={showToast} onLeave={handleLeave} />
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div className="rounded-lg border border-rail-500/60 bg-ink-900/95 px-4 py-2.5 text-sm font-medium text-parchment-50 shadow-card">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
