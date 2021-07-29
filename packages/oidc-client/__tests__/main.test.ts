var httpclient = require('@actions/http-client')

function getTokenEndPoint() {
  return 'https://vstoken.actions.githubusercontent.com/.well-known/openid-configuration'
}

describe('oidc-client-tests', () => {
  it('Get Http Client', async () => {
    const http = new httpclient.HttpClient('actions/oidc-client')
    expect(http).toBeDefined()
  })

  it('HTTP get request to get token endpoint', async () => {
    const http = new httpclient.HttpClient('actions/oidc-client')
    const res = await http.get(getTokenEndPoint())
    expect(res.message.statusCode).toBe(200)
  })
})
