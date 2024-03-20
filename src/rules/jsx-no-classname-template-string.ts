import { type Rule } from "eslint";

import { type Expression, type Node } from "estree";

import { type JSXAttribute } from "@babel/types";

export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce not using template strings in className prop",
    },
  },

  create(context) {
    return {
      JSXAttribute(node: Node) {
        const { name, value } = node as unknown as JSXAttribute;

        const isTemplateValue =
          name.name === "className" &&
          value != null &&
          value.type === "JSXExpressionContainer" &&
          value.expression.type === "TemplateLiteral";

        if (!isTemplateValue) {
          return;
        }

        context.report({
          node: value.expression as Expression,
          message: "Avoid using template strings in className prop.",
        });
      },
    };
  },
} as Rule.RuleModule;
