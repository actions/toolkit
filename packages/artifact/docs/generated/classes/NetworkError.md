[@actions/artifact](../README.md) / NetworkError

# Class: NetworkError

## Hierarchy

- `Error`

  ↳ **`NetworkError`**

## Table of contents

### Constructors

- [constructor](NetworkError.md#constructor)

### Properties

- [code](NetworkError.md#code)
- [message](NetworkError.md#message)
- [name](NetworkError.md#name)
- [stack](NetworkError.md#stack)
- [prepareStackTrace](NetworkError.md#preparestacktrace)
- [stackTraceLimit](NetworkError.md#stacktracelimit)

### Methods

- [captureStackTrace](NetworkError.md#capturestacktrace)
- [isNetworkErrorCode](NetworkError.md#isnetworkerrorcode)

## Constructors

### constructor

• **new NetworkError**(`code`): [`NetworkError`](NetworkError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `code` | `string` |

#### Returns

[`NetworkError`](NetworkError.md)

#### Overrides

Error.constructor

#### Defined in

[src/internal/shared/errors.ts:42](https://github.com/actions/toolkit/blob/daf23ba/packages/artifact/src/internal/shared/errors.ts#L42)

## Properties

### code

• **code**: `string`

#### Defined in

[src/internal/shared/errors.ts:40](https://github.com/actions/toolkit/blob/daf23ba/packages/artifact/src/internal/shared/errors.ts#L40)

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

___

### isNetworkErrorCode

▸ **isNetworkErrorCode**(`code?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `code?` | `string` |

#### Returns

`boolean`

#### Defined in

[src/internal/shared/errors.ts:49](https://github.com/actions/toolkit/blob/daf23ba/packages/artifact/src/internal/shared/errors.ts#L49)
