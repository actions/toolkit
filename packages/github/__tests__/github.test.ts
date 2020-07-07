import * as http from 'http'
import proxy from 'proxy'
import {getOctokit} from '../src/github'
import {GitHub, getOctokitOptions} from '../src/utils'

describe('@actions/github', () => {
  const proxyUrl = 'http://127.0.0.1:8080'
  const originalProxyUrl = process.env['https_proxy']
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
    delete process.env['https_proxy']
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

  it('basic REST client', async () => {
    const token = getToken()
    if (!token) {
      return
    }
    const octokit = new GitHub(getOctokitOptions(token))
    const branch = await octokit.repos.getBranch({
      owner: 'actions',
      repo: 'toolkit',
      branch: 'master'
    })
    expect(branch.data.name).toBe('master')
    expect(proxyConnects).toHaveLength(0)
  })

  it('basic getOctokit client', async () => {
    const token = getToken()
    if (!token) {
      return
    }
    const octokit = getOctokit(token)
    const branch = await octokit.repos.getBranch({
      owner: 'actions',
      repo: 'toolkit',
      branch: 'master'
    })
    expect(branch.data.name).toBe('master')
    expect(proxyConnects).toHaveLength(0)
  })

  it('basic REST client with custom auth', async () => {
    const token = getToken()
    if (!token) {
      return
    }

    // Valid token
    let octokit = new GitHub({auth: `token ${token}`})
    const branch = await octokit.repos.getBranch({
      owner: 'actions',
      repo: 'toolkit',
      branch: 'master'
    })
    expect(branch.data.name).toBe('master')
    expect(proxyConnects).toHaveLength(0)

    // Invalid token
    octokit = new GitHub({auth: `token asdf`})
    let failed = false
    try {
      await octokit.repos.getBranch({
        owner: 'actions',
        repo: 'toolkit',
        branch: 'master'
      })
    } catch (err) {
      failed = true
    }
    expect(failed).toBeTruthy()
  })

  it('basic GraphQL client', async () => {
    const token = getToken()
    if (!token) {
      return
    }

    const octokit = getOctokit(token)
    const repository = await octokit.graphql(
      '{repository(owner:"actions", name:"toolkit"){name}}'
    )
    expect(repository).toEqual({repository: {name: 'toolkit'}})
    expect(proxyConnects).toHaveLength(0)
  })

  it('basic GraphQL client with custom auth', async () => {
    const token = getToken()
    if (!token) {
      return
    }

    // Valid token
    let octokit = getOctokit(token)
    const repository = await octokit.graphql(
      '{repository(owner:"actions", name:"toolkit"){name}}'
    )
    expect(repository).toEqual({repository: {name: 'toolkit'}})
    expect(proxyConnects).toHaveLength(0)

    // Invalid token
    octokit = new GitHub({auth: `token asdf`})
    let failed = false
    try {
      await octokit.graphql(
        '{repository(owner:"actions", name:"toolkit"){name}}'
      )
    } catch (err) {
      failed = true
    }
    expect(failed).toBeTruthy()
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
