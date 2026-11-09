import { describe, expect, it } from 'vitest'
import { composeDraft, splitClauses } from '../src/client/compose.ts'

const labels = {
  research: '调研', draft: '成稿', review: '审校', publish: '发布', analyze: '分析',
  step: (index: number) => `第 ${index} 步`,
}

describe('sentence composition', () => {
  it('splits on commas, arrows, and sequencing words', () => {
    expect(splitClauses('先调研竞品，然后写脚本 -> 最后审校')).toEqual(['先调研竞品', '写脚本', '最后审校'])
    expect(splitClauses('   ')).toEqual([])
  })

  it('chains classified steps into an acyclic crew', () => {
    const graph = composeDraft('调研竞品，写投放脚本，审校脚本', labels)
    expect(graph.nodes.map(node => node.label)).toEqual(['调研', '成稿', '审校'])
    expect(graph.nodes.map(node => node.id)).toEqual(['step-1', 'step-2', 'step-3'])
    expect(graph.nodes[2]?.kind).toBe('reviewer')
    expect(graph.edges.map(edge => `${edge.from}>${edge.to}:${edge.kind}`)).toEqual([
      'step-1>step-2:handoff',
      'step-2>step-3:review',
    ])
  })

  it('keeps a single clause as one member', () => {
    const graph = composeDraft('写一份发布计划', labels)
    expect(graph.nodes).toHaveLength(1)
    expect(graph.nodes[0]).toMatchObject({ label: '成稿', instruction: '写一份发布计划' })
    expect(graph.edges).toEqual([])
  })
})
