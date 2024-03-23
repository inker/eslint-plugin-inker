import { type Rule } from "eslint";

import { type PropertyDefinition, type VariableDeclarator } from "estree";

const refCreationFuncNames = new Set(["createRef", "useRef"]);

const isIdValidName = (name: string) => name === "ref" || name.endsWith("Ref");

export default {
  meta: {
    hasSuggestions: true,
  },

  create(context) {
    const variableDeclaratorStrategy = (node: VariableDeclarator) => {
      const { id } = node;
      if (id.type !== "Identifier") {
        return;
      }

      if (isIdValidName(id.name)) {
        return;
      }

      const suggestedName = `${id.name}Ref`;

      const scope = context.sourceCode.getScope(node);
      const isNameTaken = scope.variables.some(
        variable => variable.name === suggestedName,
      );

      type Suggest = Parameters<typeof context.report>[0]["suggest"];
      const suggest: Suggest = isNameTaken
        ? undefined
        : [
            {
              desc: `Rename variable to '${suggestedName}'`,
              fix(fixer) {
                const references =
                  context.sourceCode.getDeclaredVariables(node)[0]
                    ?.references ?? [];
                return references.map(ref =>
                  fixer.replaceText(ref.identifier, suggestedName),
                );
              },
            },
          ];

      context.report({
        node: id,
        message: 'Variable name should be "ref" or end with "Ref".',
        suggest,
      });
    };

    const propertyDefinitionStrategy = (node: PropertyDefinition) => {
      const { key } = node;
      if (key.type !== "Identifier") {
        return;
      }

      if (isIdValidName(key.name)) {
        return;
      }

      context.report({
        node: key,
        message: 'Property name should be "ref" or end with "Ref".',
      });
    };

    return {
      CallExpression(node) {
        if (node.type !== "CallExpression") {
          return;
        }

        const { callee } = node;
        if (
          callee.type !== "Identifier" ||
          !refCreationFuncNames.has(callee.name)
        ) {
          return;
        }

        const { parent } = node;
        switch (parent.type) {
          case "VariableDeclarator": {
            variableDeclaratorStrategy(parent);
            break;
          }

          case "PropertyDefinition": {
            propertyDefinitionStrategy(parent);
            break;
          }

          default: {
            break;
          }
        }
      },
    };
  },
} as Rule.RuleModule;
