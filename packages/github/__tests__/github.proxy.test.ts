import * as http from 'http'
import * as https from 'https'
import proxy from 'proxy'

// Default values are set when the module is imported, so we need to set proxy first.
const proxyUrl = 'http://127.0.0.1:8081'
const originalProxyUrl = process.env['https_proxy']
process.env['https_proxy'] = proxyUrl
// eslint-disable-next-line import/first
import {getOctokit} from '../src/github'

describe('@actions/github', () => {
  let proxyConnects: string[]
  let proxyServer: http.Server
  let first = true

  beforeAll(async () => {
    // Start proxy server
    proxyServer = proxy()
    await new Promise(resolve => {
      const port = Number(proxyUrl.split(':')[2])
      proxyServer.listen(port, () => resolve())
    })
    proxyServer.on('connect', req => {
      proxyConnects.push(req.url)
    })
  })

  beforeEach(() => {
    proxyConnects = []
  })

  afterAll(async () => {
    // Stop proxy server
    await new Promise(resolve => {
      proxyServer.once('close', () => resolve())
      proxyServer.close()
    })

    if (originalProxyUrl) {
      process.env['https_proxy'] = originalProxyUrl
    }
  })

  it('basic REST client with proxy', async () => {
    const token = getToken()
    if (!token) {
      return
    }

    const octokit = getOctokit(token)
    const branch = await octokit.rest.repos.getBranch({
      owner: 'actions',
      repo: 'toolkit',
      branch: 'main'
    })
    expect(branch.data.name).toBe('main')
    expect(proxyConnects).toEqual(['api.github.com:443'])
  })

  it('basic GraphQL client with proxy', async () => {
    const token = getToken()
    if (!token) {
      return
    }
    process.env['https_proxy'] = proxyUrl
    const octokit = getOctokit(token)

    const repository = await octokit.graphql(
      '{repository(owner:"actions", name:"toolkit"){name}}'
    )
    expect(repository).toEqual({repository: {name: 'toolkit'}})
    expect(proxyConnects).toEqual(['api.github.com:443'])
  })

  it('should only use default agent if one is not provided', async () => {
    const token = getToken()
    if (!token) {
      return
    }

    // Valid token
    const octokit = getOctokit(token, {
      request: {
        agent: new https.Agent()
      }
    })
    const branch = await octokit.rest.repos.getBranch({
      owner: 'actions',
      repo: 'toolkit',
      branch: 'main'
    })
    expect(branch.data.name).toBe('main')
    expect(proxyConnects).toHaveLength(0)
  })

  function getToken(): string {
    const token = process.env['GITHUB_TOKEN'] || ''
    if (!token && first) {
      /* eslint-disable-next-line no-console */
      console.warn(
        'Skipping GitHub tests. Set $GITHUB_TOKEN to run REST client and GraphQL client tests'
      )
      first = false
    }

    return token
  }
})
