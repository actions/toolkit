import {
  checkArtifactName,
  checkArtifactFilePath
} from '../src/internal/path-and-artifact-name-validation'
import * as core from '@actions/core'

describe('Path and artifact name validation', () => {
  beforeAll(() => {
    // mock all output so that there is less noise when running tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'warning').mockImplementation(() => {})
  })

  it('Check Artifact Name for any invalid characters', () => {
    const invalidNames = [
      'my\\artifact',
      'my/artifact',
      'my"artifact',
      'my:artifact',
      'my<artifact',
      'my>artifact',
      'my|artifact',
      'my*artifact',
      'my?artifact',
      ''
    ]
    for (const invalidName of invalidNames) {
      expect(() => {
        checkArtifactName(invalidName)
      }).toThrow()
    }

    const validNames = [
      'my-normal-artifact',
      'myNormalArtifact',
      'm¥ñðrmålÄr†ï£å¢†'
    ]
    for (const validName of validNames) {
      expect(() => {
        checkArtifactName(validName)
      }).not.toThrow()
    }
  })

  it('Check Artifact File Path for any invalid characters', () => {
    const invalidNames = [
      'some/invalid"artifact/path',
      'some/invalid:artifact/path',
      'some/invalid<artifact/path',
      'some/invalid>artifact/path',
      'some/invalid|artifact/path',
      'some/invalid*artifact/path',
      'some/invalid?artifact/path',
      'some/invalid\rartifact/path',
      'some/invalid\nartifact/path',
      'some/invalid\r\nartifact/path',
      ''
    ]
    for (const invalidName of invalidNames) {
      expect(() => {
        checkArtifactFilePath(invalidName)
      }).toThrow()
    }

    const validNames = [
      'my/perfectly-normal/artifact-path',
      'my/perfectly\\Normal/Artifact-path',
      'm¥/ñðrmål/Är†ï£å¢†'
    ]
    for (const validName of validNames) {
      expect(() => {
        checkArtifactFilePath(validName)
      }).not.toThrow()
    }
  })
})
