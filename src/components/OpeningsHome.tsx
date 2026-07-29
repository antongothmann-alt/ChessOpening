import { useMemo, useState } from 'react';
import { Plus, ChevronRight, X } from 'lucide-react';
import type { Opening, OpeningPreset } from '../types';
import { OPENING_PRESETS } from '../lib/openingPresets';
import { isLoggedIn, logout } from '../lib/lichessAuth';

interface OpeningsHomeProps {
  openings: Opening[];
  onAdd: (preset: OpeningPreset) => void;
  onOpen: (openingId: string) => void;
  onRemove: (openingId: string) => void;
}

export function OpeningsHome({ openings, onAdd, onOpen, onRemove }: OpeningsHomeProps) {
  const [showAdd, setShowAdd] = useState(false);

  const addedIds = useMemo(() => new Set(openings.map((o) => o.id)), [openings]);

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 640, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--text-faint)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
          Opening Trainer
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>My Openings</h1>
        {isLoggedIn() ? (
          <button
            onClick={() => {
              logout();
              window.location.reload();
            }}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--good)', fontSize: 12, cursor: 'pointer' }}
          >
            ● Lichess connected — disconnect
          </button>
        ) : (
          <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>○ Not connected to Lichess</span>
        )}
      </header>

      {openings.length === 0 && (
        <div
          style={{
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            marginBottom: 20,
          }}
        >
          No openings yet. Add one to pull its lines from the Lichess database.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {openings.map((o) => {
          const learnedCount = o.lines.filter((l) => l.learned).length;
          return (
            <button
              key={o.id}
              onClick={() => onOpen(o.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                color: 'var(--text)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{o.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>
                  {o.eco ? `${o.eco} · ` : ''}
                  {o.side === 'white' ? 'For White' : 'For Black'}
                  {o.lines.length > 0 && ` · ${learnedCount}/${o.lines.length} lines learned`}
                </div>
              </div>
              <ChevronRight size={20} color="var(--text-faint)" style={{ flexShrink: 0 }} />
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        style={{
          marginTop: 20,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'var(--accent)',
          color: 'var(--accent-text)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        <Plus size={18} strokeWidth={2.5} />
        Add Opening
      </button>

      {showAdd && (
        <AddOpeningSheet
          addedIds={addedIds}
          onClose={() => setShowAdd(false)}
          onPick={(preset) => {
            onAdd(preset);
            setShowAdd(false);
          }}
          onRemove={onRemove}
        />
      )}
    </div>
  );
}

function AddOpeningSheet({
  addedIds,
  onClose,
  onPick,
  onRemove,
}: {
  addedIds: Set<string>;
  onClose: () => void;
  onPick: (preset: OpeningPreset) => void;
  onRemove: (id: string) => void;
}) {
  const white = OPENING_PRESETS.filter((p) => p.side === 'white');
  const black = OPENING_PRESETS.filter((p) => p.side === 'black');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,10,14,0.6)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 50,
      }}
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
          <h2 style={{ fontSize: 19 }}>Add an opening</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <X size={22} />
          </button>
        </div>

        <PresetGroup title="White repertoire" presets={white} addedIds={addedIds} onPick={onPick} onRemove={onRemove} />
        <PresetGroup title="Black repertoire" presets={black} addedIds={addedIds} onPick={onPick} onRemove={onRemove} />
      </div>
    </div>
  );
}

function PresetGroup({
  title,
  presets,
  addedIds,
  onPick,
  onRemove,
}: {
  title: string;
  presets: OpeningPreset[];
  addedIds: Set<string>;
  onPick: (preset: OpeningPreset) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ color: 'var(--text-faint)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {presets.map((p) => {
          const added = addedIds.has(p.id);
          return (
            <button
              key={p.id}
              onClick={() => (added ? onRemove(p.id) : onPick(p))}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: added ? 'var(--surface-hover)' : 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                color: added ? 'var(--text-muted)' : 'var(--text)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>
                {p.name}
                {p.eco && <span style={{ color: 'var(--text-faint)' }}> · {p.eco}</span>}
              </span>
              <span style={{ fontSize: 12, color: added ? 'var(--bad)' : 'var(--accent)' }}>
                {added ? 'Remove' : 'Add'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
