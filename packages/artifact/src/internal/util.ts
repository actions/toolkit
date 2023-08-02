import { getRuntimeToken } from './config';

export interface BackendIds {
    workflowRunBackendId: string;
    workflowJobRunBackendId: string;
}

export function getBackendIds(): BackendIds {
    const token = getRuntimeToken();
    const parsedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    if (!parsedToken["scp"]) {
        throw new Error('Unable to get scp from token')
    }

    const scp = parsedToken["scp"]
    const scpParts = scp.split(' ')
    if (scpParts.length == 0) {
        throw new Error('No scp parts found')
    }

    for (const part of scpParts) {
        const partParts = part.split(':')
        if(partParts.length == 0) {
            continue
        }

        if (partParts[0] == "Actions.Results") {
            if (partParts.length == 3) {
                return {workflowRunBackendId: partParts[1], workflowJobRunBackendId: partParts[2]}
            }
            throw new Error('Unable to parse Actions.Results scp part')
        }
    }

    throw new Error('Unable to find ids')
} 
