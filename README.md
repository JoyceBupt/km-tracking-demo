# Kuhn–Munkres 与多目标跟踪数据关联

一个交互式 Web 应用，演示带权二部图最大权匹配（Kuhn–Munkres 算法）如何解决多目标跟踪中的帧间数据关联问题。

> **在线体验**：<https://km-tracking.joyhey.de/>

## 这个项目做了什么

多目标跟踪（Multi-Object Tracking, MOT）需要在连续视频帧之间保持每个目标的稳定身份。每一帧：

1. 检测器输出若干候选框（位置、尺寸）；
2. 跟踪器把这些检测**关联**到上一帧的轨迹上；
3. 关联正确 → 同一物体的 ID 保持不变；关联错误 → ID 切换、轨迹断裂。

把"轨迹"和"检测"分别作为二部图的左右两部，关联权重（IoU 或中心距离的倒数）作为边权，**关联问题就变成了带权二部图最大权匹配问题**——这正是 KM 算法的标准应用形式。

本项目用纯浏览器端的实现完成了：

- KM 与贪心两种匹配算法的从零实现，便于对照
- KM 算法**分步执行**的可视化（顶标、相等子图、增广路径全部可见）
- 多目标跟踪场景的合成数据模拟（带可控的噪声、漏检、误检、出生消失）
- **同 seed 下 KM 与贪心并排对比**，可直接观察算法选择对 ID 切换数的影响
- 四个一键加载的典型场景：随机游走、对穿交叉、密集拥挤、强噪声 / 高误检

## 应用结构

应用有两个 Tab：

| Tab | 内容 |
|---|---|
| **匹配** | 矩阵编辑器、KM 与贪心结果对比、KM 最优匹配的二部图、KM 分步执行回放 |
| **跟踪** | 合成跟踪场景、控制面板、当前帧关联可视化、KM vs 贪心对比模式 |

所有状态（当前 Tab、矩阵、参数、场景）会自动写入 URL hash，可直接分享链接复现。

## 技术栈

| 类别 | 选择 |
|---|---|
| 构建工具 | Vite 8（Rolldown + Oxc 工具链） |
| 框架 | React 19 + TypeScript 6 |
| 样式 | Tailwind CSS v4 |
| 测试 | Vitest 4 + Testing Library |
| Lint | oxlint（与 Vite 同源） |
| 可视化 | 原生 SVG（二部图）+ Canvas 2D（跟踪场景），无第三方图形库 |
| 部署 | Vercel |

## 项目结构

```
src/
├── algorithms/          # 算法实现（手写，含单元测试）
│   ├── km.ts            # Kuhn–Munkres O(n³)
│   ├── kmSteps.ts       # 带分步追踪的 KM 变体
│   ├── greedy.ts        # 贪心基线
│   └── types.ts
├── simulation/          # 跟踪场景模拟引擎
│   ├── engine.ts        # 真值演化 + 合成检测 + 数据关联
│   ├── geometry.ts      # IoU / 距离
│   ├── scenarios.ts     # 四个内置场景
│   ├── random.ts        # 可重现的 RNG
│   ├── colors.ts
│   └── types.ts
├── components/          # UI 组件
│   ├── BipartiteGraph.tsx
│   ├── KMReplayGraph.tsx
│   ├── KMReplay.tsx     # 分步回放模态框
│   ├── TrackingCanvas.tsx
│   ├── MatrixEditor.tsx
│   └── ui/              # Card / Button / Slider / ...
├── pages/
│   ├── MatchingPlayground.tsx
│   └── TrackingScene.tsx
├── lib/
│   └── urlState.ts      # URL hash 状态序列化
├── App.tsx
└── main.tsx
```

## 本地开发

环境要求：Node.js ≥ 20，pnpm ≥ 9。

```bash
pnpm install
pnpm dev           # 启动开发服务器（http://localhost:5173）
pnpm test          # 跑全部单元测试
pnpm exec tsc -b   # 类型检查
pnpm lint          # oxlint
pnpm build         # 生产构建到 dist/
pnpm preview       # 本地预览构建结果
```

CI 工作流位于 `.github/workflows/ci.yml`，在 push 与 PR 上自动执行以上检查。

## 课程信息

- 课程：**图论及其应用**
- 涉及章节：第 4 章「匹配与覆盖」之 4.3 偶图的匹配和覆盖
- 选用算法：Kuhn–Munkres（带权偶图最大权完美匹配）
- 选用问题：多目标跟踪中的数据关联
