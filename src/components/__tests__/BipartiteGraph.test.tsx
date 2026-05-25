import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BipartiteGraph } from '../BipartiteGraph'

describe('BipartiteGraph', () => {
  it('renders one circle per row and per column', () => {
    const { container } = render(
      <BipartiteGraph costs={[[1, 2, 3], [4, 5, 6]]} />,
    )
    expect(container.querySelectorAll('circle')).toHaveLength(5)
  })

  it('renders all candidate edges when no assignment is given', () => {
    const { container } = render(
      <BipartiteGraph costs={[[1, 2], [3, 4]]} />,
    )
    expect(container.querySelectorAll('line')).toHaveLength(4)
  })

  it('highlights matched edges separately from candidate edges', () => {
    const { container } = render(
      <BipartiteGraph
        costs={[[1, 2], [3, 4]]}
        assignment={[1, 0]}
      />,
    )
    const matched = container.querySelectorAll('line[stroke="#7c3aed"]')
    expect(matched).toHaveLength(2)
  })

  it('renders a placeholder for empty matrices', () => {
    const { getByText } = render(<BipartiteGraph costs={[]} />)
    expect(getByText(/矩阵为空/)).toBeInTheDocument()
  })

  it('uses provided node labels and titles', () => {
    const { getByText } = render(
      <BipartiteGraph
        costs={[[1, 2]]}
        leftLabels={['T0']}
        rightLabels={['D0', 'D1']}
        leftTitle="轨迹"
        rightTitle="检测"
      />,
    )
    expect(getByText('T0')).toBeInTheDocument()
    expect(getByText('D0')).toBeInTheDocument()
    expect(getByText('D1')).toBeInTheDocument()
    expect(getByText('轨迹')).toBeInTheDocument()
    expect(getByText('检测')).toBeInTheDocument()
  })
})
