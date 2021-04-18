
import cloneObject from './clone-object';

import {
  User
} from '../types';

export default function sanitizeUserForNotifier (user1: User): Record<string, unknown> {
  const user = cloneObject<User>(user1);
  delete user.password;
  return user;
}
