import * as path from 'path'
import {Context} from '../src/context'

/* eslint-disable @typescript-eslint/no-require-imports */

describe('@actions/context', () => {
  let context: Context

  beforeEach(() => {
    process.env.GITHUB_EVENT_PATH = path.join(__dirname, 'payload.json')
    process.env.GITHUB_REPOSITORY = 'actions/toolkit'
    context = new Context()
  })

  it('returns the payload object', () => {
    expect(context.payload).toEqual(require('./payload.json'))
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

  it('works with pullRequest payloads', () => {
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
})
