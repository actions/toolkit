import { ArtifactHttpClient } from '../../artifact-http-client'
import { ArtifactServiceClientJSON } from '../../../generated/results/api/v1/artifact.twirp'

export async function twirpTest(){
    const artifactClient = new ArtifactHttpClient('@actions/artifact-upload')
    const jsonClient = new ArtifactServiceClientJSON(artifactClient)

    try {
        const createResp = await jsonClient.CreateArtifact({workflowRunBackendId: "ce7f54c7-61c7-4aae-887f-30da475f5f1a", workflowJobRunBackendId: "ca395085-040a-526b-2ce8-bdc85f692774", name: Math.random().toString(), version: 4})

        if (!createResp.ok) {
            console.log("CreateArtifact failed")
            return
        }

        console.log(createResp.signedUploadUrl)

        const finalizeResp = await jsonClient.FinalizeArtifact({workflowRunBackendId: "ce7f54c7-61c7-4aae-887f-30da475f5f1a", workflowJobRunBackendId: "ca395085-040a-526b-2ce8-bdc85f692774", name: Math.random().toString(), size: BigInt(5)})

        if (!finalizeResp.ok) {
            console.log("FinalizeArtifact failed")
            return
        }
    } catch (e) {
        console.log(e)
        return
    }

    console.log("FinalizeArtifact succeeded")
}

twirpTest()
