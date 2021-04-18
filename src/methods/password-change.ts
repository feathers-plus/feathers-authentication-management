
import { BadRequest } from '@feathersjs/errors';
import makeDebug from 'debug';
import comparePasswords from '../helpers/compare-passwords';
import ensureObjPropsValid from '../helpers/ensure-obj-props-valid';
import ensureValuesAreStrings from '../helpers/ensure-values-are-strings';
import getUserData from '../helpers/get-user-data';
import hashPassword from '../helpers/hash-password';
import notifier from '../helpers/notifier';
import { IdentifyUser, PasswordChangeOptions, SanitizedUser } from '../types';

const debug = makeDebug('authLocalMgnt:passwordChange');

export default async function passwordChange (
  options: PasswordChangeOptions,
  identifyUser: IdentifyUser,
  oldPassword: string,
  password: string,
  notifierOptions = {}
): Promise<SanitizedUser> {
  debug('passwordChange', oldPassword, password);
  const usersService = options.app.service(options.service);
  const usersServiceIdName = usersService.id;

  ensureValuesAreStrings(oldPassword, password);
  ensureObjPropsValid(identifyUser, options.identifyUserProps);

  const users = await usersService.find({ query: identifyUser });
  const user1 = getUserData(users);

  try {
    await comparePasswords(oldPassword, user1.password);
  } catch (err) {
    throw new BadRequest('Current password is incorrect.', {
      errors: { oldPassword: 'Current password is incorrect.' }
    });
  }

  const user2 = await usersService.patch(user1[usersServiceIdName], {
    password: await hashPassword(options.app, password, options.passwordField)
  });

  const user3 = await notifier(options.notifier, 'passwordChange', user2, notifierOptions);
  return options.sanitizeUserForClient(user3);
}
