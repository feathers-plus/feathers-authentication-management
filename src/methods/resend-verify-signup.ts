import makeDebug from 'debug';
import ensureObjPropsValid from '../helpers/ensure-obj-props-valid';
import getLongToken from '../helpers/get-long-token';
import getShortToken from '../helpers/get-short-token';
import getUserData from '../helpers/get-user-data';
import notifier from '../helpers/notifier';
import { IdentifyUser, ResendVerifySignupOptions, SanitizedUser } from '../types';

const debug = makeDebug('authLocalMgnt:resendVerifySignup');

// {email}, {cellphone}, {verifyToken}, {verifyShortToken},
// {email, cellphone, verifyToken, verifyShortToken}
export default async function resendVerifySignup (
  options: ResendVerifySignupOptions,
  identifyUser: IdentifyUser,
  notifierOptions: Record<string, unknown>
): Promise<SanitizedUser> {
  debug('identifyUser=', identifyUser);
  const usersService = options.app.service(options.service);
  const usersServiceIdName = usersService.id;

  ensureObjPropsValid(identifyUser,
    options.identifyUserProps.concat('verifyToken', 'verifyShortToken')
  );

  const users = await usersService.find({ query: identifyUser });
  const user1 = getUserData(users, ['isNotVerified']);

  const user2 = await usersService.patch(user1[usersServiceIdName], {
    isVerified: false,
    verifyExpires: Date.now() + options.delay,
    verifyToken: await getLongToken(options.longTokenLen),
    verifyShortToken: await getShortToken(options.shortTokenLen, options.shortTokenDigits)
  });

  const user3 = await notifier(options.notifier, 'resendVerifySignup', user2, notifierOptions);
  return options.sanitizeUserForClient(user3);
}
