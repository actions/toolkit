var httpclient = require('@actions/http-client')
var configvar = require('./../src/internal/config-variables')
var main = require('./../src/main')

describe('oidc-client-tests', () => {
  it('Get Http Client', async () => {
    const http = new httpclient.HttpClient('actions/oidc-client')
    expect(http).toBeDefined()
  })

  it('HTTP get request to get token endpoint', async () => {
    const http = new httpclient.HttpClient('actions/oidc-client')
    const res = await http.get(
      'https://ghactionsoidc.azurewebsites.net/.well-known/openid-configuration'
    )
    expect(res.message.statusCode).toBe(200)
  })

  it('Get token endpoint', async () => {
    let url = await configvar.getIDTokenUrl()
    expect(url).toBeDefined()
  })

  it('Fetch Id token', async () => {
    var id_token = main.getIDToken('helloworld')
    expect(id_token).toBeDefined()
  })
})

/*test('HTTP get request to get token endpoint', async () => {
  expect(1).toBe(1)
})*/
