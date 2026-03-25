[@actions/artifact](../README.md) / FindOptions

# Interface: FindOptions

## Table of contents

### Properties

- [findBy](FindOptions.md#findby)

## Properties

### findBy

• `Optional` **findBy**: `Object`

The criteria for finding Artifact(s) out of the scope of the current run.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `repositoryName` | `string` | Repository owner (eg. 'toolkit') |
| `repositoryOwner` | `string` | Repository owner (eg. 'actions') |
| `token` | `string` | Token with actions:read permissions |
| `workflowRunId` | `number` | WorkflowRun of the artifact(s) to lookup |

#### Defined in

[src/internal/shared/interfaces.ts:136](https://github.com/actions/toolkit/blob/f522fdf/packages/artifact/src/internal/shared/interfaces.ts#L136)
