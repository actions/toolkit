import * as path from 'path'
import {readFileSync} from 'fs'
import {Context} from '../src/context.js'

describe('@actions/context', () => {
  let context: Context

  beforeEach(() => {
    process.env.GITHUB_EVENT_PATH = path.join(__dirname, 'payload.json')
    process.env.GITHUB_REPOSITORY = 'actions/toolkit'
    context = new Context()
  })

  it('returns the payload object', () => {
    const payload = JSON.parse(
      readFileSync(path.join(__dirname, 'payload.json'), 'utf8')
    )
    expect(context.payload).toEqual(payload)
  })

  it('returns an empty payload if the GITHUB_EVENT_PATH environment variable is falsey', () => {
    delete process.env.GITHUB_EVENT_PATH

    context = new Context()
    expect(context.payload).toEqual({})
  })

  it('returns attributes from the GITHUB_REPOSITORY', () => {
    expect(context.repo).toEqual({owner: 'actions', repo: 'toolkit'})
  })

  it('returns attributes from the repository payload', () => {
    delete process.env.GITHUB_REPOSITORY

    context.payload.repository = {
      name: 'test',
      owner: {login: 'user'}
    }
    expect(context.repo).toEqual({owner: 'user', repo: 'test'})
  })

  it("return error for context.repo when repository doesn't exist", () => {
    delete process.env.GITHUB_REPOSITORY

    context.payload.repository = undefined
    expect(() => context.repo).toThrowErrorMatchingSnapshot()
  })

  it('returns issue attributes from the repository', () => {
    expect(context.issue).toEqual({
      owner: 'actions',
      repo: 'toolkit',
      number: 1
    })
  })

  it('works with pull_request payloads', () => {
    delete process.env.GITHUB_REPOSITORY
    context.payload = {
      pull_request: {number: 2},
      repository: {owner: {login: 'user'}, name: 'test'}
    }
    expect(context.issue).toEqual({
      number: 2,
      owner: 'user',
      repo: 'test'
    })
  })

  it('works with payload.number payloads', () => {
    delete process.env.GITHUB_REPOSITORY
    context.payload = {
      number: 2,
      repository: {owner: {login: 'user'}, name: 'test'}
    }
    expect(context.issue).toEqual({
      number: 2,
      owner: 'user',
      repo: 'test'
    })
  })

  describe('refs', () => {
    it.each([
      'refs/heads/main',
      'refs/heads/feature-branch',
      'refs/pull/42/merge',
      'refs/tags/v2.0.4'
    ])(`should set context.ref: %s`, ref => {
      process.env.GITHUB_REF = ref

      expect(new Context()).toHaveProperty(`ref`, ref)
    })

    it.each([`meh-${Date.now()}`, 'catpants', 'v1.2.3'])(
      'should set context.refName: %s',
      refName => {
        process.env.GITHUB_REF_NAME = refName

        expect(new Context()).toHaveProperty('refName', refName)
      }
    )

    it.each(['branch', 'tag'])('should set context.refType: %s', refType => {
      process.env.GITHUB_REF_TYPE = refType

      expect(new Context()).toHaveProperty('refType', refType)
    })
  })
})
