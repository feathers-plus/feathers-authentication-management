
import { BadRequest } from '@feathersjs/errors';
import { HookContext } from '@feathersjs/feathers';
import { checkContext } from 'feathers-hooks-common';

export default function isVerified (): ((hook: HookContext) => HookContext) {
  return (hook: HookContext): HookContext => {
    checkContext(hook, 'before');

    if (!hook.params?.user?.isVerified) {
      throw new BadRequest('User\'s email is not yet verified.');
    }
    return hook;
  };
}
