import {
  WebPlugin
} from "./chunk-26DNRIXR.js";
import {
  __async
} from "./chunk-QHQP2P2Z.js";

// node_modules/@capacitor/action-sheet/dist/esm/web.js
var ActionSheetWeb = class extends WebPlugin {
  showActions(options) {
    return __async(this, null, function* () {
      return new Promise((resolve, _reject) => {
        let actionSheet = document.querySelector("pwa-action-sheet");
        if (!actionSheet) {
          actionSheet = document.createElement("pwa-action-sheet");
          document.body.appendChild(actionSheet);
        }
        actionSheet.header = options.title;
        actionSheet.cancelable = false;
        actionSheet.options = options.options;
        actionSheet.addEventListener("onSelection", (e) => __async(null, null, function* () {
          const selection = e.detail;
          resolve({
            index: selection
          });
        }));
      });
    });
  }
};
export {
  ActionSheetWeb
};
//# sourceMappingURL=web-I5BTHAIY.js.map
