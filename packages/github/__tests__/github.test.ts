import * as http from 'http'
import * as proxy from 'proxy'
import {GitHub} from '../src/github'

describe('@actions/github', () => {
  let proxyConnects: string[]
  let proxyServer: http.Server
  let proxyUrl = 'http://127.0.0.1:8080'
  let originalProxyUrl = process.env['https_proxy']
  
  beforeAll(async () => {
    // Start proxy server
    proxyServer = proxy()
    await new Promise((resolve) => {
        const port = Number(proxyUrl.split(':')[2])
        proxyServer.listen(port, () => resolve())
    })
    proxyServer.on('connect', (req) => {
        proxyConnects.push(req.url)
    });

    delete process.env['https_proxy']
})

  beforeEach(() => {
    proxyConnects = []
  })

  afterAll(async() => {
    // Stop proxy server
    await new Promise((resolve) => {
        proxyServer.once('close', () => resolve())
        proxyServer.close()
    })

    if (originalProxyUrl) {
      process.env['https_proxy'] = originalProxyUrl
    }
  })

  it('basic REST client', async () => {
    if (!process.env['GITHUB_TOKEN']) {
      process.stdout.write('Skipped. Requires $GITHUB_TOKEN\n')
      return
    }

    const github = new GitHub(process.env['GITHUB_TOKEN'])
    const branch = await github.repos.getBranch({owner: 'actions', repo: 'toolkit', branch: 'master'})
    expect(branch.data.name).toBe('m')
  })
})
