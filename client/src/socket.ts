import { io, type Socket } from 'socket.io-client';

export const socket: Socket = io({ autoConnect: true });

export interface AckErr {
  ok: false;
  error: string;
}
export type Ack<T = object> = ({ ok: true } & T) | AckErr;

/** emit with an acknowledgement, normalized to a promise. */
export function request<T = object>(event: string, payload?: unknown): Promise<Ack<T>> {
  return new Promise((resolve) => {
    const timer = setTimeout(
      () => resolve({ ok: false, error: 'Server did not respond.' }),
      8000,
    );
    socket.emit(event, payload, (response: Ack<T>) => {
      clearTimeout(timer);
      resolve(response ?? { ok: false, error: 'No response.' });
    });
  });
}

export interface Session {
  code: string;
  playerId: string;
  token: string;
}

const SESSION_KEY = 'ttr-session';

export function saveSession(session: Session): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable — rejoin after refresh just won't work */
  }
}

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
