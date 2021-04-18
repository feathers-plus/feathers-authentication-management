import { SetRequired } from 'type-fest';

import { makeDefaultOptions } from '.';
import ensureHasAllKeys from '../helpers/ensure-has-all-keys';
import identityChange from '../methods/identity-change';
import { SanitizedUser, IdentityChangeOptions, DataIdentityChange } from '../types';
import { AuthenticationManagementBase } from './AuthenticationManagementBase';

export class IdentityChangeService extends AuthenticationManagementBase<DataIdentityChange, SanitizedUser> {
  options: IdentityChangeOptions;

  constructor (options: SetRequired<Partial<IdentityChangeOptions>, 'app'>) {
    super();

    ensureHasAllKeys(options, ['app'], this.constructor.name);
    const defaultOptions: Omit<IdentityChangeOptions, 'app'> = makeDefaultOptions([
      'service',
      'notifier',
      'longTokenLen',
      'shortTokenLen',
      'shortTokenDigits',
      'delay',
      'identifyUserProps',
      'sanitizeUserForClient',
      'passwordField'
    ]);
    this.options = Object.assign(defaultOptions, options);
  }

  async _create (data: DataIdentityChange): Promise<SanitizedUser> {
    return await identityChange(
      this.options,
      data.value.user,
      data.value.password,
      data.value.changes,
      data.notifierOptions
    );
  }
}
