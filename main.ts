const core = require('@actions/core');
async function getIDTokenAction(): Promise<void> {
  
   const audience = core.getInput('audience', {required: false})
   
   const id_token1 = await core.getIDToken()            // ID Token with default audience
   const id_token2 = await core.getIDToken(audience)    // ID token with custom audience
   
   // this id_token can be used to get access token from third party cloud providers
}
getIDTokenAction()
