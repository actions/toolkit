import * as path from 'path'
import {Context} from '../src/context'
import {GitHub} from '../src/github'

describe('@actions/context', () => {
  let context: Context

  beforeEach(() => {
    process.env.GITHUB_EVENT_PATH = path.join(__dirname, 'payload.json')
    process.env.GITHUB_REPOSITORY = 'actions/toolkit'
    context = new Context()
  })

  it('returns the payload object', () => {
    expect(context.payload.repository).toBeDefined()
    if (context.payload.repository) {
      expect(context.payload.repository.owner).toBeDefined()
      if (context.payload.repository.owner) {
        expect(context.payload.repository.owner.login).toBe('user')
      }
    }
  })
  
  it('Initializes GitHub', () => {
    const github = new GitHub("")
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
    expect(() => context.repo).toThrow()
  })

  it('returns issue attributes from the repository', () => {
    expect(context.issue).toEqual({
      owner: 'actions',
      repo: 'toolkit',
      number: 1
    })
  })

  it('works with pullRequest payloads', () => {
    delete process.env.GITHUB_REPOSITORY
    context.payload = {
      pullRequest: {number: 2},
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
})
