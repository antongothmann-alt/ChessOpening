import { useEffect, useState } from 'react';
import type { Opening, OpeningLine, OpeningPreset, AppSettings } from './types';
import { loadOpenings, saveOpenings, loadSettings, saveSettings } from './lib/storage';
import { handleAuthRedirect } from './lib/lichessAuth';
import { OpeningsHome } from './components/OpeningsHome';
import { OpeningDetail } from './components/OpeningDetail';

export default function App() {
  const [openings, setOpenings] = useState<Opening[]>(() => loadOpenings());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    handleAuthRedirect().finally(() => setAuthReady(true));
  }, []);

  useEffect(() => saveOpenings(openings), [openings]);
  useEffect(() => saveSettings(settings), [settings]);

  function addOpening(preset: OpeningPreset) {
    const opening: Opening = {
      id: preset.id,
      name: preset.name,
      eco: preset.eco,
      side: preset.side,
      startMoves: preset.startMoves,
      lines: [],
      createdAt: Date.now(),
    };
    setOpenings((prev) => [...prev, opening]);
  }

  function removeOpening(id: string) {
    setOpenings((prev) => prev.filter((o) => o.id !== id));
    if (activeId === id) setActiveId(null);
  }

  function setLines(openingId: string, lines: OpeningLine[]) {
    setOpenings((prev) =>
      prev.map((o) => (o.id === openingId ? { ...o, lines, linesGeneratedAt: Date.now() } : o))
    );
  }

  function updateLine(openingId: string, lineId: string, patch: Partial<OpeningLine>) {
    setOpenings((prev) =>
      prev.map((o) =>
        o.id !== openingId
          ? o
          : { ...o, lines: o.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)) }
      )
    );
  }

  const activeOpening = openings.find((o) => o.id === activeId) ?? null;

  if (!authReady) {
    return (
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%' }}>
      {!activeOpening && (
        <OpeningsHome openings={openings} onAdd={addOpening} onOpen={setActiveId} onRemove={removeOpening} />
      )}
      {activeOpening && (
        <OpeningDetail
          opening={activeOpening}
          settings={settings}
          onBack={() => setActiveId(null)}
          onUpdateSettings={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          onSetLines={(lines) => setLines(activeOpening.id, lines)}
          onUpdateLine={(lineId, patch) => updateLine(activeOpening.id, lineId, patch)}
        />
      )}
    </div>
  );
}
