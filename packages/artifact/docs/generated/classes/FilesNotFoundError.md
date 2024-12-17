[@actions/artifact](../README.md) / FilesNotFoundError

# Class: FilesNotFoundError

## Hierarchy

- `Error`

  ↳ **`FilesNotFoundError`**

## Table of contents

### Constructors

- [constructor](FilesNotFoundError.md#constructor)

### Properties

- [files](FilesNotFoundError.md#files)
- [message](FilesNotFoundError.md#message)
- [name](FilesNotFoundError.md#name)
- [stack](FilesNotFoundError.md#stack)
- [prepareStackTrace](FilesNotFoundError.md#preparestacktrace)
- [stackTraceLimit](FilesNotFoundError.md#stacktracelimit)

### Methods

- [captureStackTrace](FilesNotFoundError.md#capturestacktrace)

## Constructors

### constructor

• **new FilesNotFoundError**(`files?`): [`FilesNotFoundError`](FilesNotFoundError.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `files` | `string`[] | `[]` |

#### Returns

[`FilesNotFoundError`](FilesNotFoundError.md)

#### Overrides

Error.constructor

#### Defined in

[src/internal/shared/errors.ts:4](https://github.com/actions/toolkit/blob/f522fdf/packages/artifact/src/internal/shared/errors.ts#L4)

## Properties

### files

• **files**: `string`[]

#### Defined in

[src/internal/shared/errors.ts:2](https://github.com/actions/toolkit/blob/f522fdf/packages/artifact/src/internal/shared/errors.ts#L2)

___

### message

• **message**: `string`

#### Inherited from

Error.message

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1068

___

### name

• **name**: `string`

#### Inherited from

Error.name

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1067

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1069

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

Error.prepareStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:11

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

#### Defined in

node_modules/@types/node/globals.d.ts:13

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:4
