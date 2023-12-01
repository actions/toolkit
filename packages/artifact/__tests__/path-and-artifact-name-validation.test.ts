import {
  validateArtifactName,
  validateFilePath
} from '../src/internal/upload/path-and-artifact-name-validation'

import {noopLogs} from './common'

describe('Path and artifact name validation', () => {
  beforeAll(() => {
    noopLogs()
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
        validateArtifactName(invalidName)
      }).toThrow()
    }

    const validNames = [
      'my-normal-artifact',
      'myNormalArtifact',
      'm¥ñðrmålÄr†ï£å¢†'
    ]
    for (const validName of validNames) {
      expect(() => {
        validateArtifactName(validName)
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
        validateFilePath(invalidName)
      }).toThrow()
    }

    const validNames = [
      'my/perfectly-normal/artifact-path',
      'my/perfectly\\Normal/Artifact-path',
      'm¥/ñðrmål/Är†ï£å¢†'
    ]
    for (const validName of validNames) {
      expect(() => {
        validateFilePath(validName)
      }).not.toThrow()
    }
  })
})
