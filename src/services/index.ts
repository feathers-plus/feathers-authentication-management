import _cloneDeep from 'lodash/cloneDeep';
import _pick from 'lodash/pick';

import { AuthenticationManagementService } from './AuthenticationManagementService';

import { CheckUniqueService } from './CheckUniqueService';

import { IdentityChangeService } from './IdentityChangeService';
import { PasswordChangeService } from './PasswordChangeService';
import { ResendVerifySignupService } from './ResendVerifySignupService';
import { ResetPwdLongService } from './ResetPwdLongService';
import { ResetPwdShortService } from './ResetPwdShortService';
import { SendResetPwdService } from './SendResetPwdService';
import { VerifySignupLongService } from './VerifySignupLongService';
import { VerifySignupSetPasswordLongService } from './VerifySignupSetPasswordLongService';
import { VerifySignupSetPasswordShortService } from './VerifySignupSetPasswordShortService';
import { VerifySignupShortService } from './VerifySignupShort';

import {
  AuthenticationManagementServiceOptionsDefault,
  NotificationType,
  User
} from '../types';
import sanitizeUserForClient from '../helpers/sanitize-user-for-client';

const services = {
  AuthenticationManagementService,
  IdentityChangeService,
  PasswordChangeService,
  ResendVerifySignupService,
  ResetPwdLongService,
  ResetPwdShortService,
  SendResetPwdService,
  VerifySignupLongService,
  VerifySignupSetPasswordLongService,
  VerifySignupSetPasswordShortService,
  VerifySignupShortService,
  CheckUniqueService
};

export {
  AuthenticationManagementService,
  IdentityChangeService,
  PasswordChangeService,
  ResendVerifySignupService,
  ResetPwdLongService,
  ResetPwdShortService,
  SendResetPwdService,
  VerifySignupLongService,
  VerifySignupSetPasswordLongService,
  VerifySignupSetPasswordShortService,
  VerifySignupShortService,
  CheckUniqueService
};

export default services;

export const optionsDefault: AuthenticationManagementServiceOptionsDefault = {
  service: '/users', // need exactly this for test suite
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  notifier: async (type: NotificationType, user: User, notifierOptions) => {},
  longTokenLen: 15, // token's length will be twice this
  shortTokenLen: 6,
  shortTokenDigits: true,
  resetDelay: 1000 * 60 * 60 * 2, // 2 hours
  delay: 1000 * 60 * 60 * 24 * 5, // 5 days
  resetAttempts: 0,
  reuseResetToken: false,
  identifyUserProps: ['email'],
  sanitizeUserForClient,
  skipIsVerifiedCheck: false,
  passwordField: 'password'
};

export function makeDefaultOptions<K extends keyof AuthenticationManagementServiceOptionsDefault> (keys: K[]): Pick<AuthenticationManagementServiceOptionsDefault, K> {
  const options = _cloneDeep(optionsDefault);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return _pick(options, keys);
}

// commonjs
if (typeof module !== 'undefined') {
  module.exports = Object.assign(services, module.exports);
}
