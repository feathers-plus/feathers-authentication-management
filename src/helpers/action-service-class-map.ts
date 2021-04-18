import { Class } from 'type-fest';

import { AuthenticationManagementBase } from '../services/AuthenticationManagementBase';
import { AuthenticationManagementAction } from '../types';
import { CheckUniqueService } from '../services/CheckUniqueService';
import { IdentityChangeService } from '../services/IdentityChangeService';
import { PasswordChangeService } from '../services/PasswordChangeService';
import { ResendVerifySignupService } from '../services/ResendVerifySignupService';
import { ResetPwdLongService } from '../services/ResetPwdLongService';
import { ResetPwdShortService } from '../services/ResetPwdShortService';
import { SendResetPwdService } from '../services/SendResetPwdService';
import { VerifySignupLongService } from '../services/VerifySignupLongService';
import { VerifySignupSetPasswordLongService } from '../services/VerifySignupSetPasswordLongService';
import { VerifySignupSetPasswordShortService } from '../services/VerifySignupSetPasswordShortService';
import { VerifySignupShortService } from '../services/VerifySignupShort';

const actionServiceClassMap: Record<Exclude<AuthenticationManagementAction, 'options'>, Class<AuthenticationManagementBase<unknown, unknown>>> = {
  checkUnique: CheckUniqueService,
  identityChange: IdentityChangeService,
  passwordChange: PasswordChangeService,
  resendVerifySignup: ResendVerifySignupService,
  resetPwdLong: ResetPwdLongService,
  resetPwdShort: ResetPwdShortService,
  sendResetPwd: SendResetPwdService,
  verifySignupLong: VerifySignupLongService,
  verifySignupSetPasswordLong: VerifySignupSetPasswordLongService,
  verifySignupSetPasswordShort: VerifySignupSetPasswordShortService,
  verifySignupShort: VerifySignupShortService
};

export default actionServiceClassMap;
