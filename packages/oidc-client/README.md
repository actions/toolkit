<h2>@actions/oidc-client</h2>

<h3>Usage</h3>

You can use this package to interact with the github oidc provider.

<h3>Get the ID token</h3>

Method Name: getIDToken

<h3>Inputs</h3>

Client id
The client id registered with oidc provider
Required
Client secret
The client secret
Required

These inputs are temporary. They will be modified once the complete package is available.


<h3>Example:</h3>

```
const core = require('@actions/core');
const id = require('@actions/oidc-client')


async function getID(){
   const id_token = await id.getIDToken('client-id', 'client-secret')
   const val = `ID token is ${id_token}`
   core.setOutput('id_token', id_token);
      
}

getID()
```
