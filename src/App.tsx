import { useState } from 'react'
import { MatchingPlayground } from './pages/MatchingPlayground'
import { TrackingScene } from './pages/TrackingScene'

type TabKey = 'playground' | 'tracking'

const TABS: { key: TabKey; label: string; description: string }[] = [
  {
    key: 'playground',
    label: '算法演示',
    description: '矩阵编辑 · KM / 匈牙利 / 贪心三算法对比',
  },
  {
    key: 'tracking',
    label: '跟踪模拟',
    description: '多目标跟踪场景 · 实时数据关联',
  },
]

function App() {
  const [tab, setTab] = useState<TabKey>('playground')

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
                KM 算法与多目标跟踪数据关联
              </h1>
              <p className="text-xs text-slate-500">
                带权二部图最大权匹配的交互演示
              </p>
            </div>
            <a
              href="https://github.com"
              className="ml-auto text-xs text-slate-400 hover:text-slate-600"
              target="_blank"
              rel="noreferrer"
            >
              图论及其应用 · 课程作业
            </a>
          </div>
          <nav className="flex gap-1" aria-label="页面切换">
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
      <footer className="text-center text-xs text-slate-400 py-6">
        Vite 8 · React 19 · TypeScript · Tailwind v4
      </footer>
    </div>
  )
}

export default App
