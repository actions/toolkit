[@actions/artifact](../README.md) / GHESNotSupportedError

# Class: GHESNotSupportedError

## Hierarchy

- `Error`

  ↳ **`GHESNotSupportedError`**

## Table of contents

### Constructors

- [constructor](GHESNotSupportedError.md#constructor)

### Properties

- [message](GHESNotSupportedError.md#message)
- [name](GHESNotSupportedError.md#name)
- [stack](GHESNotSupportedError.md#stack)
- [prepareStackTrace](GHESNotSupportedError.md#preparestacktrace)
- [stackTraceLimit](GHESNotSupportedError.md#stacktracelimit)

### Methods

- [captureStackTrace](GHESNotSupportedError.md#capturestacktrace)

## Constructors

### constructor

• **new GHESNotSupportedError**(`message?`): [`GHESNotSupportedError`](GHESNotSupportedError.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `message` | `string` | `'@actions/artifact v2.0.0+, upload-artifact@v4+ and download-artifact@v4+ are not currently supported on GHES.'` |

#### Returns

[`GHESNotSupportedError`](GHESNotSupportedError.md)

#### Overrides

Error.constructor

#### Defined in

[src/internal/shared/errors.ts:31](https://github.com/actions/toolkit/blob/207747e/packages/artifact/src/internal/shared/errors.ts#L31)

## Properties

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
