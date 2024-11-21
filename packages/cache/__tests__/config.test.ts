import { promises as fs } from 'fs'
import * as config from '../src/internal/config'

beforeEach(() => {
    jest.resetModules()
})

test('isGhes returns false for github.com', async () => {
    process.env.GITHUB_SERVER_URL = 'https://github.com'
    expect(config.isGhes()).toBe(false)
})

test('isGhes returns false for ghe.com', async () => {
    process.env.GITHUB_SERVER_URL = 'https://somedomain.ghe.com'
    expect(config.isGhes()).toBe(false)
})

test('isGhes returns true for enterprise URL', async () => {
    process.env.GITHUB_SERVER_URL = 'https://my-enterprise.github.com'
    expect(config.isGhes()).toBe(true)
})

test('isGhes returns false for ghe.localhost', () => {
    process.env.GITHUB_SERVER_URL = 'https://my.domain.ghe.localhost'
    expect(config.isGhes()).toBe(false)
})
