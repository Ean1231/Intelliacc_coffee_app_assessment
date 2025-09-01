import {
  registerPlugin
} from "./chunk-26DNRIXR.js";
import "./chunk-QHQP2P2Z.js";

// node_modules/@capacitor/action-sheet/dist/esm/definitions.js
var ActionSheetButtonStyle;
(function(ActionSheetButtonStyle2) {
  ActionSheetButtonStyle2["Default"] = "DEFAULT";
  ActionSheetButtonStyle2["Destructive"] = "DESTRUCTIVE";
  ActionSheetButtonStyle2["Cancel"] = "CANCEL";
})(ActionSheetButtonStyle || (ActionSheetButtonStyle = {}));
var ActionSheetOptionStyle = ActionSheetButtonStyle;

// node_modules/@capacitor/action-sheet/dist/esm/index.js
var ActionSheet = registerPlugin("ActionSheet", {
  web: () => import("./web-I5BTHAIY.js").then((m) => new m.ActionSheetWeb())
});
export {
  ActionSheet,
  ActionSheetButtonStyle,
  ActionSheetOptionStyle
};
//# sourceMappingURL=@capacitor_action-sheet.js.map
