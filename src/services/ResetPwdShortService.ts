import { SetRequired } from 'type-fest';

import { makeDefaultOptions } from '.';
import ensureHasAllKeys from '../helpers/ensure-has-all-keys';
import { resetPwdWithShortToken } from '../methods/reset-password';
import {
  DataResetPwdShort,
  SanitizedUser,
  ResetPwdWithShortTokenOptions
} from '../types';
import { AuthenticationManagementBase } from './AuthenticationManagementBase';

export class ResetPwdShortService extends AuthenticationManagementBase<DataResetPwdShort, SanitizedUser> {
  options: ResetPwdWithShortTokenOptions;

  constructor (options: SetRequired<Partial<ResetPwdWithShortTokenOptions>, 'app'>) {
    super();

    ensureHasAllKeys(options, ['app'], this.constructor.name);
    const defaultOptions: Omit<ResetPwdWithShortTokenOptions, 'app'> = makeDefaultOptions([
      'service',
      'skipIsVerifiedCheck',
      'reuseResetToken',
      'notifier',
      'reuseResetToken',
      'sanitizeUserForClient',
      'passwordField',
      'identifyUserProps'
    ]);
    this.options = Object.assign(defaultOptions, options);
  }

  async _create (data: DataResetPwdShort): Promise<SanitizedUser> {
    return await resetPwdWithShortToken(
      this.options,
      data.value.token,
      data.value.user,
      data.value.password,
      data.notifierOptions
    );
  }
}
