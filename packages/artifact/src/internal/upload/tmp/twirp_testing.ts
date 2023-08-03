import { ArtifactHttpClient } from '../../artifact-http-client'
import { ArtifactServiceClientJSON, CreateArtifactRequest, Timestamp } from '../../../generated'
import { getBackendIds, BackendIds } from '../../util' 
import { getRetentionDays } from '../../config'

export async function twirpTest(){
    const name = Math.random().toString()
    const backendIDs: BackendIds = getBackendIds()
    const createReq: CreateArtifactRequest = {workflowRunBackendId: backendIDs.workflowRunBackendId, workflowJobRunBackendId: backendIDs.workflowJobRunBackendId, name: name, version: 4}
    const retentionDays = getRetentionDays()
    if (retentionDays) {
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + retentionDays)
        createReq.expiresAt = Timestamp.fromDate(expirationDate)
    }

    console.log("CreateArtifact request: " + JSON.stringify(createReq))
    const artifactClient = new ArtifactHttpClient('@actions/artifact-upload')
    const jsonClient = new ArtifactServiceClientJSON(artifactClient)

    try {
        const createResp = await jsonClient.CreateArtifact(createReq)

        if (!createResp.ok) {
            console.log("CreateArtifact failed")
            return
        }

        console.log(createResp.signedUploadUrl)

        const finalizeResp = await jsonClient.FinalizeArtifact({workflowRunBackendId: "ce7f54c7-61c7-4aae-887f-30da475f5f1a", workflowJobRunBackendId: "ca395085-040a-526b-2ce8-bdc85f692774", name: name, size: BigInt(5)})

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
