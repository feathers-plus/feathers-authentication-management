import makeDebug from 'debug';
import { BadRequest } from '@feathersjs/errors';
import { SetRequired } from 'type-fest';

import { AuthenticationManagementBase } from './AuthenticationManagementBase';

import {
  AuthenticationManagementData,
  AuthenticationManagementServiceOptions,
  DataCheckUnique,
  DataCheckUniqueWithAction,
  DataIdentityChange,
  DataIdentityChangeWithAction,
  DataOptions,
  DataPasswordChange,
  DataPasswordChangeWithAction,
  DataResendVerifySignup,
  DataResendVerifySignupWithAction,
  DataResetPwdLong,
  DataResetPwdLongWithAction,
  DataResetPwdShort,
  DataResetPwdShortWithAction,
  DataSendResetPwd,
  DataSendResetPwdWithAction,
  DataVerifySignupLong,
  DataVerifySignupLongWithAction,
  DataVerifySignupSetPasswordLong,
  DataVerifySignupSetPasswordLongWithAction,
  DataVerifySignupSetPasswordShort,
  DataVerifySignupSetPasswordShortWithAction,
  DataVerifySignupShort,
  DataVerifySignupShortWithAction,
  SanitizedUser
} from '../types';
import ensureHasAllKeys from '../helpers/ensure-has-all-keys';
import { makeDefaultOptions } from '.';
import checkUnique from '../methods/check-unique';
import identityChange from '../methods/identity-change';
import passwordChange from '../methods/password-change';
import resendVerifySignup from '../methods/resend-verify-signup';
import { resetPwdWithLongToken, resetPwdWithShortToken } from '../methods/reset-password';
import sendResetPwd from '../methods/send-reset-pwd';
import { verifySignupWithLongToken, verifySignupWithShortToken } from '../methods/verify-signup';
import { verifySignupSetPasswordWithLongToken, verifySignupSetPasswordWithShortToken } from '../methods/verify-signup-set-password';

const debug = makeDebug('authLocalMgnt:service');

type AllResultTypes = null | SanitizedUser | AuthenticationManagementServiceOptions | unknown;

export class AuthenticationManagementService extends AuthenticationManagementBase<AuthenticationManagementData, AllResultTypes> {
  docs: unknown;
  options: AuthenticationManagementServiceOptions;

  constructor (
    options: SetRequired<Partial<AuthenticationManagementServiceOptions>, 'app'>,
    docs?: unknown
  ) {
    super();

    ensureHasAllKeys(options, ['app'], this.constructor.name);
    const defaultOptions: Omit<AuthenticationManagementServiceOptions, 'app'> = makeDefaultOptions([
      'service',
      'skipIsVerifiedCheck',
      'notifier',
      'longTokenLen',
      'shortTokenLen',
      'shortTokenDigits',
      'resetDelay',
      'delay',
      'resetAttempts',
      'reuseResetToken',
      'identifyUserProps',
      'sanitizeUserForClient',
      'passwordField'
    ]);
    this.options = Object.assign(defaultOptions, options);

    this.docs = docs;
  }

  async _checkUnique (data: DataCheckUnique): Promise<unknown> {
    return await checkUnique(
      this.options,
      data.value,
      data.ownId,
      data.meta
    );
  }

  async _identityChange (data: DataIdentityChange): Promise<SanitizedUser> {
    return await identityChange(
      this.options,
      data.value.user,
      data.value.password,
      data.value.changes,
      data.notifierOptions
    );
  }

  async _passwordChange (data: DataPasswordChange): Promise<SanitizedUser> {
    return await passwordChange(
      this.options,
      data.value.user,
      data.value.oldPassword,
      data.value.password,
      data.notifierOptions
    );
  }

  async _resendVerifySignup (data: DataResendVerifySignup): Promise<SanitizedUser> {
    return await resendVerifySignup(
      this.options,
      data.value,
      data.notifierOptions
    );
  }

  async _resetPasswordLong (data: DataResetPwdLong): Promise<SanitizedUser> {
    return await resetPwdWithLongToken(
      this.options,
      data.value.token,
      data.value.password,
      data.notifierOptions
    );
  }

  async _resetPasswordShort (data: DataResetPwdShort): Promise<SanitizedUser> {
    return await resetPwdWithShortToken(
      this.options,
      data.value.token,
      data.value.user,
      data.value.password,
      data.notifierOptions
    );
  }

  async _sendResetPassword (data: DataSendResetPwd): Promise<SanitizedUser> {
    return await sendResetPwd(
      this.options,
      data.value,
      data.notifierOptions
    );
  }

  async _verifySignupLong (data: DataVerifySignupLong): Promise<SanitizedUser> {
    return await verifySignupWithLongToken(
      this.options,
      data.value,
      data.notifierOptions
    );
  }

  async _verifySignupShort (data: DataVerifySignupShort): Promise<SanitizedUser> {
    return await verifySignupWithShortToken(
      this.options,
      data.value.token,
      data.value.user,
      data.notifierOptions
    );
  }

  async _verifySignupSetPasswordLong (data: DataVerifySignupSetPasswordLong): Promise<SanitizedUser> {
    return await verifySignupSetPasswordWithLongToken(
      this.options,
      data.value.token,
      data.value.password,
      data.notifierOptions
    );
  }

  async _verifySignupSetPasswordShort (data: DataVerifySignupSetPasswordShort): Promise<SanitizedUser> {
    return await verifySignupSetPasswordWithShortToken(
      this.options,
      data.value.token,
      data.value.user,
      data.value.password,
      data.notifierOptions
    );
  }

  /**
   * check props are unique in the users items.
   * @param data.action action is 'checkUnique'
   * @param data.value {IdentifyUser} the user with properties, e.g. {email, username}. Props with null or undefined are ignored.
   * @param data.ownId excludes your current user from the search
   * @param data.meta.noErrMsg if return an error.message if not unique
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async _create ({ action, value, ownId, meta }: DataCheckUniqueWithAction): Promise<null>
  /**
   * change communications
   * @param action action is 'identityChange'
   * @param value { changes, password, user }
   * @param notifierOptions
   */
  async _create ({ action, value, notifierOptions }: DataIdentityChangeWithAction): Promise<SanitizedUser>
  /**
   * change password
   * @param action action is 'passwordChange'
   * @param value { oldPassword, password, user }
   * @param notifierOptions
   */
  async _create ({ action, value, notifierOptions }: DataPasswordChangeWithAction): Promise<SanitizedUser>
  /**
   * resend sign up verification notification
   * @param action action is 'resendVerifySignup'
   * @param value {IdentifyUser} the user with properties, e.g. {email}, {token: verifyToken}
   * @param notifierOptions options passed to options.notifier, e.g. {preferredComm: 'cellphone'}
   */
  async _create ({ action, value, notifierOptions }: DataResendVerifySignupWithAction): Promise<SanitizedUser>
  /**
   * forgotten password verification with long token
   * @param action action is 'resetPwdLong'
   * @param value { password, token, user }
   * @param notifierOptions
   */
  async _create ({ action, value, notifierOptions }: DataResetPwdLongWithAction): Promise<SanitizedUser>
  /**
   * forgotten password verification with short token
   * @param action action is 'resetPwdShort'
   * @param value { password, token, user }
   * @param notifierOptions
   */
  async _create ({ action, value, notifierOptions }: DataResetPwdShortWithAction): Promise<SanitizedUser>
  /**
   * send forgotten password notification
   * @param action action is 'sendResetPwd'
   * @param value { password, token }
   * @param notifierOptions
   */
  async _create ({ action, value, notifierOptions }: DataSendResetPwdWithAction): Promise<SanitizedUser>
  /**
   * sign up or identityChange verification with long token
   * @param action action is 'verifySignupLong'
   * @param value // compares to user.verifyToken
   * @param notifierOptions options passed to options.notifier, e.g. {preferredComm: 'cellphone'}
   */
  async _create ({ action, value, notifierOptions }: DataVerifySignupLongWithAction): Promise<SanitizedUser>
  /**
   * sign up or identityChange verification with short token
   * @param action action is 'verifySignupShort'
   * @param value { token, user }
   * @param notifierOptions
   */
  async _create ({ action, value, notifierOptions }: DataVerifySignupShortWithAction): Promise<SanitizedUser>
  /**
   * sign up verification and set password  with long token
   * @param action action is 'verifySignupSetPasswordLong'
   * @param value { password, token }
   * @param notifierOptions
   */
  async _create ({ action, value, notifierOptions }: DataVerifySignupSetPasswordLongWithAction): Promise<SanitizedUser>
  /**
   * sign up verification and set password with short token
   * @param action action is 'verifySignupSetPasswordShort'
   * @param value { password, token, user }
   * @param notifierOptions
   */
  async _create ({ action, value, notifierOptions }: DataVerifySignupSetPasswordShortWithAction): Promise<SanitizedUser>
  /**
   * get options for AuthenticationManagement
   * @param action action is 'options'
   */
  async _create ({ action }: DataOptions): Promise<AuthenticationManagementServiceOptions>
  async _create (data: AuthenticationManagementData): Promise<AllResultTypes> {
    debug(`create called. action=${data.action}`);

    try {
      if (data.action === 'checkUnique') {
        return await this._checkUnique(data);
      } else if (data.action === 'resendVerifySignup') {
        return await this._resendVerifySignup(data);
      } else if (data.action === 'verifySignupLong') {
        return await this._verifySignupLong(data);
      } else if (data.action === 'verifySignupShort') {
        return await this._verifySignupShort(data);
      } else if (data.action === 'verifySignupSetPasswordLong') {
        return await this._verifySignupSetPasswordLong(data);
      } else if (data.action === 'verifySignupSetPasswordShort') {
        return await this._verifySignupSetPasswordShort(data);
      } else if (data.action === 'sendResetPwd') {
        return await this._sendResetPassword(data);
      } else if (data.action === 'resetPwdLong') {
        return await this._resetPasswordLong(data);
      } else if (data.action === 'resetPwdShort') {
        return await this._resetPasswordShort(data);
      } else if (data.action === 'passwordChange') {
        return await this._passwordChange(data);
      } else if (data.action === 'identityChange') {
        return await this._identityChange(data);
      } else if (data.action === 'options') {
        return this.options;
      }
    } catch (err) {
      return await Promise.reject(err);
    }

    // @ts-expect-error this should not be reached
    throw new BadRequest(`Action '${data.action}' is invalid.`, { // eslint-disable-line
      errors: { $className: 'badParams' }
    });
  }
}
