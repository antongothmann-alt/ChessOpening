import { useMemo, useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { Chessboard, defaultArrowOptions } from 'react-chessboard';
import type { Arrow } from 'react-chessboard';

const arrowOptions = {
  ...defaultArrowOptions,
  color: '#d9a95c',
  secondaryColor: '#f2c879',
  opacity: 0.9,
};

export interface BoardMoveAttempt {
  san: string;
  from: string;
  to: string;
}

interface BoardProps {
  fen: string;
  arrows?: Arrow[];
  interactive?: boolean;
  orientation?: 'white' | 'black';
  onUserMove?: (move: BoardMoveAttempt) => void;
  size?: number;
}

export function Board({ fen, arrows = [], interactive = true, orientation = 'white', onUserMove, size }: BoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  // Reset selection whenever the position changes externally (new line, auto-play, etc.)
  useEffect(() => {
    setSelectedSquare(null);
  }, [fen]);

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];
    try {
      const game = new Chess(fen);
      return game.moves({ square: selectedSquare as Square, verbose: true }).map((m) => m.to as string);
    } catch {
      return [];
    }
  }, [selectedSquare, fen]);

  function attemptMove(from: string, to: string): boolean {
    try {
      const game = new Chess(fen);
      const result = game.move({ from, to, promotion: 'q' });
      if (!result) return false;
      onUserMove?.({ san: result.san, from, to });
      return true;
    } catch {
      return false;
    }
  }

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (selectedSquare) {
    squareStyles[selectedSquare] = { boxShadow: 'inset 0 0 0 3px var(--accent)' };
  }
  for (const target of legalTargets) {
    squareStyles[target] = {
      background:
        'radial-gradient(circle, rgba(217,169,92,0.55) 22%, transparent 24%)',
    };
  }

  return (
    <div style={{ width: size ?? '100%', maxWidth: size ?? 520, margin: '0 auto' }}>
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          showAnimations: true,
          animationDurationInMs: 220,
          allowDragging: interactive,
          allowDrawingArrows: false,
          arrows,
          arrowOptions,
          darkSquareStyle: { backgroundColor: 'var(--board-dark)' },
          lightSquareStyle: { backgroundColor: 'var(--board-light)' },
          squareStyles,
          showNotation: true,
          alphaNotationStyle: { color: 'rgba(233,237,243,0.35)', fontSize: '0.65rem' },
          numericNotationStyle: { color: 'rgba(233,237,243,0.35)', fontSize: '0.65rem' },
          canDragPiece: ({ piece }) => interactive && !!piece,
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!interactive || !targetSquare) return false;
            return attemptMove(sourceSquare, targetSquare);
          },
          onSquareClick: ({ square, piece }) => {
            if (!interactive) return;
            if (selectedSquare) {
              if (square === selectedSquare) {
                setSelectedSquare(null);
                return;
              }
              if (legalTargets.includes(square)) {
                const moved = attemptMove(selectedSquare, square);
                if (moved) {
                  setSelectedSquare(null);
                  return;
                }
              }
              // Not a legal target: maybe selecting a different own piece
              if (piece) {
                setSelectedSquare(square);
              } else {
                setSelectedSquare(null);
              }
              return;
            }
            if (piece) setSelectedSquare(square);
          },
        }}
      />
    </div>
  );
}

