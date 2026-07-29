import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Check, Settings, X, PartyPopper } from 'lucide-react';
import type { Opening, OpeningLine, AppSettings } from '../types';
import { Board } from './Board';
import type { BoardMoveAttempt } from './Board';
import { movePairs } from '../lib/moveFormat';
import { reviewCorrect, reviewIncorrect, isDue, masteryLabel } from '../lib/srs';

interface PracticeViewProps {
  opening: Opening;
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onUpdateLine: (lineId: string, patch: Partial<OpeningLine>) => void;
}

type Feedback = 'idle' | 'correct' | 'incorrect' | 'complete';

export function PracticeView({ opening, settings, onUpdateSettings, onUpdateLine }: PracticeViewProps) {
  const [showSettings, setShowSettings] = useState(false);
  const eligible = opening.lines.filter((l) => l.learned && l.includeInPractice);

  const [currentLineId, setCurrentLineId] = useState<string | null>(() => pickNextLine(eligible)?.id ?? null);
  const currentLine = opening.lines.find((l) => l.id === currentLineId) ?? null;

  const [ply, setPly] = useState(opening.startMoves.length);
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [hadMistake, setHadMistake] = useState(false);
  const [hintArrow, setHintArrow] = useState<{ startSquare: string; endSquare: string; color: string }[]>([]);

  useEffect(() => {
    setPly(opening.startMoves.length);
    setFeedback('idle');
    setHadMistake(false);
    setHintArrow([]);
  }, [currentLineId, opening.startMoves.length]);

  const userIsWhite = opening.side === 'white';

  const fen = useMemo(() => {
    if (!currentLine) return new Chess().fen();
    const game = new Chess();
    for (let i = 0; i < ply; i++) game.move(currentLine.moves[i]);
    return game.fen();
  }, [currentLine, ply]);

  const isUsersPly = currentLine ? ply % 2 === (userIsWhite ? 0 : 1) : false;
  const lineComplete = currentLine ? ply >= currentLine.moves.length : false;

  // Auto-play the opponent's book move
  useEffect(() => {
    if (!currentLine || lineComplete || isUsersPly || feedback !== 'idle') return;
    const timer = setTimeout(() => setPly((p) => p + 1), 500);
    return () => clearTimeout(timer);
  }, [currentLine, ply, isUsersPly, lineComplete, feedback]);

  // Line finished: score it and update SRS
  useEffect(() => {
    if (!currentLine || !lineComplete || feedback === 'complete') return;
    setFeedback('complete');
    const updatedSrs = hadMistake ? reviewIncorrect(currentLine.srs) : reviewCorrect(currentLine.srs);
    onUpdateLine(currentLine.id, { srs: updatedSrs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineComplete]);

  function handleUserMove(move: BoardMoveAttempt) {
    if (!currentLine || feedback !== 'idle') return;
    const expected = currentLine.moves[ply];
    if (move.san === expected) {
      setFeedback('correct');
      setTimeout(() => {
        setFeedback('idle');
        setPly((p) => p + 1);
      }, 350);
    } else {
      setHadMistake(true);
      setFeedback('incorrect');
      const game = new Chess(fen);
      const result = game.move(expected);
      if (result) setHintArrow([{ startSquare: result.from, endSquare: result.to, color: '#d17b6f' }]);
      setTimeout(() => {
        setFeedback('idle');
        setHintArrow([]);
      }, 1100);
    }
  }

  function nextLine() {
    const next = pickNextLine(eligible.filter((l) => l.id !== currentLineId), currentLineId);
    setCurrentLineId(next?.id ?? null);
  }

  if (eligible.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: 12 }}>No lines in your practice pool yet.</p>
        <p style={{ fontSize: 13 }}>Mark lines as learned in the New Lines tab, then they'll show up here for spaced-repetition drilling.</p>
      </div>
    );
  }

  if (!currentLine) {
    return (
      <div style={{ padding: '60px 16px', textAlign: 'center' }}>
        <PartyPopper size={32} color="var(--accent)" style={{ marginBottom: 10 }} />
        <p style={{ color: 'var(--text-muted)' }}>All caught up for now. Nothing is due for review.</p>
        <button
          onClick={() => setCurrentLineId(pickNextLine(eligible)?.id ?? null)}
          style={{ ...primaryButtonStyle, marginTop: 16 }}
        >
          Practice anyway
        </button>
      </div>
    );
  }

  const pairs = movePairs(currentLine.moves);

  return (
    <div style={{ padding: '4px 4px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        {settings.showCurrentLineNumber ? (
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: currentLine.branchColor }}>
              Line #{currentLine.label}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-faint)', marginLeft: 8 }}>
              {masteryLabel(currentLine.srs.box)}
            </span>
          </div>
        ) : (
          <div />
        )}
        <button onClick={() => setShowSettings(true)} style={iconButtonStyle} aria-label="Practice settings">
          <Settings size={18} />
        </button>
      </div>

      <Board
        fen={fen}
        arrows={hintArrow}
        interactive={isUsersPly && feedback === 'idle'}
        orientation={userIsWhite ? 'white' : 'black'}
        onUserMove={handleUserMove}
        size={480}
      />

      <div style={{ minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
        {feedback === 'correct' && <FeedbackPill color="var(--good)" text="Correct" />}
        {feedback === 'incorrect' && <FeedbackPill color="var(--bad)" text="Not quite — watch the arrow" />}
        {feedback === 'idle' && !isUsersPly && !lineComplete && (
          <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>Playing the reply for you…</span>
        )}
        {feedback === 'idle' && isUsersPly && (
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Your move — drag or tap a piece</span>
        )}
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
              <span style={{ color: whiteIdx < ply ? 'var(--text)' : 'var(--text-faint)' }}>{p.white}</span>{' '}
              {p.black && <span style={{ color: blackIdx < ply ? 'var(--text)' : 'var(--text-faint)' }}>{p.black}</span>}
            </span>
          );
        })}
      </div>

      {feedback === 'complete' && (
        <div
          style={{
            background: 'var(--surface)',
            border: `1px solid ${hadMistake ? 'var(--bad)' : 'var(--good)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {hadMistake ? 'Line complete — a bit shaky' : 'Line complete — flawless'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {hadMistake ? "It'll come back around sooner." : `Next review: ${masteryLabel(currentLine.srs.box)}`}
          </div>
        </div>
      )}

      {feedback === 'complete' && (
        <button onClick={nextLine} style={{ ...primaryButtonStyle, width: '100%' }}>
          Continue
        </button>
      )}

      {showSettings && (
        <PracticeSettingsSheet
          opening={opening}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onUpdateLine={onUpdateLine}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function pickNextLine(lines: OpeningLine[], excludeId?: string | null): OpeningLine | undefined {
  const pool = excludeId ? lines.filter((l) => l.id !== excludeId) : lines;
  if (pool.length === 0) return undefined;
  const due = pool.filter((l) => isDue(l.srs));
  const source = due.length > 0 ? due : pool;
  return [...source].sort((a, b) => a.srs.dueAt - b.srs.dueAt)[0];
}

function FeedbackPill({ color, text }: { color: string; text: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 999,
        background: 'var(--surface-raised)',
        color,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {color === 'var(--good)' ? <Check size={14} /> : null}
      {text}
    </span>
  );
}

function PracticeSettingsSheet({
  opening,
  settings,
  onUpdateSettings,
  onUpdateLine,
  onClose,
}: {
  opening: Opening;
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onUpdateLine: (lineId: string, patch: Partial<OpeningLine>) => void;
  onClose: () => void;
}) {
  const learnedLines = opening.lines.filter((l) => l.learned);
  const sortedAllLines = [...opening.lines].sort((a, b) => a.label - b.label);
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,10,14,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderRadius: '20px 20px 0 0',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '16px 16px 32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 19 }}>Practice settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <ToggleRow
          label="Show current line number"
          checked={settings.showCurrentLineNumber}
          onChange={(v) => onUpdateSettings({ showCurrentLineNumber: v })}
        />

        <div style={{ color: 'var(--text-faint)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 8px' }}>
          Mark lines as learned
        </div>
        <p style={{ color: 'var(--text-faint)', fontSize: 12, margin: '0 0 8px' }}>
          Tick a line here to add it straight to your practice pool — you don't need to drill it first.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sortedAllLines.length === 0 && (
            <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>No lines generated yet.</p>
          )}
          {sortedAllLines.map((l) => (
            <label
              key={l.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${l.branchColor}`,
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
              }}
            >
              <span style={{ fontSize: 14 }}>
                #{l.label} <span style={{ color: 'var(--text-faint)' }}>· {l.learned ? masteryLabel(l.srs.box) : 'Not learned'}</span>
              </span>
              <input
                type="checkbox"
                checked={l.learned}
                onChange={(e) => onUpdateLine(l.id, { learned: e.target.checked, includeInPractice: true })}
                style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
              />
            </label>
          ))}
        </div>

        <div style={{ color: 'var(--text-faint)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 8px' }}>
          Lines in practice pool
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {learnedLines.length === 0 && (
            <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>No learned lines yet.</p>
          )}
          {learnedLines.map((l) => (
            <label
              key={l.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${l.branchColor}`,
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
              }}
            >
              <span style={{ fontSize: 14 }}>
                #{l.label} <span style={{ color: 'var(--text-faint)' }}>· {masteryLabel(l.srs.box)}</span>
              </span>
              <input
                type="checkbox"
                checked={l.includeInPractice}
                onChange={(e) => onUpdateLine(l.id, { includeInPractice: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 2px' }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 20, height: 20, accentColor: 'var(--accent)' }}
      />
    </label>
  );
}

const iconButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
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
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 44,
  padding: '0 18px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--accent)',
  color: 'var(--accent-text)',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};
