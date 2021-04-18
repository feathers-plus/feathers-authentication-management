
import cloneObject from './clone-object';
import {
  User
} from '../types';

export default function sanitizeUserForClient (user1: User): Record<string, unknown> {
  const user = cloneObject<User>(user1);

  delete user.password;
  delete user.verifyExpires;
  delete user.verifyToken;
  delete user.verifyShortToken;
  delete user.verifyChanges;
  delete user.resetExpires;
  delete user.resetToken;
  delete user.resetShortToken;

  return user;
}
