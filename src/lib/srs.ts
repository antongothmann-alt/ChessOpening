import type { SrsState } from '../types';

// Leitner system: 5 boxes, increasing review intervals.
// Box index -> interval in ms before the card is due again.
const INTERVALS_MS = [
  0, // box 1: due immediately (still learning)
  1000 * 60 * 60 * 8, // box 2: ~8 hours
  1000 * 60 * 60 * 24, // box 3: 1 day
  1000 * 60 * 60 * 24 * 3, // box 4: 3 days
  1000 * 60 * 60 * 24 * 7, // box 5: 7 days
];

export function createSrsState(): SrsState {
  return { box: 1, dueAt: Date.now(), reps: 0, lapses: 0 };
}

export function reviewCorrect(state: SrsState): SrsState {
  const nextBox = Math.min(state.box + 1, INTERVALS_MS.length);
  return {
    box: nextBox,
    dueAt: Date.now() + INTERVALS_MS[nextBox - 1],
    lastReviewedAt: Date.now(),
    reps: state.reps + 1,
    lapses: state.lapses,
  };
}

export function reviewIncorrect(state: SrsState): SrsState {
  return {
    box: 1,
    dueAt: Date.now() + INTERVALS_MS[0],
    lastReviewedAt: Date.now(),
    reps: state.reps + 1,
    lapses: state.lapses + 1,
  };
}

export function isDue(state: SrsState): boolean {
  return state.dueAt <= Date.now();
}

export function masteryLabel(box: number): string {
  if (box >= 5) return 'Mastered';
  if (box >= 3) return 'Solid';
  if (box >= 2) return 'Learning';
  return 'New';
}
