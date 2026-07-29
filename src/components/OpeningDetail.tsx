import { useState } from 'react';
import { ArrowLeft, BookOpen, Brain, Loader2, RefreshCw } from 'lucide-react';
import type { Opening, OpeningLine, AppSettings } from '../types';
import { buildOpeningLines } from '../lib/explorer';
import { NewLinesView } from './NewLinesView';
import { PracticeView } from './PracticeView';

interface OpeningDetailProps {
  opening: Opening;
  settings: AppSettings;
  onBack: () => void;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onSetLines: (lines: OpeningLine[]) => void;
  onUpdateLine: (lineId: string, patch: Partial<OpeningLine>) => void;
}

type Mode = 'menu' | 'new-lines' | 'learn';

export function OpeningDetail({ opening, settings, onBack, onUpdateSettings, onSetLines, onUpdateLine }: OpeningDetailProps) {
  const [mode, setMode] = useState<Mode>('menu');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ requests: 0, leaves: 0 });
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const lines = await buildOpeningLines(opening.startMoves, settings.explorerSource, setProgress);
      if (lines.length === 0) {
        setError("Couldn't reach the Lichess database, or no games were found for this line. Try again in a moment.");
      } else {
        onSetLines(lines);
      }
    } catch {
      setError('Something went wrong generating lines. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <button
        onClick={mode === 'menu' ? onBack : () => setMode('menu')}
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        aria-label="Back"
      >
        <ArrowLeft size={18} />
      </button>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {opening.name}
        </h1>
        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          {opening.eco ? `${opening.eco} · ` : ''}
          {opening.side === 'white' ? 'For White' : 'For Black'}
        </div>
      </div>
    </div>
  );

  if (opening.lines.length === 0) {
    return (
      <div style={{ padding: '20px 16px 40px', maxWidth: 640, margin: '0 auto' }}>
        {header}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px 20px',
            textAlign: 'center',
          }}
        >
          {!generating && (
            <>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                Pull the most-played lines for this opening from the Lichess database.
              </p>
              <button onClick={generate} style={primaryButtonStyle}>
                Generate lines
              </button>
              {error && <p style={{ color: 'var(--bad)', fontSize: 13, marginTop: 14 }}>{error}</p>}
            </>
          )}
          {generating && (
            <>
              <Loader2 size={24} className="spin" color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 14 }}>
                Querying positions… {progress.requests} looked up, {progress.leaves} lines found
              </p>
              <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 16px 40px', maxWidth: 640, margin: '0 auto' }}>
      {header}

      {mode === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PathCard
            icon={<BookOpen size={22} />}
            title="New Lines"
            subtitle={`${opening.lines.filter((l) => !l.learned).length} to learn · browse and tick off`}
            onClick={() => setMode('new-lines')}
          />
          <PathCard
            icon={<Brain size={22} />}
            title="Learn"
            subtitle={`${opening.lines.filter((l) => l.learned).length} learned · spaced-repetition practice`}
            onClick={() => setMode('learn')}
          />
          <button
            onClick={generate}
            disabled={generating}
            style={{ ...secondaryButtonStyle, marginTop: 4 }}
          >
            <RefreshCw size={14} style={generating ? { animation: 'spin 1s linear infinite' } : undefined} />
            {generating ? 'Refreshing…' : 'Refresh lines from Lichess'}
          </button>
          <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        </div>
      )}

      {mode === 'new-lines' && <NewLinesView opening={opening} onToggleLearned={(id) => {
        const line = opening.lines.find((l) => l.id === id);
        if (!line) return;
        onUpdateLine(id, { learned: !line.learned, includeInPractice: true });
      }} />}

      {mode === 'learn' && (
        <PracticeView
          opening={opening}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onUpdateLine={onUpdateLine}
        />
      )}
    </div>
  );
}

function PathCard({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        textAlign: 'left',
        cursor: 'pointer',
        color: 'var(--text)',
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          background: 'var(--surface-raised)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
      </div>
    </button>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 44,
  padding: '0 20px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--accent)',
  color: 'var(--accent-text)',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 40,
  padding: '0 16px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-muted)',
  fontWeight: 500,
  fontSize: 13,
  cursor: 'pointer',
};
