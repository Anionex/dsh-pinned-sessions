import { describe, expect, it } from 'vitest'
import { sessionDisplayTitle } from '../src/client/presentation.js'

describe('sessionDisplayTitle', () => {
  it('prefers a trimmed explicit Session title', () => {
    expect(sessionDisplayTitle({ id: 's1', title: '  Named Session  ', cwd: '/tmp/project' }, 'Workspace')).toBe('Named Session')
  })

  it('uses the Workspace title for legacy untitled sessions', () => {
    expect(sessionDisplayTitle({ id: 's2', cwd: '/tmp/project' }, 'empty')).toBe('empty')
  })

  it('falls back to the final POSIX or Windows path segment', () => {
    expect(sessionDisplayTitle({ id: 's3', cwd: '/tmp/project/' }, undefined)).toBe('project')
    expect(sessionDisplayTitle({ id: 's4', cwd: 'C:\\work\\demo\\' }, undefined)).toBe('demo')
  })

  it('always has a stable Session ID fallback', () => {
    expect(sessionDisplayTitle({ id: 'session-id', title: ' ', cwd: '/' }, ' ')).toBe('session-id')
  })
})
