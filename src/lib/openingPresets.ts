import type { OpeningPreset } from '../types';

// Starting move sequences (SAN) used purely to anchor the position we query
// the Lichess Opening Explorer from. The explorer fills in every branch
// beyond this point.
export const OPENING_PRESETS: OpeningPreset[] = [
  { id: 'italian', name: 'Italian Game', eco: 'C50', side: 'white', startMoves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'] },
  { id: 'ruy-lopez', name: 'Ruy Lopez', eco: 'C60', side: 'white', startMoves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] },
  { id: 'scotch', name: 'Scotch Game', eco: 'C44', side: 'white', startMoves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'] },
  { id: 'kings-gambit', name: "King's Gambit", eco: 'C30', side: 'white', startMoves: ['e4', 'e5', 'f4'] },
  { id: 'london', name: 'London System', eco: 'D02', side: 'white', startMoves: ['d4', 'd5', 'Bf4'] },
  { id: 'queens-gambit', name: "Queen's Gambit", eco: 'D06', side: 'white', startMoves: ['d4', 'd5', 'c4'] },
  { id: 'catalan', name: 'Catalan', eco: 'E00', side: 'white', startMoves: ['d4', 'Nf6', 'c4', 'e6', 'g3'] },
  { id: 'english', name: 'English Opening', eco: 'A10', side: 'white', startMoves: ['c4'] },
  { id: 'reti', name: 'Réti Opening', eco: 'A04', side: 'white', startMoves: ['Nf3'] },
  { id: 'vienna', name: 'Vienna Game', eco: 'C25', side: 'white', startMoves: ['e4', 'e5', 'Nc3'] },
  { id: 'sicilian-najdorf', name: 'Sicilian Najdorf', eco: 'B90', side: 'black', startMoves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'] },
  { id: 'sicilian-open', name: 'Sicilian Defense (Open)', eco: 'B20', side: 'black', startMoves: ['e4', 'c5'] },
  { id: 'french', name: 'French Defense', eco: 'C00', side: 'black', startMoves: ['e4', 'e6'] },
  { id: 'caro-kann', name: 'Caro-Kann Defense', eco: 'B10', side: 'black', startMoves: ['e4', 'c6'] },
  { id: 'scandinavian', name: 'Scandinavian Defense', eco: 'B01', side: 'black', startMoves: ['e4', 'd5'] },
  { id: 'pirc', name: 'Pirc Defense', eco: 'B07', side: 'black', startMoves: ['e4', 'd6'] },
  { id: 'kings-indian', name: "King's Indian Defense", eco: 'E60', side: 'black', startMoves: ['d4', 'Nf6', 'c4', 'g6'] },
  { id: 'nimzo-indian', name: 'Nimzo-Indian Defense', eco: 'E20', side: 'black', startMoves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'] },
  { id: 'grunfeld', name: 'Grünfeld Defense', eco: 'D70', side: 'black', startMoves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'] },
  { id: 'slav', name: 'Slav Defense', eco: 'D10', side: 'black', startMoves: ['d4', 'd5', 'c4', 'c6'] },
  { id: 'dutch', name: 'Dutch Defense', eco: 'A80', side: 'black', startMoves: ['d4', 'f5'] },
  { id: 'benoni', name: 'Modern Benoni', eco: 'A60', side: 'black', startMoves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'e6'] },
];
