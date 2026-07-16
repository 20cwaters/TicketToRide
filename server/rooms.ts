import crypto from 'crypto';
import type { Server, Socket } from 'socket.io';
import { applyAction, createGame, currentPlayer, GameError } from '../shared/engine';
import { decideBotAction } from '../shared/bot';
import { getPlayerView } from '../shared/redact';
import { mulberry32, randomSeed, type Rng } from '../shared/rng';
import type { Action, GameState } from '../shared/types';

const MAX_ROOMS = 500;
const MAX_PLAYERS = 5;
const BOT_DELAY_MS = 1100;
const BOT_NAMES = ['Casey Jones', 'Annie Oakley', 'Buffalo Bill', 'Belle Starr'];

interface RoomPlayer {
  id: string;
  token: string;
  name: string;
  isBot: boolean;
  socketId: string | null;
}

interface Room {
  code: string;
  hostId: string;
  players: RoomPlayer[];
  phase: 'lobby' | 'playing';
  game: GameState | null;
  rng: Rng;
  botTimer: NodeJS.Timeout | null;
  lastActivity: number;
}

const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, { code: string; playerId: string }>();

/* --------------------------------- helpers --------------------------------- */

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function newRoomCode(): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    }
    if (!rooms.has(code)) return code;
  }
  throw new Error('Could not allocate a room code');
}

function newId(): string {
  return crypto.randomBytes(8).toString('hex');
}

function sanitizeName(name: unknown): string {
  const trimmed = String(name ?? '').trim().slice(0, 20);
  return trimmed || 'Player';
}

function lobbySnapshot(room: Room, forPlayerId: string) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    you: forPlayerId,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isBot: p.isBot,
      connected: p.isBot || p.socketId !== null,
    })),
  };
}

function broadcastRoom(io: Server, room: Room): void {
  for (const player of room.players) {
    if (!player.socketId) continue;
    const socket = io.sockets.sockets.get(player.socketId);
    if (!socket) continue;
    socket.emit('room', lobbySnapshot(room, player.id));
    if (room.game) {
      socket.emit('game', getPlayerView(room.game, player.id));
    }
  }
}

function touch(room: Room): void {
  room.lastActivity = Date.now();
}

/* -------------------------------- bot runner ------------------------------- */

/** Who (if anyone) should act automatically right now. */
function nextBotActorId(room: Room): string | null {
  const game = room.game;
  if (!game || game.phase === 'finished') return null;

  const actsAutomatically = (playerId: string): boolean => {
    const gp = game.players.find((p) => p.id === playerId);
    return !!gp && (gp.isBot || gp.botControlled);
  };

  if (game.phase === 'ticket_selection') {
    for (const playerId of Object.keys(game.pendingTickets)) {
      if (actsAutomatically(playerId)) return playerId;
    }
    return null;
  }
  const current = currentPlayer(game);
  return actsAutomatically(current.id) ? current.id : null;
}

function scheduleBots(io: Server, room: Room): void {
  if (room.botTimer) return;
  const actorId = nextBotActorId(room);
  if (!actorId) return;

  room.botTimer = setTimeout(() => {
    room.botTimer = null;
    const game = room.game;
    if (!game || game.phase === 'finished') return;
    // Re-check: a human may have reconnected or the turn may have moved on.
    if (nextBotActorId(room) !== actorId) {
      scheduleBots(io, room);
      return;
    }
    runBotAction(room, actorId);
    touch(room);
    broadcastRoom(io, room);
    scheduleBots(io, room);
  }, BOT_DELAY_MS + Math.floor(Math.random() * 500));
}

function runBotAction(room: Room, actorId: string): void {
  const game = room.game!;
  try {
    const action = decideBotAction(game, actorId);
    applyAction(game, actorId, action, room.rng);
    return;
  } catch (err) {
    console.error(`Bot ${actorId} chose an illegal action:`, err);
  }
  // Fallbacks so a bot bug can never stall the game.
  const fallbacks: Action[] = [
    { type: 'chooseTickets', keepIndices: ticketFallback(game, actorId) },
    { type: 'drawTrainDeck' },
    { type: 'drawFaceUp', index: 0 },
    { type: 'drawFaceUp', index: 1 },
    { type: 'drawFaceUp', index: 2 },
    { type: 'drawFaceUp', index: 3 },
    { type: 'drawFaceUp', index: 4 },
    { type: 'drawTickets' },
    { type: 'pass' },
  ];
  for (const action of fallbacks) {
    try {
      applyAction(game, actorId, action, room.rng);
      return;
    } catch {
      // try the next one
    }
  }
  console.error(`Bot ${actorId} has no legal action at all; game may be stuck.`);
}

function ticketFallback(game: GameState, playerId: string): number[] {
  const pending = game.pendingTickets[playerId];
  if (!pending) return [];
  return Array.from({ length: pending.minKeep }, (_, i) => i);
}

/* ------------------------------ socket handlers ---------------------------- */

export function registerRoomHandlers(io: Server): void {
  setInterval(() => cleanupRooms(io), 60_000).unref?.();

  io.on('connection', (socket: Socket) => {
    socket.on('createRoom', (payload, cb) => {
      try {
        if (rooms.size >= MAX_ROOMS) {
          return ack(cb, { ok: false, error: 'Server is full — try again later.' });
        }
        const room: Room = {
          code: newRoomCode(),
          hostId: '',
          players: [],
          phase: 'lobby',
          game: null,
          rng: mulberry32(randomSeed()),
          botTimer: null,
          lastActivity: Date.now(),
        };
        const player = addHuman(room, socket, sanitizeName(payload?.name));
        room.hostId = player.id;
        rooms.set(room.code, room);
        ack(cb, joinAck(room, player));
        broadcastRoom(io, room);
      } catch (err) {
        ackError(cb, err);
      }
    });

    socket.on('joinRoom', (payload, cb) => {
      try {
        const room = rooms.get(String(payload?.code ?? '').toUpperCase().trim());
        if (!room) return ack(cb, { ok: false, error: 'Room not found.' });
        if (room.phase !== 'lobby') {
          return ack(cb, { ok: false, error: 'That game has already started.' });
        }
        if (room.players.length >= MAX_PLAYERS) {
          return ack(cb, { ok: false, error: 'Room is full (5 players max).' });
        }
        const player = addHuman(room, socket, sanitizeName(payload?.name));
        touch(room);
        ack(cb, joinAck(room, player));
        broadcastRoom(io, room);
      } catch (err) {
        ackError(cb, err);
      }
    });

    socket.on('rejoin', (payload, cb) => {
      try {
        const room = rooms.get(String(payload?.code ?? '').toUpperCase().trim());
        const player = room?.players.find(
          (p) => !p.isBot && p.token === payload?.token,
        );
        if (!room || !player) {
          return ack(cb, { ok: false, error: 'Could not rejoin that game.' });
        }
        if (player.socketId) socketToRoom.delete(player.socketId);
        player.socketId = socket.id;
        socketToRoom.set(socket.id, { code: room.code, playerId: player.id });
        if (room.game) {
          const gp = room.game.players.find((p) => p.id === player.id);
          if (gp) {
            gp.connected = true;
            gp.botControlled = false;
          }
        }
        touch(room);
        ack(cb, joinAck(room, player));
        broadcastRoom(io, room);
      } catch (err) {
        ackError(cb, err);
      }
    });

    socket.on('addBot', (_payload, cb) => {
      withRoom(socket, cb, (room, playerId) => {
        requireHost(room, playerId);
        requireLobby(room);
        if (room.players.length >= MAX_PLAYERS) {
          throw new GameError('Room is full (5 players max).');
        }
        const usedNames = new Set(room.players.map((p) => p.name));
        const name =
          BOT_NAMES.find((n) => !usedNames.has(n)) ?? `Bot ${room.players.length}`;
        room.players.push({
          id: newId(),
          token: newId(),
          name,
          isBot: true,
          socketId: null,
        });
        broadcastRoom(io, room);
      });
    });

    socket.on('removeBot', (payload, cb) => {
      withRoom(socket, cb, (room, playerId) => {
        requireHost(room, playerId);
        requireLobby(room);
        const idx = room.players.findIndex(
          (p) => p.id === payload?.playerId && p.isBot,
        );
        if (idx === -1) throw new GameError('Bot not found.');
        room.players.splice(idx, 1);
        broadcastRoom(io, room);
      });
    });

    socket.on('startGame', (_payload, cb) => {
      withRoom(socket, cb, (room, playerId) => {
        requireHost(room, playerId);
        requireLobby(room);
        if (room.players.length < 2) {
          throw new GameError('You need at least 2 players (add a bot!).');
        }
        room.game = createGame(
          room.players.map((p) => ({ id: p.id, name: p.name, isBot: p.isBot })),
          randomSeed(),
        );
        for (const gp of room.game.players) {
          const rp = room.players.find((p) => p.id === gp.id)!;
          gp.connected = rp.isBot || rp.socketId !== null;
        }
        room.phase = 'playing';
        broadcastRoom(io, room);
        scheduleBots(io, room);
      });
    });

    socket.on('gameAction', (payload, cb) => {
      withRoom(socket, cb, (room, playerId) => {
        if (!room.game) throw new GameError('The game has not started.');
        applyAction(room.game, playerId, payload?.action as Action, room.rng);
        broadcastRoom(io, room);
        scheduleBots(io, room);
      });
    });

    socket.on('replaceWithBot', (payload, cb) => {
      withRoom(socket, cb, (room) => {
        if (!room.game || room.game.phase === 'finished') {
          throw new GameError('No game in progress.');
        }
        const target = room.game.players.find((p) => p.id === payload?.playerId);
        if (!target || target.isBot) throw new GameError('Player not found.');
        if (target.connected) {
          throw new GameError('That player is still connected.');
        }
        target.botControlled = true;
        broadcastRoom(io, room);
        scheduleBots(io, room);
      });
    });

    socket.on('returnToLobby', (_payload, cb) => {
      withRoom(socket, cb, (room, playerId) => {
        requireHost(room, playerId);
        if (room.game && room.game.phase !== 'finished') {
          throw new GameError('The game is still in progress.');
        }
        room.game = null;
        room.phase = 'lobby';
        // Drop humans who never came back; keep bots for the next round.
        room.players = room.players.filter((p) => p.isBot || p.socketId !== null);
        if (!room.players.some((p) => p.id === room.hostId)) {
          const human = room.players.find((p) => !p.isBot);
          if (human) room.hostId = human.id;
        }
        broadcastRoom(io, room);
      });
    });

    socket.on('disconnect', () => {
      const ref = socketToRoom.get(socket.id);
      socketToRoom.delete(socket.id);
      if (!ref) return;
      const room = rooms.get(ref.code);
      if (!room) return;
      const player = room.players.find((p) => p.id === ref.playerId);
      if (player) player.socketId = null;
      if (room.game) {
        const gp = room.game.players.find((p) => p.id === ref.playerId);
        if (gp) gp.connected = false;
      } else {
        // In the lobby, just remove them.
        room.players = room.players.filter((p) => p.id !== ref.playerId);
        if (room.hostId === ref.playerId) {
          const human = room.players.find((p) => !p.isBot);
          if (human) room.hostId = human.id;
        }
        if (!room.players.some((p) => !p.isBot)) {
          destroyRoom(room);
          return;
        }
      }
      touch(room);
      broadcastRoom(io, room);
    });
  });
}

/* --------------------------------- utilities ------------------------------- */

function addHuman(room: Room, socket: Socket, name: string): RoomPlayer {
  const player: RoomPlayer = {
    id: newId(),
    token: newId(),
    name,
    isBot: false,
    socketId: socket.id,
  };
  room.players.push(player);
  socketToRoom.set(socket.id, { code: room.code, playerId: player.id });
  return player;
}

function joinAck(room: Room, player: RoomPlayer) {
  return {
    ok: true as const,
    roomCode: room.code,
    playerId: player.id,
    token: player.token,
    room: lobbySnapshot(room, player.id),
    game: room.game ? getPlayerView(room.game, player.id) : null,
  };
}

type Ack = (response: unknown) => void;

function ack(cb: Ack | undefined, response: unknown): void {
  if (typeof cb === 'function') cb(response);
}

function ackError(cb: Ack | undefined, err: unknown): void {
  const message =
    err instanceof GameError ? err.message : 'Something went wrong on the server.';
  if (!(err instanceof GameError)) console.error(err);
  ack(cb, { ok: false, error: message });
}

function withRoom(
  socket: Socket,
  cb: Ack | undefined,
  fn: (room: Room, playerId: string) => void,
): void {
  try {
    const ref = socketToRoom.get(socket.id);
    const room = ref && rooms.get(ref.code);
    if (!ref || !room) throw new GameError('You are not in a room.');
    touch(room);
    fn(room, ref.playerId);
    ack(cb, { ok: true });
  } catch (err) {
    ackError(cb, err);
  }
}

function requireHost(room: Room, playerId: string): void {
  if (room.hostId !== playerId) throw new GameError('Only the host can do that.');
}

function requireLobby(room: Room): void {
  if (room.phase !== 'lobby') throw new GameError('The game has already started.');
}

function destroyRoom(room: Room): void {
  if (room.botTimer) clearTimeout(room.botTimer);
  rooms.delete(room.code);
}

function cleanupRooms(io: Server): void {
  const now = Date.now();
  for (const room of [...rooms.values()]) {
    const humansConnected = room.players.some((p) => !p.isBot && p.socketId !== null);
    const idleMs = now - room.lastActivity;
    const abandoned = !humansConnected && idleMs > 30 * 60_000;
    const stale = idleMs > 12 * 60 * 60_000;
    if (abandoned || stale) {
      for (const p of room.players) {
        if (p.socketId) {
          socketToRoom.delete(p.socketId);
          io.sockets.sockets.get(p.socketId)?.emit('roomClosed');
        }
      }
      destroyRoom(room);
    }
  }
}
