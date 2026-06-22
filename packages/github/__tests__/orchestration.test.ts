import {getOctokitOptions, getUserAgentWithOrchestrationId} from '../src/utils'
import {getUserAgentWithOrchestrationId as internalGetUserAgentWithOrchestrationId} from '../src/internal/utils'

describe('orchestration ID support', () => {
  let originalOrchId: string | undefined

  beforeEach(() => {
    originalOrchId = process.env['ACTIONS_ORCHESTRATION_ID']
    delete process.env['ACTIONS_ORCHESTRATION_ID']
  })

  afterEach(() => {
    if (originalOrchId !== undefined) {
      process.env['ACTIONS_ORCHESTRATION_ID'] = originalOrchId
    } else {
      delete process.env['ACTIONS_ORCHESTRATION_ID']
    }
  })

  describe('getUserAgentWithOrchestrationId', () => {
    it('returns undefined when env var is not set and no base user agent', () => {
      expect(getUserAgentWithOrchestrationId()).toBeUndefined()
    })

    it('returns base user agent unchanged when env var is not set', () => {
      expect(getUserAgentWithOrchestrationId('my-app')).toBe('my-app')
    })

    it('returns orchestration ID without base when env var is set and no base', () => {
      process.env['ACTIONS_ORCHESTRATION_ID'] = 'abc-123'
      expect(getUserAgentWithOrchestrationId()).toBe(
        'actions_orchestration_id/abc-123'
      )
    })

    it('appends orchestration ID to base user agent', () => {
      process.env['ACTIONS_ORCHESTRATION_ID'] = 'abc-123'
      expect(getUserAgentWithOrchestrationId('my-app')).toBe(
        'my-app actions_orchestration_id/abc-123'
      )
    })

    it('sanitizes special characters in orchestration ID', () => {
      process.env['ACTIONS_ORCHESTRATION_ID'] = 'id with spaces/and$pecial!'
      expect(getUserAgentWithOrchestrationId('my-app')).toBe(
        'my-app actions_orchestration_id/id_with_spaces_and_pecial_'
      )
    })

    it('preserves allowed characters in orchestration ID', () => {
      process.env['ACTIONS_ORCHESTRATION_ID'] =
        'valid_id-with.allowed_chars.123'
      expect(getUserAgentWithOrchestrationId()).toBe(
        'actions_orchestration_id/valid_id-with.allowed_chars.123'
      )
    })

    it('ignores whitespace-only orchestration ID', () => {
      process.env['ACTIONS_ORCHESTRATION_ID'] = '   '
      expect(getUserAgentWithOrchestrationId('my-app')).toBe('my-app')
    })

    it('does not duplicate orchestration ID if already present in base', () => {
      process.env['ACTIONS_ORCHESTRATION_ID'] = 'abc-123'
      const alreadyTagged = 'my-app actions_orchestration_id/abc-123'
      expect(getUserAgentWithOrchestrationId(alreadyTagged)).toBe(alreadyTagged)
    })
  })

  describe('public re-export', () => {
    it('exports getUserAgentWithOrchestrationId from utils (public API)', () => {
      expect(getUserAgentWithOrchestrationId).toBe(
        internalGetUserAgentWithOrchestrationId
      )
    })
  })

  describe('getOctokitOptions', () => {
    it('sets userAgent when ACTIONS_ORCHESTRATION_ID is set', () => {
      process.env['ACTIONS_ORCHESTRATION_ID'] = 'test-orch-id'
      const opts = getOctokitOptions('fake-token')
      expect(opts.userAgent).toBe('actions_orchestration_id/test-orch-id')
    })

    it('does not set userAgent when ACTIONS_ORCHESTRATION_ID is not set', () => {
      const opts = getOctokitOptions('fake-token')
      expect(opts.userAgent).toBeUndefined()
    })

    it('preserves and appends to caller-provided userAgent', () => {
      process.env['ACTIONS_ORCHESTRATION_ID'] = 'test-orch-id'
      const opts = getOctokitOptions('fake-token', {
        userAgent: 'custom-agent/1.0'
      })
      expect(opts.userAgent).toBe(
        'custom-agent/1.0 actions_orchestration_id/test-orch-id'
      )
    })

    it('leaves caller-provided userAgent intact when env var is not set', () => {
      const opts = getOctokitOptions('fake-token', {
        userAgent: 'custom-agent/1.0'
      })
      expect(opts.userAgent).toBe('custom-agent/1.0')
    })

    it('does not mutate the original options object', () => {
      process.env['ACTIONS_ORCHESTRATION_ID'] = 'test-orch-id'
      const original = {userAgent: 'original/1.0'}
      getOctokitOptions('fake-token', original)
      expect(original.userAgent).toBe('original/1.0')
    })

    it('sanitizes special characters through getOctokitOptions', () => {
      process.env['ACTIONS_ORCHESTRATION_ID'] = 'bad chars here!'
      const opts = getOctokitOptions('fake-token')
      expect(opts.userAgent).toBe('actions_orchestration_id/bad_chars_here_')
    })

    it('does not duplicate orchestration ID when caller already applied it', () => {
      process.env['ACTIONS_ORCHESTRATION_ID'] = 'test-orch-id'
      const opts = getOctokitOptions('fake-token', {
        userAgent: 'my-app actions_orchestration_id/test-orch-id'
      })
      expect(opts.userAgent).toBe(
        'my-app actions_orchestration_id/test-orch-id'
      )
    })
  })
})
