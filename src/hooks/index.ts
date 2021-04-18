
import addVerification from './add-verification';
import isVerified from './is-verified';
import removeVerification from './remove-verification';

const hooks = {
  addVerification,
  isVerified,
  removeVerification
};

export {
  addVerification,
  isVerified,
  removeVerification
};

export default hooks;

// commonjs
if (typeof module !== 'undefined') {
  module.exports = Object.assign(hooks, module.exports);
}
