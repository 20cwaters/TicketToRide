/** localStorage key for "teach me how to play" — set in the lobby, consumed
 * (and cleared) by the in-game tutorial. */
export const TUTORIAL_PREF_KEY = 'ttr-teach';

export function getTutorialPref(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

export function setTutorialPref(on: boolean): void {
  try {
    if (on) localStorage.setItem(TUTORIAL_PREF_KEY, '1');
    else localStorage.removeItem(TUTORIAL_PREF_KEY);
  } catch {
    /* ignore */
  }
}
