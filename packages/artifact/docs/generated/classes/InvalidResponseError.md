[@actions/artifact](../README.md) / InvalidResponseError

# Class: InvalidResponseError

## Hierarchy

- `Error`

  ↳ **`InvalidResponseError`**

## Table of contents

### Constructors

- [constructor](InvalidResponseError.md#constructor)

### Properties

- [message](InvalidResponseError.md#message)
- [name](InvalidResponseError.md#name)
- [stack](InvalidResponseError.md#stack)
- [prepareStackTrace](InvalidResponseError.md#preparestacktrace)
- [stackTraceLimit](InvalidResponseError.md#stacktracelimit)

### Methods

- [captureStackTrace](InvalidResponseError.md#capturestacktrace)

## Constructors

### constructor

• **new InvalidResponseError**(`message`): [`InvalidResponseError`](InvalidResponseError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |

#### Returns

[`InvalidResponseError`](InvalidResponseError.md)

#### Overrides

Error.constructor

#### Defined in

[src/internal/shared/errors.ts:17](https://github.com/actions/toolkit/blob/daf23ba/packages/artifact/src/internal/shared/errors.ts#L17)

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
