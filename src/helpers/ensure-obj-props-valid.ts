
import { BadRequest } from '@feathersjs/errors';

export default function ensureObjPropsValid (obj: Record<string, unknown>, props: string[], allowNone?: boolean): void {
  const keys = Object.keys(obj);
  const valid = keys.every(key => props.includes(key) && typeof obj[key] === 'string');

  if (!valid || (keys.length === 0 && !allowNone)) {
    throw new BadRequest('User info is not valid. (authLocalMgnt)',
      { errors: { $className: 'badParams' } }
    );
  }
}
