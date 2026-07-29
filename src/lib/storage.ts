import type { AppSettings, Opening } from '../types';

const OPENINGS_KEY = 'chess-trainer:openings:v1';
const SETTINGS_KEY = 'chess-trainer:settings:v1';

export const DEFAULT_SETTINGS: AppSettings = {
  showCurrentLineNumber: true,
  explorerSource: 'masters',
};

export function loadOpenings(): Opening[] {
  try {
    const raw = localStorage.getItem(OPENINGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Opening[];
  } catch {
    return [];
  }
}

export function saveOpenings(openings: Opening[]): void {
  try {
    localStorage.setItem(OPENINGS_KEY, JSON.stringify(openings));
  } catch {
    // Storage full or unavailable (private browsing, etc). Fail silently;
    // the app still works for the current session.
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
