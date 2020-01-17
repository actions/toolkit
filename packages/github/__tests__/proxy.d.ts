declare module 'proxy' {
  import * as http from 'http'
  function internal(): http.Server
  export = internal
}
