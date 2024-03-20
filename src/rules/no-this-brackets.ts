import { type Rule } from "eslint";

export default {
  create(context) {
    return {
      MemberExpression(node) {
        const { object, computed } = node;

        const isError = object.type === "ThisExpression" && computed;

        if (!isError) {
          return;
        }

        context.report({
          node,
          message: 'Do not use "this[computedKey]".',
        });
      },
    };
  },
} as Rule.RuleModule;
