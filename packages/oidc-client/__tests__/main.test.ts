import * as get from '../src/main'
import {HttpClient} from '@actions/http-client'

test('Get httpclient', () => {
  let http: HttpClient = new HttpClient('actions/oidc-client')
  expect(http).toBeDefined()
})

test('HTTP get request to get token endpoint', async () => {
  let http: HttpClient = new HttpClient('actions/oidc-client')
  let res = await http.get(
    'https://ghactionsoidc.azurewebsites.net/.well-known/openid-configuration'
  )
  expect(res.message.statusCode).toBe(200)
})

test('Get token endpoint', async () => {
  let url: string = await get.getTokenEndPoint()
  expect(url).toBeDefined()
})
