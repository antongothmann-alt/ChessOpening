export type Side = 'white' | 'black';

export interface OpeningPreset {
  id: string;
  name: string;
  eco?: string;
  startMoves: string[]; // SAN moves from the game start
  side: Side; // which side this opening is typically studied for
}

export interface SrsState {
  box: number; // Leitner box 1-5
  dueAt: number; // epoch ms
  lastReviewedAt?: number;
  reps: number;
  lapses: number;
}

export interface OpeningLine {
  id: string; // stable id, e.g. "3"
  label: number; // display number 1, 2, 3...
  moves: string[]; // full SAN sequence from game start (includes opening.startMoves)
  branchColor: string; // hex color for tree visualization
  divergesAtPly: number; // ply index (0-based, absolute) where this line first differs from the main line
  popularity: number; // 0-1 aggregate score, higher = more common
  learned: boolean;
  includeInPractice: boolean;
  srs: SrsState;
}

export interface Opening {
  id: string;
  name: string;
  eco?: string;
  side: Side;
  startMoves: string[];
  lines: OpeningLine[];
  linesGeneratedAt?: number;
  createdAt: number;
}

export interface AppSettings {
  showCurrentLineNumber: boolean;
  explorerSource: 'masters' | 'lichess';
}
