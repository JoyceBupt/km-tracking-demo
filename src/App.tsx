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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-stretch gap-10 h-16">
            <span className="self-center text-base font-semibold tracking-tight text-slate-900">
              Kuhn–Munkres 算法
            </span>
            <nav className="flex" aria-label="切换视图">
              {TABS.map((t) => {
                const active = t.key === tab
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`relative h-full px-5 text-sm font-medium transition-colors ${
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
        </div>
      </header>
      <main>
        {tab === 'playground' ? <MatchingPlayground /> : <TrackingScene />}
      </main>
    </div>
  )
}

export default App
