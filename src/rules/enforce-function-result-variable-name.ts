import { type Rule } from "eslint";

import { type Identifier } from "estree";

import { groupBy, mapValues } from "lodash";

interface FunctionConfig {
  functionName: string;
  variableName: string;
}

export default {
  meta: {
    schema: [
      {
        type: "array",
        items: {
          type: "object",
          properties: {
            functionName: {
              type: "string",
            },
            variableName: {
              type: "string",
            },
          },
          additionalProperties: false,
        },
      },
    ],
  },

  create(context) {
    const functionConfigs = (context.options[0] ?? []) as FunctionConfig[];
    const groups = groupBy(functionConfigs, o => o.functionName);
    const variableNamesByFunctionName = mapValues(
      groups,
      arr => new Set(arr.map(o => o.variableName)),
    );

    return {
      VariableDeclarator(node) {
        const { id, init } = node;

        const isMatching =
          init &&
          init.type === "CallExpression" &&
          init.callee.type === "Identifier" &&
          id.type === "Identifier";
        if (!isMatching) {
          return;
        }

        const functionName = (init.callee as Identifier).name;
        const allowedVariableNames = variableNamesByFunctionName[functionName];
        if (!allowedVariableNames || allowedVariableNames.has(id.name)) {
          return;
        }

        const suggestedNamesStr = [...allowedVariableNames]
          .map(name => `"${name}"`)
          .join(", ");

        context.report({
          node: id,
          message: `Variable assigned by the result of ${functionName}(...) should have one of the following names: ${suggestedNamesStr}.`,
        });
      },
    };
  },
} as Rule.RuleModule;
