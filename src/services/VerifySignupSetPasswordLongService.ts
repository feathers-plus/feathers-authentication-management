import { SetRequired } from 'type-fest';

import { makeDefaultOptions } from '.';
import ensureHasAllKeys from '../helpers/ensure-has-all-keys';
import { DataVerifySignupSetPasswordLong, SanitizedUser, VerifySignupSetPasswordOptions } from '../types';
import { verifySignupSetPasswordWithLongToken } from '../methods/verify-signup-set-password';
import { AuthenticationManagementBase } from './AuthenticationManagementBase';

export class VerifySignupSetPasswordLongService extends AuthenticationManagementBase<DataVerifySignupSetPasswordLong, SanitizedUser> {
  options: VerifySignupSetPasswordOptions;

  constructor (options: SetRequired<Partial<VerifySignupSetPasswordOptions>, 'app'>) {
    super();

    ensureHasAllKeys(options, ['app'], this.constructor.name);
    const defaultOptions: Omit<VerifySignupSetPasswordOptions, 'app'> = makeDefaultOptions([
      'service',
      'notifier',
      'sanitizeUserForClient',
      'passwordField'
    ]);
    this.options = Object.assign(defaultOptions, options);
  }

  async _create (data: DataVerifySignupSetPasswordLong): Promise<SanitizedUser> {
    return await verifySignupSetPasswordWithLongToken(
      this.options,
      data.value.token,
      data.value.password,
      data.notifierOptions
    );
  }
}
