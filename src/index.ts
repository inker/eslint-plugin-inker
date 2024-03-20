import enforceFunctionResultVariableName from "./rules/enforce-function-result-variable-name";
import enforceImportName from "./rules/enforce-import-name";
import jsxNoClassnameTemplateString from "./rules/jsx-no-classname-template-string";
import moduleImportOrder from "./rules/module-import-order";
import noObjectAssignThis from "./rules/no-object-assign-this";
import noSameLineForElements from "./rules/no-same-line-for-elements";
import noThisBrackets from "./rules/no-this-brackets";
import noTrueAsDefaultValue from "./rules/no-true-as-default";
import reactHooksOrder from "./rules/react-hooks-order";
import reactRefName from "./rules/react-ref-name";
import singleImportPerLine from "./rules/single-import-per-line";

export = {
  rules: {
    "enforce-function-result-variable-name": enforceFunctionResultVariableName,
    "enforce-import-name": enforceImportName,
    "jsx-no-classname-template-string": jsxNoClassnameTemplateString,
    "module-import-order": moduleImportOrder,
    "no-object-assign-this": noObjectAssignThis,
    "no-same-line-for-elements": noSameLineForElements,
    "no-this-brackets": noThisBrackets,
    "no-true-as-default": noTrueAsDefaultValue,
    "react-hooks-order": reactHooksOrder,
    "react-ref-name": reactRefName,
    "single-import-per-line": singleImportPerLine,
  },
};
