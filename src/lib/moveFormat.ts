export function movePairs(moves: string[]): { moveNo: number; white?: string; black?: string }[] {
  const pairs: { moveNo: number; white?: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      moveNo: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }
  return pairs;
}

export function movesToPgnString(moves: string[]): string {
  const pairs = movePairs(moves);
  return pairs.map((p) => `${p.moveNo}.${p.white ?? ''}${p.black ? ' ' + p.black : ''}`).join(' ');
}

export function popularityLabel(popularity: number): { label: string; color: string } {
  if (popularity >= 0.15) return { label: 'Main line', color: 'var(--good)' };
  if (popularity >= 0.03) return { label: 'Common', color: 'var(--accent)' };
  return { label: 'Sideline', color: 'var(--text-faint)' };
}
