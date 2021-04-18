import { SetRequired } from 'type-fest';

import { makeDefaultOptions } from '.';
import ensureHasAllKeys from '../helpers/ensure-has-all-keys';
import resendVerifySignup from '../methods/resend-verify-signup';
import { SanitizedUser, ResendVerifySignupOptions, DataResendVerifySignup } from '../types';
import { AuthenticationManagementBase } from './AuthenticationManagementBase';

export class ResendVerifySignupService extends AuthenticationManagementBase<DataResendVerifySignup, SanitizedUser> {
  options: ResendVerifySignupOptions;

  constructor (options: SetRequired<Partial<ResendVerifySignupOptions>, 'app'>) {
    super();

    ensureHasAllKeys(options, ['app'], this.constructor.name);
    const defaultOptions: Omit<ResendVerifySignupOptions, 'app'> = makeDefaultOptions([
      'service',
      'notifier',
      'longTokenLen',
      'shortTokenLen',
      'shortTokenDigits',
      'delay',
      'identifyUserProps',
      'sanitizeUserForClient'
    ]);
    this.options = Object.assign(defaultOptions, options);
  }

  async _create (data: DataResendVerifySignup): Promise<SanitizedUser> {
    return await resendVerifySignup(
      this.options,
      data.value,
      data.notifierOptions
    );
  }
}
