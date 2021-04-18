import { Id } from '@feathersjs/feathers';

export default function concatIDAndHash (id: Id, token: string): string {
  return `${id}___${token}`;
}
