import { MatchingPlayground } from './pages/MatchingPlayground'

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-3">
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
        </div>
      </header>
      <main>
        <MatchingPlayground />
      </main>
    </div>
  )
}

export default App
