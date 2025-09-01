import {
  WebPlugin
} from "./chunk-26DNRIXR.js";
import {
  __async
} from "./chunk-QHQP2P2Z.js";

// node_modules/@capacitor/dialog/dist/esm/web.js
var DialogWeb = class extends WebPlugin {
  alert(options) {
    return __async(this, null, function* () {
      window.alert(options.message);
    });
  }
  prompt(options) {
    return __async(this, null, function* () {
      const val = window.prompt(options.message, options.inputText || "");
      return {
        value: val !== null ? val : "",
        cancelled: val === null
      };
    });
  }
  confirm(options) {
    return __async(this, null, function* () {
      const val = window.confirm(options.message);
      return {
        value: val
      };
    });
  }
};
export {
  DialogWeb
};
//# sourceMappingURL=web-AKQHWF74.js.map
