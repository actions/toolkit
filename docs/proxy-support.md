# Proxy Server Support

Self-hosted runners [can be configured](https://help.github.com/en/actions/hosting-your-own-runners/using-a-proxy-server-with-self-hosted-runners) to run behind a proxy server in enterprises.

For actions to **just work** behind a proxy server:

  1. Use [tool-cache] version >= 1.3.1
  2. Optionally use [actions/http-client](https://github.com/actions/http-client)

If you are using other http clients, refer to the [environment variables set by the runner](https://help.github.com/en/actions/hosting-your-own-runners/using-a-proxy-server-with-self-hosted-runners).