import { SetRequired } from 'type-fest';

import { makeDefaultOptions } from '.';
import ensureHasAllKeys from '../helpers/ensure-has-all-keys';
import passwordChange from '../methods/password-change';
import { SanitizedUser, DataPasswordChange, PasswordChangeOptions } from '../types';
import { AuthenticationManagementBase } from './AuthenticationManagementBase';

export class PasswordChangeService extends AuthenticationManagementBase<DataPasswordChange, SanitizedUser> {
  options: PasswordChangeOptions;

  constructor (options: SetRequired<Partial<PasswordChangeOptions>, 'app'>) {
    super();

    ensureHasAllKeys(options, ['app'], this.constructor.name);
    const defaultOptions: Omit<PasswordChangeOptions, 'app'> = makeDefaultOptions([
      'service',
      'notifier',
      'identifyUserProps',
      'sanitizeUserForClient',
      'passwordField'
    ]);
    this.options = Object.assign(defaultOptions, options);
  }

  async _create (data: DataPasswordChange): Promise<SanitizedUser> {
    return await passwordChange(
      this.options,
      data.value.user,
      data.value.oldPassword,
      data.value.password,
      data.notifierOptions
    );
  }
}
