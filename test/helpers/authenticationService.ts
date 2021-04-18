import { AuthenticationService } from '@feathersjs/authentication';
import { LocalStrategy } from '@feathersjs/authentication-local';
import { Application } from '@feathersjs/feathers';
import { authentication as config } from './config';

export default (app: Application, options?) => {
  if (options) {
    app.set('authentication', options);
  } else {
    app.set('authentication', config);
  }
  const authService = new AuthenticationService(app);

  authService.register('local', new LocalStrategy());
  return authService;
};
