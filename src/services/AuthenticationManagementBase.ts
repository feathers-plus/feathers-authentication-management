import { MethodNotAllowed } from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';

export abstract class AuthenticationManagementBase<T, R> {
  publish: unknown;

  abstract _create (data: T, params?: Params): Promise<R>;

  async create (data: T, params?: Params): Promise<R> {
    if (Array.isArray(data)) {
      return await Promise.reject(new MethodNotAllowed('authManagement does not handle multiple entries'));
    }

    return await this._create(data, params);
  }

  setup (): void {
    if (typeof this.publish === 'function') {
      this.publish(() => null);
    }
  }
}
