export type CostMatrix = number[][]

export type AlgorithmName = 'km' | 'greedy'

export interface MatchingOptions {
  maximize?: boolean
}

export interface MatchingResult {
  algorithm: AlgorithmName
  assignment: number[]
  totalWeight: number
  matchCount: number
}
