---
title: Services
---

# {{ $frontmatter.title }}

## AuthenticationManagementService

### create

`app.service('authManagement').create(data)`

#### data properties:

| data action | other data properties | result |
| ------ | ---------- | ------ |
| `'checkUnique'` | - `value: IdentifyUser`<br>- `ownId?: Id`<br>- `meta?: { noErrMsg?: boolean }`| `throws BadRequest` or returns `null`|
| `'identityChange'` | - `value: { changes: Record<string, unknown>, password: string, user: IdentifyUser }`<br>- `notifierOptions?: Record<string, unknown>` | |
| `'passwordChange'` | - `value: { oldPassword: string, password: string, user: IdentifyUser }`<br>- `notifierOptions?: Record<string, unknown>` | |
| `'resendVerifySignup'` | - `value: IdentifyUser`<br>- `notifierOptions?: Record<string, unknown>` | |
| `'resetPwdLong'` | - `value: { password: string, token: string }`<br>- `notifierOptions?: Record<string, unknown>` | |
| `'resetPwdShort'` | - `value: { password: string, token: string, user: IdentifyUser }`<br>- `notifierOptions?: Record<string, unknown>`| |
| `'sendResetPwd'` | - `value: IdentifyUser`<br>- `notifierOptions?: Record<string, unknown>` | |
| `'verifySignupLong'` | - `value: string`<br>- `notifierOptions?: Record<string, unknown>` | |
| `'verifySignupSetPasswordLong'` | - `value: { password: string, token: string }`<br>- `notifierOptions?: Record<string, unknown>` | |
| `'verifySignupSetPasswordShort'` | - `value: { password: string, token: string, user: IdentifyUser }`<br>- `notifierOptions?: Record<string, unknown>` | |
| `'verifySignupShort'` | - `value: { token: string, user: IdentifyUser }`<br>- `notifierOptions?: Record<string, unknown>`| |
| `'options'` | - | |

## CheckUniqueService

check props are unique in the users items

### create

`app.service('authManagement/check-unique').create(data)`

#### data properties:
- `value: IdentifyUser` - the users properties for checking uniqueness
- `ownId?: Id` - the id of the requesting user
- `meta?: object`
  - `noErrMsg?: boolean`

#### result:
if is unique: `Promise<null>` otherwise rejects with `BadRequest`

## IdentityChangeService

change identity

### create

`app.service('authManagement/identity-change').create(data)`

#### data properties:
- `value: object`
  - `changes: Record<string, unknown>` - `user.verifyChanges` gets updated by this
  - `password: string` - the password of the user
  - `user: IdentifyUser` - the users properties to search for
- `notifierOptions?: Record<string, unknown>`

#### result:
`Promise<SanitizedUser>`

## PasswordChangeService

change password

### create

`app.service('authManagement/password-change').create(data)`

#### data properties:
- `value: object`
  - `oldPassword: string` - the currently valid password
  - `password: string` - the new password to set
  - `user: IdentifyUser` - the users properties to search for
- `notifierOptions?: Record<string, unknown>`

#### result:
`Promise<SanitizedUser>`

## ResendVerifySignupService

resend sign up verification notification

### create

`app.service('authManagement/resend-verify-signup').create(data)`

#### data properties:
- `value: IdentifyUser` - the users properties to search for
- `notifierOptions?: Record<string, unknown>`

#### result:
`Promise<SanitizedUser>`

## ResetPwdLongService

forgotten password verification with long token

### create

`app.service('authManagement/reset-password-long').create(data)`

#### data properties:
- `value: object`
  - `password: string`
  - `token: string`
- `notifierOptions?: Record<string, unknown>`

#### result:
`Promise<SanitizedUser>`

## ResetPwdShortService

forgotten password verification with short token

### create

`app.service('authManagement/reset-password-short').create(data)`

#### data properties:
- `value: object`
  - `password: string`
  - `token: string`
  - `user: IdentifyUser`
- `notifierOptions?: Record<string, unknown>`

#### result:
`Promise<SanitizedUser>`

## SendResetPwdService

send forgotten password notification

### create

`app.service('authManagement/send-reset-password').create(data)`

#### data properties:
- `value: IdentifyUser`
- `notifierOptions?: Record<string, unknown>`

#### result:
`Promise<SanitizedUser>`

## VerifySignupLongService

sign up or identityChange verification with long token

### create

`app.service('authManagement/verify-signup-long').create(data)`

#### data properties:
- `value: string`
- `notifierOptions?: Record<string, unknown>`

#### result:
`Promise<SanitizedUser>`

## VerifySignupSetPasswordLongService

sign up or identityChange verification with long token

### create

`app.service('authManagement/verify-signup-set-password-long').create(data)`

#### data properties:
- `value: object`
  - `password: string`
  - `token: string`
- `notifierOptions?: Record<string, unknown>`

#### result:
`Promise<SanitizedUser>`

## VerifySignupSetPasswordShortService

sign up or identityChange verification with short token

### create

`app.service('authManagement/verify-signup-set-password-short').create(data)`

#### data properties:
- `value: object`
  - `password: string`
  - `token: string`
  - `user: IdentifyUser`
- `notifierOptions?: Record<string, unknown>`

#### result:
`Promise<SanitizedUser>`

## VerifySignupShort

sign up or identityChange verification with short token

### create

`app.service('authManagement/verify-signup-short').create(data)`

#### data properties:
- `value: object`
  - `token: string`
  - `user: IdentifyUser`
- `notifierOptions?: Record<string, unknown>`

#### result:
`Promise<SanitizedUser>`
