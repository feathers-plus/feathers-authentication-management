import { Application, Id } from '@feathersjs/feathers';

//#region general

export interface User {
  isVerified: boolean
  verifyToken: string
  verifyShortToken: string
  verifyExpires: Date | number // unix
  verifyChanges: VerifyChanges
  resetToken: string
  resetShortToken: string
  resetExpires: Date | number // unix
  resetAttempts: number
  password: string
  [key: string]: unknown
  [key: number]: unknown
}

export type HookResult = User | User[] | { data: User | User[], total: number };

export interface VerifyChanges {
  [key: string]: unknown
  [key: number]: unknown
}

// TODO: explicit
export interface Tokens {
  resetToken?: string
  resetShortToken?: string
  verifyShortToken?: string
  verifyToken?: string
}

export interface IdentifyUser {
  [key: string]: string
  [key: number]: string
}

export type Notifier = (type: NotificationType, user: Partial<User>, notifierOptions: Record<string, unknown>) => unknown;
export type SanitizeUserForClient = (user: Partial<User>) => SanitizedUser;

export type SanitizedUser = Partial<User>;

export type NotificationType =
  'resendVerifySignup' |
  'verifySignup' |
  'verifySignupSetPassword' |
  'sendResetPwd' |
  'resetPwd' |
  'passwordChange' |
  'identityChange';

// #endregion

export type AuthenticationManagementAction =
  'checkUnique' |
  'resendVerifySignup' |
  'verifySignupLong' |
  'verifySignupShort' |
  'verifySignupSetPasswordLong' |
  'verifySignupSetPasswordShort' |
  'sendResetPwd' |
  'resetPwdLong' |
  'resetPwdShort' |
  'passwordChange' |
  'identityChange' |
  'options';

export type ActionPathMap<T> = {
  [key in Exclude<AuthenticationManagementAction, 'options'>]: T
};

export type UseSeparateServicesOption = boolean | Partial<ActionPathMap<boolean | string>>;

//#region options

export interface AuthenticationManagementConfigureOptions {
  service: string
  path: string
  skipIsVerifiedCheck: boolean
  notifier: Notifier
  longTokenLen: number
  shortTokenLen: number
  shortTokenDigits: boolean
  resetDelay: number
  delay: number
  resetAttempts: number
  reuseResetToken: boolean
  identifyUserProps: string[]
  sanitizeUserForClient: (user: User) => Partial<User>
  passwordField: string
  // identifyUser: IdentifyUser // TODO ?
  useSeparateServices: UseSeparateServicesOption
}

export interface AuthenticationManagementServiceOptions extends Omit<AuthenticationManagementConfigureOptions, 'path' | 'useSeparateServices'> {
  app: Application
}

export type AuthenticationManagementServiceOptionsDefault = Omit<AuthenticationManagementServiceOptions, 'app'>;

export type VerifySignupOptions = Pick<AuthenticationManagementServiceOptions,
'app' |
'service' |
'notifier' |
'sanitizeUserForClient'>;

export interface VerifySignupWithShortTokenOptions extends VerifySignupOptions {
  identifyUserProps: string[]
}

export type VerifySignupSetPasswordOptions = Pick<AuthenticationManagementServiceOptions,
'app' |
'service' |
'sanitizeUserForClient' |
'notifier' |
'passwordField'>;

export type PasswordChangeOptions = Pick<AuthenticationManagementServiceOptions,
'app' |
'service' |
'identifyUserProps' |
'notifier' |
'sanitizeUserForClient' |
'passwordField'>;

export type VerifySignupSetPasswordWithShortTokenOptions =
VerifySignupSetPasswordOptions & Pick<AuthenticationManagementServiceOptions, 'identifyUserProps'>;

export type ResetPasswordOptions = Pick<AuthenticationManagementServiceOptions,
'app' |
'service' |
'skipIsVerifiedCheck' |
'reuseResetToken' |
'notifier' |
'sanitizeUserForClient' |
'passwordField'>;

export interface ResetPwdWithShortTokenOptions extends ResetPasswordOptions {
  identifyUserProps: string[]
}

export type ResendVerifySignupOptions = Pick<AuthenticationManagementServiceOptions,
'app' |
'service' |
'identifyUserProps' |
'delay' |
'longTokenLen' |
'shortTokenLen' |
'shortTokenDigits' |
'notifier' |
'sanitizeUserForClient'>;

export type IdentityChangeOptions = Pick<AuthenticationManagementServiceOptions,
'app' |
'service' |
'identifyUserProps' |
'delay' |
'longTokenLen' |
'shortTokenLen' |
'shortTokenDigits' |
'notifier' |
'sanitizeUserForClient' |
'passwordField'>;

export type CheckUniqueOptions = Pick<AuthenticationManagementServiceOptions,
'app' |
'service'>;

export type SendResetPwdOptions = Pick<AuthenticationManagementServiceOptions,
'app' |
'service' |
'identifyUserProps' |
'skipIsVerifiedCheck' |
'reuseResetToken' |
'resetDelay' |
'sanitizeUserForClient' |
'resetAttempts' |
'shortTokenLen' |
'longTokenLen' |
'shortTokenDigits' |
'notifier' |
'passwordField'>;

//#endregion

//#region client
export interface AuthenticationManagementClient {
  checkUnique: (identifyUser: IdentifyUser, ownId: Id, ifErrMsg: boolean) => Promise<void>
  resendVerifySignup: (identifyUser: IdentifyUser, notifierOptions: Record<string, unknown>) => Promise<void>
  verifySignupLong: (verifyToken: string) => Promise<void>
  verifySignupShort: (verifyToken: string, identifyUser: IdentifyUser) => Promise<void>
  sendResetPwd: (IdentifyUser: IdentifyUser, notifierOptions: Record<string, unknown>) => Promise<void>
  resetPwdLong: (resetToken: string, password: string) => Promise<void>
  resetPwdShort: (resetShortToken: string, identifyUser: IdentifyUser, password: string) => Promise<void>
  passwordChange: (oldPassword: string, password: string, identifyUser: IdentifyUser) => Promise<void>
  identityChange: (password: string, changesIdentifyUser: Record<string, unknown>, identifyUser: IdentifyUser) => Promise<void>
  authenticate: (email: string, password: string, cb?: (err: Error | null, user?: Partial<User>) => void) => Promise<unknown>
}

//#endregion

//#region service data

export type AuthenticationManagementData =
  DataCheckUniqueWithAction |
  DataIdentityChangeWithAction |
  DataOptions |
  DataPasswordChangeWithAction |
  DataResendVerifySignupWithAction |
  DataResetPwdLongWithAction |
  DataResetPwdShortWithAction |
  DataSendResetPwdWithAction |
  DataVerifySignupLongWithAction |
  DataVerifySignupSetPasswordLongWithAction |
  DataVerifySignupSetPasswordShortWithAction |
  DataVerifySignupShortWithAction;

export interface DataCheckUnique {
  value: IdentifyUser
  ownId?: Id
  meta?: {
    noErrMsg: boolean
  }
}

export interface DataCheckUniqueWithAction extends DataCheckUnique {
  action: 'checkUnique'
}

export interface DataIdentityChange {
  value: {
    changes: Record<string, unknown>
    password: string
    user: IdentifyUser
  }
  notifierOptions?: Record<string, unknown>
}

export interface DataIdentityChangeWithAction extends DataIdentityChange {
  action: 'identityChange'
}

export interface DataPasswordChange {
  value: {
    oldPassword: string
    password: string
    user: IdentifyUser
  }
  notifierOptions?: Record<string, unknown>
}

export interface DataPasswordChangeWithAction extends DataPasswordChange {
  action: 'passwordChange'
}

// TODO: notifierOptions
export interface DataResendVerifySignup {
  value: IdentifyUser
  notifierOptions?: Record<string, unknown>
}

export interface DataResendVerifySignupWithAction extends DataResendVerifySignup {
  action: 'resendVerifySignup'
}

export interface DataResetPwdLong {
  value: {
    password: string
    token: string
  }
  notifierOptions?: Record<string, unknown>
}

export interface DataResetPwdLongWithAction extends DataResetPwdLong {
  action: 'resetPwdLong'
}

export interface DataResetPwdShort {
  value: {
    password: string
    token: string
    user: IdentifyUser
  }
  notifierOptions?: Record<string, unknown>
}

export interface DataResetPwdShortWithAction extends DataResetPwdShort {
  action: 'resetPwdShort'
}

export interface DataSendResetPwd {
  value: IdentifyUser
  notifierOptions?: Record<string, unknown>
}

export interface DataSendResetPwdWithAction extends DataSendResetPwd {
  action: 'sendResetPwd'
}

export interface DataVerifySignupLong {
  value: string
  notifierOptions?: Record<string, unknown>
}

export interface DataVerifySignupLongWithAction extends DataVerifySignupLong {
  action: 'verifySignupLong'
}

export interface DataVerifySignupSetPasswordLong {
  value: {
    password: string
    token: string
  }
  notifierOptions?: Record<string, unknown>
}

export interface DataVerifySignupSetPasswordLongWithAction extends DataVerifySignupSetPasswordLong {
  action: 'verifySignupSetPasswordLong'
}

export interface DataVerifySignupSetPasswordShort {
  value: {
    password: string
    token: string
    user: IdentifyUser
  }
  notifierOptions?: Record<string, unknown>
}

export interface DataVerifySignupSetPasswordShortWithAction extends DataVerifySignupSetPasswordShort {
  action: 'verifySignupSetPasswordShort'
}

export interface DataVerifySignupShort {
  value: {
    token: string
    user: IdentifyUser
  }
  notifierOptions?: Record<string, unknown>
}

export interface DataVerifySignupShortWithAction extends DataVerifySignupShort {
  action: 'verifySignupShort'
}

export interface DataOptions {
  action: 'options'
}

//#endregion
