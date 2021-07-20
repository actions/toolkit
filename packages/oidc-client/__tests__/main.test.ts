var httpclient = require("@actions/http-client")
var configvar = require("./../src/internal/config-variables")

describe('oidc-client-tests', () => {
  it('Get Http Client', async () => {
    //const http = new httpclient('actions/oidc-client')
    expect(httpclient).toBeDefined()
  })

  it('Get token endpoint', async () => {
    let url = await configvar.getIDTokenUrl()
    expect(url).toBeDefined()
  })

})

/*test('HTTP get request to get token endpoint', async () => {
  expect(1).toBe(1)
})*/
