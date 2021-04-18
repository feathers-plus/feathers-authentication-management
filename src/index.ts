import configure from './configureAuthManagement';
import hooks from './hooks';

// @ts-expect-error assign object to a function
configure.hooks = hooks;

export default configure;
export { hooks };

export { AuthenticationManagementService } from './services/AuthenticationManagementService';
export { CheckUniqueService } from './services/CheckUniqueService';
export { IdentityChangeService } from './services/IdentityChangeService';
export { PasswordChangeService } from './services/PasswordChangeService';
export { ResendVerifySignupService } from './services/ResendVerifySignupService';
export { ResetPwdLongService } from './services/ResetPwdLongService';
export { ResetPwdShortService } from './services/ResetPwdShortService';
export { SendResetPwdService } from './services/SendResetPwdService';
export { VerifySignupLongService } from './services/VerifySignupLongService';
export { VerifySignupSetPasswordLongService } from './services/VerifySignupSetPasswordLongService';
export { VerifySignupSetPasswordShortService } from './services/VerifySignupSetPasswordShortService';
export { VerifySignupShortService } from './services/VerifySignupShort';

// commonjs
if (typeof module !== 'undefined') {
  module.exports = Object.assign(configure, module.exports);
}
