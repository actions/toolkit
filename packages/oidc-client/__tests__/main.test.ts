import {getIDTokenUrl} from './../src/internal/config-variables'
import {HttpClient} from '@actions/http-client'

test('Get httpclient', () => {
  const http = new HttpClient('actions/oidc-client')
  expect(http).toBeDefined()
})

test('HTTP get request to get token endpoint', async () => {
  const http = new HttpClient('actions/oidc-client')
  const res = await http.get(
    'https://ghactionsoidc.azurewebsites.net/.well-known/openid-configuration'
  )
  expect(res.message.statusCode).toBe(200)
})

test('Get token endpoint', async () => {
  let url; url = getIDTokenUrl()
  expect(url).toBeDefined()
})
