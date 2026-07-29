import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { ArrowLeft, Check, Play, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { Opening, OpeningLine } from '../types';
import { Board } from './Board';
import { movePairs, popularityLabel } from '../lib/moveFormat';

interface NewLinesViewProps {
  opening: Opening;
  onToggleLearned: (lineId: string) => void;
}

export function NewLinesView({ opening, onToggleLearned }: NewLinesViewProps) {
  const [activeLine, setActiveLine] = useState<OpeningLine | null>(null);
  const newLines = opening.lines.filter((l) => !l.learned);
  const learnedLines = opening.lines.filter((l) => l.learned);

  if (activeLine) {
    return (
      <LineDemoViewer
        opening={opening}
        line={activeLine}
        onClose={() => setActiveLine(null)}
        onMarkLearned={() => {
          onToggleLearned(activeLine.id);
          setActiveLine(null);
        }}
      />
    );
  }

  return (
    <div style={{ padding: '4px 4px 24px' }}>
      {newLines.length === 0 && learnedLines.length === 0 && (
        <p style={{ color: 'var(--text-muted)', padding: '12px 4px' }}>No lines generated yet.</p>
      )}

      {newLines.length > 0 && (
        <>
          <SectionLabel text={`New (${newLines.length})`} />
          <LineList lines={newLines} onOpen={setActiveLine} onToggleLearned={onToggleLearned} />
        </>
      )}

      {learnedLines.length > 0 && (
        <>
          <SectionLabel text={`Learned (${learnedLines.length})`} />
          <LineList lines={learnedLines} onOpen={setActiveLine} onToggleLearned={onToggleLearned} dimmed />
        </>
      )}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        color: 'var(--text-faint)',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        margin: '18px 8px 8px',
      }}
    >
      {text}
    </div>
  );
}

function LineList({
  lines,
  onOpen,
  onToggleLearned,
  dimmed,
}: {
  lines: OpeningLine[];
  onOpen: (line: OpeningLine) => void;
  onToggleLearned: (id: string) => void;
  dimmed?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {lines.map((line) => {
        const pop = popularityLabel(line.popularity);
        const preview = line.moves.slice(Math.max(0, line.divergesAtPly - 1)).join(' ');
        return (
          <div
            key={line.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: `4px solid ${line.branchColor}`,
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              opacity: dimmed ? 0.6 : 1,
            }}
          >
            <button
              onClick={() => onToggleLearned(line.id)}
              aria-label={line.learned ? 'Mark as not learned' : 'Mark as learned'}
              style={{
                width: 26,
                height: 26,
                flexShrink: 0,
                borderRadius: 7,
                border: `1.5px solid ${line.learned ? 'var(--good)' : 'var(--border)'}`,
                background: line.learned ? 'var(--good)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {line.learned && <Check size={16} color="#10141b" strokeWidth={3} />}
            </button>

            <button
              onClick={() => onOpen(line)}
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 13,
                    color: line.branchColor,
                    minWidth: 20,
                  }}
                >
                  #{line.label}
                </span>
                <span style={{ fontSize: 12, color: pop.color }}>{pop.label}</span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {preview}
              </div>
            </button>

            <ChevronRight size={18} color="var(--text-faint)" style={{ flexShrink: 0 }} />
          </div>
        );
      })}
    </div>
  );
}

function LineDemoViewer({
  opening,
  line,
  onClose,
  onMarkLearned,
}: {
  opening: Opening;
  line: OpeningLine;
  onClose: () => void;
  onMarkLearned: () => void;
}) {
  const startPly = opening.startMoves.length;
  const [ply, setPly] = useState(startPly);
  const [showTip, setShowTip] = useState(true);

  useEffect(() => {
    setPly(startPly);
    setShowTip(true);
  }, [line.id, startPly]);

  const fen = useMemo(() => {
    const game = new Chess();
    for (let i = 0; i < ply; i++) game.move(line.moves[i]);
    return game.fen();
  }, [line.moves, ply]);

  const tipArrow = useMemo(() => {
    if (!showTip || ply >= line.moves.length) return [];
    const game = new Chess();
    for (let i = 0; i < ply; i++) game.move(line.moves[i]);
    const result = game.move(line.moves[ply]);
    if (!result) return [];
    return [{ startSquare: result.from, endSquare: result.to, color: '#d9a95c' }];
  }, [line.moves, ply, showTip]);

  const atEnd = ply >= line.moves.length;

  function stepNext() {
    if (atEnd) return;
    setPly((p) => p + 1);
    setShowTip(true);
  }
  function stepPrev() {
    if (ply <= startPly) return;
    setPly((p) => p - 1);
    setShowTip(true);
  }
  function restart() {
    setPly(startPly);
    setShowTip(true);
  }

  const pairs = movePairs(line.moves);
  const currentMoveIndex = ply;

  return (
    <div style={{ padding: '4px 4px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button onClick={onClose} style={iconButtonStyle} aria-label="Back to line list">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: line.branchColor }}>
            Line #{line.label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{opening.name}</div>
        </div>
      </div>

      <Board fen={fen} arrows={tipArrow} interactive size={480} />

      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '16px 0' }}>
        <button onClick={restart} style={iconButtonStyle} aria-label="Restart line">
          <RotateCcw size={18} />
        </button>
        <button onClick={stepPrev} disabled={ply <= startPly} style={iconButtonStyle} aria-label="Previous move">
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={stepNext}
          disabled={atEnd}
          style={{ ...primaryButtonStyle, opacity: atEnd ? 0.4 : 1 }}
        >
          <Play size={16} fill="currentColor" />
          {atEnd ? 'End of line' : 'Show next move'}
        </button>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          fontSize: 14,
          lineHeight: 1.9,
          marginBottom: 16,
        }}
      >
        {pairs.map((p, pairIdx) => {
          const whiteIdx = pairIdx * 2;
          const blackIdx = pairIdx * 2 + 1;
          return (
            <span key={p.moveNo} style={{ marginRight: 10 }}>
              <span style={{ color: 'var(--text-faint)' }}>{p.moveNo}.</span>{' '}
              <span style={{ color: whiteIdx < currentMoveIndex ? 'var(--text)' : 'var(--text-faint)', fontWeight: whiteIdx === currentMoveIndex - 1 ? 700 : 400 }}>
                {p.white}
              </span>{' '}
              {p.black && (
                <span style={{ color: blackIdx < currentMoveIndex ? 'var(--text)' : 'var(--text-faint)', fontWeight: blackIdx === currentMoveIndex - 1 ? 700 : 400 }}>
                  {p.black}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {!line.learned && (
        <button onClick={onMarkLearned} style={{ ...primaryButtonStyle, width: '100%', background: 'var(--good)' }}>
          <Check size={18} strokeWidth={2.5} />
          Mark line as learned
        </button>
      )}
    </div>
  );
}

const iconButtonStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 40,
  padding: '0 16px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--accent)',
  color: 'var(--accent-text)',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};
