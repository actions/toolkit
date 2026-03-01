[@actions/artifact](../README.md) / UsageError

# Class: UsageError

## Hierarchy

- `Error`

  ↳ **`UsageError`**

## Table of contents

### Constructors

- [constructor](UsageError.md#constructor)

### Properties

- [message](UsageError.md#message)
- [name](UsageError.md#name)
- [stack](UsageError.md#stack)
- [prepareStackTrace](UsageError.md#preparestacktrace)
- [stackTraceLimit](UsageError.md#stacktracelimit)

### Methods

- [captureStackTrace](UsageError.md#capturestacktrace)
- [isUsageErrorMessage](UsageError.md#isusageerrormessage)

## Constructors

### constructor

• **new UsageError**(): [`UsageError`](UsageError.md)

#### Returns

[`UsageError`](UsageError.md)

#### Overrides

Error.constructor

#### Defined in

[src/internal/shared/errors.ts:62](https://github.com/actions/toolkit/blob/f522fdf/packages/artifact/src/internal/shared/errors.ts#L62)

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

___

### isUsageErrorMessage

▸ **isUsageErrorMessage**(`msg?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `msg?` | `string` |

#### Returns

`boolean`

#### Defined in

[src/internal/shared/errors.ts:68](https://github.com/actions/toolkit/blob/f522fdf/packages/artifact/src/internal/shared/errors.ts#L68)
