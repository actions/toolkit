<h2>@actions/oidc-client</h2>

<h3>Usage</h3>

You can use this package to interact with the github oidc provider.

<h3>Get the ID token</h3>

Method Name: getIDToken

<h3>Inputs</h3>

audience : optional

You can use this [template](https://github.com/actions/typescript-action) to use the package.
<h3>Example:</h3>

main.ts
```
const core = require('@actions/core');
const id = require('@actions/oidc-client')


async function getID(): Promise<void> {
   
   let aud = ''
   const audience = core.getInput('audience', {required: false})
   if (audience !== undefined) 
      aud = `${audience}`
   const id_token = await id.getIDToken(aud)
   const val = `ID token is ${id_token}`
   core.setOutput('id_token', id_token);
      
}

getID()
```

actions.yml
```
name: 'GetIDToken'
description: 'Get ID token from Github OIDC provider'
inputs:
  audience:  
    description: 'Audience for which the ID token is intended for'
    required: false
outputs:
  id_token: 
    description: 'ID token obtained from OIDC provider'
runs:
  using: 'node12'
  main: 'dist/index.js'
```
