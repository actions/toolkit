declare module 'proxy1' {
  import * as http from 'http'
  function internal(): http.Server
  export = internal
}
