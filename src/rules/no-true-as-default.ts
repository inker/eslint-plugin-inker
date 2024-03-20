import { type Rule } from "eslint";

export default {
  create(context) {
    return {
      AssignmentPattern(node) {
        const { right } = node;

        const isError = right.type === "Literal" && right.value === true;

        if (!isError) {
          return;
        }

        context.report({
          node: right,
          message: "Do not use true as a default value",
        });
      },
    };
  },
} as Rule.RuleModule;
