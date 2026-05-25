import { useEffect, useState } from 'react'
import { MatchingPlayground } from './pages/MatchingPlayground'
import { TrackingScene } from './pages/TrackingScene'
import { readHashParams, writeHashParams } from './lib/urlState'

type TabKey = 'playground' | 'tracking'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'playground', label: '匹配' },
  { key: 'tracking', label: '跟踪' },
]

function readInitialTab(): TabKey {
  const fromHash = readHashParams().get('tab')
  return fromHash === 'tracking' ? 'tracking' : 'playground'
}

function App() {
  const [tab, setTab] = useState<TabKey>(readInitialTab)

  useEffect(() => {
    writeHashParams((params) => {
      if (tab === 'playground') params.delete('tab')
      else params.set('tab', tab)
    })
  }, [tab])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 pt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
              KM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 leading-tight">
                Kuhn–Munkres 与多目标跟踪
              </h1>
              <p className="text-xs text-slate-500">
                带权二部图最大权匹配
              </p>
            </div>
          </div>
          <nav className="flex gap-1" aria-label="切换视图">
            {TABS.map((t) => {
              const active = t.key === tab
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'text-brand-700'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-600" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </header>
      <main>
        {tab === 'playground' ? <MatchingPlayground /> : <TrackingScene />}
      </main>
    </div>
  )
}

export default App
