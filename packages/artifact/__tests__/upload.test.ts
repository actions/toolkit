import * as fs from 'fs'
import * as io from '../../io/src/io'
import * as path from 'path'
import * as uploadHttpClient from '../src/upload-artifact-http-client'

/*
These test will fail locally if as they require some env variables to be set by the runner
*/
describe('upload-tests', () => {
  /**
   *  Simple test to verify an artifact container can be created with the expected response
   */
  it('Create artifact in file container API test', async () => {
    const name = 'my-artifact-container'
    const response = await uploadHttpClient.createArtifactInFileContainer(name)

    expect(response.name).toEqual(name)
    expect(response.size).toEqual(-1)
    expect(response.type).toEqual('actions_storage')

    const expectedResourceUrl = `${process.env['ACTIONS_RUNTIME_URL']}_apis/resources/Containers/${response.containerId}`
    expect(response.fileContainerResourceUrl).toEqual(expectedResourceUrl)
  })

  /**
   *  Tests creating a new artifact container, uploading a small file and then associating the
   *  uploaded artifact with the correct size
   */
  it('Upload simple file and associate artifact', async () => {
    const name = 'my-artifact-with-files'
    const response = await uploadHttpClient.createArtifactInFileContainer(name)

    expect(response.name).toEqual(name)
    expect(response.size).toEqual(-1)
    expect(response.type).toEqual('actions_storage')

    const expectedResourceUrl = `${process.env['ACTIONS_RUNTIME_URL']}_apis/resources/Containers/${response.containerId}`
    expect(response.fileContainerResourceUrl).toEqual(expectedResourceUrl)

    // clear temp directory and create a simple file that will be uploaded
    await io.rmRF(getTestTemp())
    await fs.promises.mkdir(getTestTemp(), {recursive: true})
    const itemPath = path.join(getTestTemp(), 'testFile.txt')
    await fs.promises.writeFile(
      itemPath,
      'Simple file that we will be uploading'
    )

    /**
     * findFilesToUpload() from search.ts will normally return the information for what to upload. For these tests
     * however, filesToUpload will be hardcoded to just test the upload APIs
     */
    const filesToUpload = [
      {
        absoluteFilePath: itemPath,
        uploadFilePath: path.join(name, 'testFile.txt')
      }
    ]

    const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
      response.fileContainerResourceUrl,
      filesToUpload
    )
    expect(uploadResult.failedItems.length === 0)
    expect(uploadResult.size).toEqual(fs.statSync(itemPath).size)

    expect(async () => {
      await uploadHttpClient.patchArtifactSize(uploadResult.size, name)
    }).not.toThrow()
  })

  function getTestTemp(): string {
    return path.join(__dirname, '_temp', 'artifact-upload')
  }
})
