import { type Rule } from "eslint";

export default {
  create(context) {
    return {
      CallExpression(node) {
        const { callee, arguments: args } = node;

        const isError =
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.object.name === "Object" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "assign" &&
          args[0].type === "ThisExpression";

        if (!isError) {
          return;
        }

        context.report({
          node,
          message: 'Do not use "Object.assign(this, ...".',
        });
      },
    };
  },
} as Rule.RuleModule;
