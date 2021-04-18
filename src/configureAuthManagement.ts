import makeDebug from 'debug';

import actionServiceClassMap from './helpers/action-service-class-map';
import {
  AuthenticationManagementAction,
  AuthenticationManagementConfigureOptions,
  AuthenticationManagementServiceOptions,
  AuthenticationManagementServiceOptionsDefault
} from './types';
import { AuthenticationManagementService } from './services/AuthenticationManagementService';
import { Application } from '@feathersjs/feathers';
import { makeDefaultOptions } from './services';

const debug = makeDebug('authLocalMgnt:service');

const getSeparateServicesPaths = (
  path: string,
  options?: Partial<Pick<AuthenticationManagementConfigureOptions, 'useSeparateServices'>>
): Partial<Record<AuthenticationManagementAction, string>> => {
  if (options?.useSeparateServices === false) {
    return {};
  }

  if (path.endsWith('/')) { path = path.slice(0, -1); }
  const servicePaths: Record<Exclude<AuthenticationManagementAction, 'options'>, string> = {
    checkUnique: `${path}/check-unique`,
    identityChange: `${path}/identity-change`,
    passwordChange: `${path}/password-change`,
    resendVerifySignup: `${path}/resend-verify-signup`,
    resetPwdLong: `${path}/reset-password-long`,
    resetPwdShort: `${path}/reset-password-short`,
    sendResetPwd: `${path}/send-reset-pwd`,
    verifySignupLong: `${path}/verify-signup-long`,
    verifySignupSetPasswordLong: `${path}/verify-signup-set-password-long`,
    verifySignupSetPasswordShort: `${path}/verify-signup-set-password-short`,
    verifySignupShort: `${path}/verify-signup-short`
  };

  if (
    !options ||
    !Object.prototype.hasOwnProperty.call(options, 'useSeparateServices') ||
    options?.useSeparateServices === true
  ) {
    return servicePaths;
  }

  const customKeys = (typeof options.useSeparateServices === 'object')
    ? Object.keys(options.useSeparateServices)
    : [];

  for (const key of customKeys) {
    const val = options.useSeparateServices[key];
    if (val === true || !servicePaths[key]) { continue; }
    if (val === false) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete servicePaths[key];
    }
    if (typeof val === 'string') {
      servicePaths[key] = val;
    }
  }

  return servicePaths;
};

const defaultPath = 'authManagement';

export const defaultConfigureOptions = {
  path: defaultPath,
  useSeparateServices: {
    checkUnique: `${defaultPath}/check-unique`,
    identityChange: `${defaultPath}/identity-change`,
    passwordChange: `${defaultPath}/password-change`,
    resendVerifySignup: `${defaultPath}/resend-verify-signup`,
    resetPwdLong: `${defaultPath}/reset-password-long`,
    resetPwdShort: `${defaultPath}/reset-password-short`,
    sendResetPwd: `${defaultPath}/send-reset-pwd`,
    verifySignupLong: `${defaultPath}/verify-signup-long`,
    verifySignupSetPasswordLong: `${defaultPath}/verify-signup-set-password-long`,
    verifySignupSetPasswordShort: `${defaultPath}/verify-signup-set-password-short`,
    verifySignupShort: `${defaultPath}/verify-signup-short`
  }
};

export const makeDefaultConfigureOptions = (): AuthenticationManagementConfigureOptions => {
  const defaultServiceOptions: AuthenticationManagementServiceOptionsDefault = makeDefaultOptions([
    'service',
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
    'skipIsVerifiedCheck',
    'passwordField'
  ]);

  return Object.assign({}, defaultServiceOptions, defaultConfigureOptions);
};

export default function authenticationLocalManagement (
  providedOptions?: Partial<AuthenticationManagementConfigureOptions>,
  docs?: Record<string, unknown>
): (app: Application) => void {
  debug('service being configured.');

  docs = docs ?? {};

  return function (app) {
    const defaultOptions = makeDefaultConfigureOptions();
    const options: AuthenticationManagementServiceOptions & AuthenticationManagementConfigureOptions = Object.assign(
      {},
      defaultOptions,
      providedOptions,
      {
        app
      });
    const { path } = options;
    const useSeparateServices = getSeparateServicesPaths(path, providedOptions);
    options.useSeparateServices = useSeparateServices;

    app.use(options.path, new AuthenticationManagementService(options, docs));

    // separate paths
    for (const [action, path] of Object.entries(useSeparateServices)) {
      const Service = actionServiceClassMap[action];
      app.use(path, new Service(options));
    }
  };
}

export { AuthenticationManagementService };
