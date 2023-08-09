import * as config from '../src/internal/shared/config'
import * as util from '../src/internal/shared/util'

describe('get-backend-ids-from-token', () => {
  it('should return backend ids when the token is valid', () => {
    jest
      .spyOn(config, 'getRuntimeToken')
      .mockReturnValue(
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjRTenlCTkRYcHNTT3owbERZMHYzS1JWVFJndyJ9.eyJuYW1laWQiOiJkZGRkZGRkZC1kZGRkLWRkZGQtZGRkZC1kZGRkZGRkZGRkZGQiLCJzY3AiOiJBY3Rpb25zLk1hbmFnZU9yZ3M6IEFjdGlvbnMuUmVzdWx0czpjZTdmNTRjNy02MWM3LTRhYWUtODg3Zi0zMGRhNDc1ZjVmMWE6Y2EzOTUwODUtMDQwYS01MjZiLTJjZTgtYmRjODVmNjkyNzc0IiwiSWRlbnRpdHlUeXBlQ2xhaW0iOiJTeXN0ZW06U2VydmljZUlkZW50aXR5IiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvc2lkIjoiREREREREREQtRERERC1ERERELUREREQtREREREREREREREREIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9wcmltYXJ5c2lkIjoiZGRkZGRkZGQtZGRkZC1kZGRkLWRkZGQtZGRkZGRkZGRkZGRkIiwiYXVpIjoiZDJiZDAxNzItMzYyOC00ODFhLTg2MGUtMjM4NTA3YjQwYmY1Iiwic2lkIjoiOWM0ZmVmZTUtMWYyNC00NzZmLWJiNjctZjg3YTk3ZDVkNGVmIiwiaXNzIjoidnN0b2tlbi5jb2RlZGV2LmxvY2FsaG9zdCIsImF1ZCI6InZzdG9rZW4uY29kZWRldi5sb2NhbGhvc3QiLCJuYmYiOjE2OTE1OTU2ODQsImV4cCI6MTY5MTY4MjY4NH0.Px_VE9iSaQ2dNMxr_sKItRkjo2_OIaCe6LLGaFBRVeac3e3GYGx8FchqNbdP6YKugOq0FO2jQapg4Pqhorw-gPCZbyNyLAlFldZKicTNR4s-nNmESX3CsI9_gEfEaBRXWDVc8bmg121joHS0BxaSBKVhG78Q5rFTyzMUUu6x09Kotf1TW8r2v0BUBnuOzWASV9fl4rAxv3H2KZujT5e0-cWMG7pUkmaHlpoCVHuI4f4tyHZGlCjRp8wYhUh5sIbUyrxYcIHNH5uk1b55Rv8qy498jLvlL1oOArgB361JUmXknZBHitvnU6VoS_k_LRA21AIJ_csw7XoYB1DTexIKTCQCzCBclcfYWCeYkDzQ2B7TBdQMoc_QZyB2S1ulSt2_9YcpE-RLaYitM-JA6MFvGKHcXJdsBtrlW_7vmQDlTuHjGuhpV5gpPZS8d_u72wR2A3n9AcBZsmT0dSg5GQiYQRZkwXsfBCFg4v6sh_CticT6zpFEH__jZ5GcYpeDheTgcCOKJGsBmkH8FWKGBc_NvApvNxXYGYMycWoLZp6G9fXw-EQJ-XVZzG9zmsETkCUhZZBaGvdY0NQBbVpwB87o493ooKeX1Q3pBulWt_obcsKnl1M1yvoy2m1L34sHrkdn6xaiXjaKAOQKz_RAoikYMzbH1i2d2rgjWdmmOvIMmns'
      )

    const backendIds = util.getBackendIdsFromToken()
    expect(backendIds.workflowRunBackendId).toBe(
      'ce7f54c7-61c7-4aae-887f-30da475f5f1a'
    )
    expect(backendIds.workflowJobRunBackendId).toBe(
      'ca395085-040a-526b-2ce8-bdc85f692774'
    )
  })

  it("should throw an error when the token doesn't have the right scope", () => {
    jest
      .spyOn(config, 'getRuntimeToken')
      .mockReturnValue(
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjRTenlCTkRYcHNTT3owbERZMHYzS1JWVFJndyJ9.eyJuYW1laWQiOiJkZGRkZGRkZC1kZGRkLWRkZGQtZGRkZC1kZGRkZGRkZGRkZGQiLCJzY3AiOiJBY3Rpb25zLk1hbmFnZU9yZ3M6IiwiSWRlbnRpdHlUeXBlQ2xhaW0iOiJTeXN0ZW06U2VydmljZUlkZW50aXR5IiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvc2lkIjoiREREREREREQtRERERC1ERERELUREREQtREREREREREREREREIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9wcmltYXJ5c2lkIjoiZGRkZGRkZGQtZGRkZC1kZGRkLWRkZGQtZGRkZGRkZGRkZGRkIiwiYXVpIjoiZDk1OTgzODAtNjg1OC00YjRmLWFhMTQtZmFiMDI1YmEyNTIxIiwic2lkIjoiZjM0YWU4OWMtZWI2NC00Y2Y3LTlkMDQtOGVjN2Q3Njk2YjQ5IiwiaXNzIjoidnN0b2tlbi5jb2RlZGV2LmxvY2FsaG9zdCIsImF1ZCI6InZzdG9rZW4uY29kZWRldi5sb2NhbGhvc3QiLCJuYmYiOjE2OTE2MDgyMTAsImV4cCI6MTY5MTY5NTIxMH0.HGmu6b3uWBB74SNCiiClTuEm_fRA8TWcmlDopHV6aMda0Naq0IgHT0_cPPkxYImRRCheCzrw5Z6LmFhuB3KDfBt-9DBYE9aSc9faomFGyiJN2uQlUYL5vlZhxoo80YMEZqgGQCeHebHF4xIdfYkipala1ttIbAHt_I3D0kebOrIQboQI_1M2ZMgoECY5YIA3-7xJVmlHMeQ4lu_ys2kjPxrpysl1t5emUlTitw6AKLBEvAMLhauGn6Etu6h1QGar2SV1bFKtJ-OImQgXrMVdVxcWL5eC-ebqk-DU9R5MLMGywlx_V_aeRBSyhwZRwPxHKixd-_TT-0U4v0siWqzIg944H9-Z-9XiduTVmODIbkF44jKbua_ohSk1kN_CO5uiHTiAkQnnE94Y586eT9QPHUxCKzlUH0KTntc94lD4zPTO-ZTmH3BJY_bbCrEPNnSMuEoBibf3IIgPo9ap67y3NcJrck6-Y8G-MbsVkBivT6Ac41fvxeKD8GCl9P8Zo7KoMoVzUVK0clHPwqWAES5AnzF9gccT4k5-IH25nGdKVz3UJvZVkjjtlRYdQ6ZTWvjU1T6Sd2242yQ-2AzqLZsStWcZC7VRekCMZqDepLkvOrmRti0_vF1DF3D2flrmukMUyjZ2WvfzI4voDAnHituXQ_LlwIEkIqagwBJ-sfydxzw'
      )

    expect(util.getBackendIdsFromToken).toThrowError(
      'Failed to get backend IDs: The provided JWT token is invalid'
    )
  })

  it('should throw an error when the token is in an invalid format', () => {
    jest.spyOn(config, 'getRuntimeToken').mockReturnValue('token')

    expect(util.getBackendIdsFromToken).toThrowError('Invalid token specified')
  })

  it("should throw an error when the token doesn't have the right field", () => {
    jest
      .spyOn(config, 'getRuntimeToken')
      .mockReturnValue(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      )

    expect(util.getBackendIdsFromToken).toThrowError(
      'Failed to get backend IDs: The provided JWT token is invalid'
    )
  })
})
