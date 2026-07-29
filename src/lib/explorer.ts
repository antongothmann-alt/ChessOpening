import { Chess } from 'chess.js';
import type { OpeningLine } from '../types';

const EXPLORER_BASE = 'https://explorer.lichess.ovh';

// Tunable generation limits. Kept conservative so the app stays fast and
// polite to the free, third-party Lichess API.
const MAX_REQUESTS = 55;
const MAX_PLY_BEYOND_START = 12;
const MIN_SHARE = 0.08; // a branch needs at least 8% of games at that node to be included
const MIN_GAMES_TO_EXPAND = 12; // below this, treat the node as "end of book" and stop
const MAX_BRANCHES_PER_NODE = 3;
const MAX_LEAVES = 24;
const REQUEST_DELAY_MS = 90;

export type ExplorerSource = 'masters' | 'lichess';

interface ExplorerMove {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
}

interface ExplorerResponse {
  white: number;
  draws: number;
  black: number;
  moves: ExplorerMove[];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPosition(fen: string, source: ExplorerSource, attempt = 0): Promise<ExplorerResponse | null> {
  const url =
    source === 'masters'
      ? `${EXPLORER_BASE}/masters?fen=${encodeURIComponent(fen)}&moves=8&topGames=0`
      : `${EXPLORER_BASE}/lichess?fen=${encodeURIComponent(fen)}&moves=8&topGames=0&speeds=blitz,rapid,classical&ratings=1800,2000,2200`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 429 && attempt < 2) {
      await sleep(700 * (attempt + 1));
      return fetchPosition(fen, source, attempt + 1);
    }
    if (!res.ok) return null;
    return (await res.json()) as ExplorerResponse;
  } catch {
    return null;
  }
}

interface TreeNode {
  moves: string[];
  fen: string;
  popularity: number;
  depth: number;
}

const BRANCH_PALETTE = [
  '#7aa2c8', // steel blue (main line)
  '#c98a5e', // clay
  '#8fbf8f', // sage
  '#c77dab', // mauve
  '#d9c15c', // ochre
  '#7dc7bf', // teal
  '#a68fd0', // violet
  '#d97b7b', // terracotta red
];

/**
 * Builds a pruned tree of opening lines starting from `startMoves`, using
 * the Lichess Opening Explorer as the source of truth for which
 * continuations are actually played. Returns a flat list of leaf lines,
 * most popular first, each carrying enough metadata to render a colored
 * tree and to drill in practice mode.
 *
 * This performs many network requests and should be called from the
 * browser (not during SSR/build), with a loading state shown to the user.
 */
export async function buildOpeningLines(
  startMoves: string[],
  source: ExplorerSource,
  onProgress?: (info: { requests: number; leaves: number }) => void
): Promise<OpeningLine[]> {
  const seed = new Chess();
  for (const san of startMoves) {
    seed.move(san);
  }

  const root: TreeNode = { moves: [...startMoves], fen: seed.fen(), popularity: 1, depth: 0 };
  const queue: TreeNode[] = [root];
  const leaves: TreeNode[] = [];
  let requests = 0;

  while (queue.length > 0 && requests < MAX_REQUESTS && leaves.length < MAX_LEAVES) {
    queue.sort((a, b) => b.popularity - a.popularity);
    const node = queue.shift()!;

    if (node.depth >= MAX_PLY_BEYOND_START) {
      leaves.push(node);
      continue;
    }

    const data = await fetchPosition(node.fen, source);
    requests++;
    onProgress?.({ requests, leaves: leaves.length });
    if (requests < MAX_REQUESTS) await sleep(REQUEST_DELAY_MS);

    if (!data || data.moves.length === 0) {
      leaves.push(node);
      continue;
    }

    const totalAtNode = data.moves.reduce((sum, m) => sum + m.white + m.draws + m.black, 0);
    if (totalAtNode < MIN_GAMES_TO_EXPAND) {
      leaves.push(node);
      continue;
    }

    const sorted = [...data.moves].sort(
      (a, b) => b.white + b.draws + b.black - (a.white + a.draws + a.black)
    );
    const qualifying = sorted.filter((m, i) => {
      const share = (m.white + m.draws + m.black) / totalAtNode;
      return i === 0 || share >= MIN_SHARE;
    });
    const chosen = qualifying.slice(0, MAX_BRANCHES_PER_NODE);

    if (chosen.length === 0) {
      leaves.push(node);
      continue;
    }

    let addedChild = false;
    for (const move of chosen) {
      const share = (move.white + move.draws + move.black) / totalAtNode;
      const childChess = new Chess(node.fen);
      let sanPlayed: string | undefined;
      try {
        const result = childChess.move(move.san);
        sanPlayed = result?.san;
      } catch {
        continue;
      }
      if (!sanPlayed) continue;
      queue.push({
        moves: [...node.moves, sanPlayed],
        fen: childChess.fen(),
        popularity: node.popularity * share,
        depth: node.depth + 1,
      });
      addedChild = true;
    }
    if (!addedChild) leaves.push(node);
  }

  // Whatever's left unexpanded when we hit our budget still counts as valid lines
  leaves.push(...queue);

  leaves.sort((a, b) => b.popularity - a.popularity);
  const finalLeaves = leaves.slice(0, MAX_LEAVES).filter((l) => l.moves.length > startMoves.length);

  return assignLineMetadata(finalLeaves, startMoves.length);
}

function assignLineMetadata(leaves: TreeNode[], startLength: number): OpeningLine[] {
  if (leaves.length === 0) return [];
  const mainLine = leaves[0].moves;

  return leaves.map((leaf, index) => {
    // Find where this line first diverges from the most popular line
    let divergesAt = startLength;
    while (
      divergesAt < leaf.moves.length &&
      divergesAt < mainLine.length &&
      leaf.moves[divergesAt] === mainLine[divergesAt]
    ) {
      divergesAt++;
    }
    const branchIndex = divergesAt === leaf.moves.length ? 0 : divergesAt % BRANCH_PALETTE.length;
    return {
      id: String(index + 1),
      label: index + 1,
      moves: leaf.moves,
      branchColor: index === 0 ? BRANCH_PALETTE[0] : BRANCH_PALETTE[branchIndex],
      divergesAtPly: divergesAt,
      popularity: leaf.popularity,
      learned: false,
      includeInPractice: true,
      srs: { box: 1, dueAt: Date.now(), reps: 0, lapses: 0 },
    };
  });
}
