import { orderBy } from "lodash";

import { type Rule } from "eslint";

import { type ImportSpecifier } from "estree";

import isNonDecreasing from "../utils/isNonDecreasing";

const WILDCARD_OTHER = "*";

interface OptionsObj {
  name: string;
  before?: readonly string[];
  after?: readonly string[];
}

type Options = OptionsObj[];

export default {
  meta: {
    schema: [
      {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
            },
            before: {
              type: "array",
              items: {
                type: "string",
              },
            },
            after: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: ["name"],
        },
      },
    ],
    fixable: "code",
  },

  create(context) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const options: Options = context.options[0] ?? [];

    const optionsEntries = options.map(item => {
      const { name, before = [], after = [] } = item;

      const afterOffset = Number.MAX_SAFE_INTEGER - after.length;
      const entries = [
        ...Object.entries(before).map(([k, v]) => [v, +k] as const),
        [WILDCARD_OTHER, before.length] as const,
        ...Object.entries(after).map(
          ([k, v]) => [v, +k + afterOffset] as const,
        ),
      ];

      return [name, Object.fromEntries(entries)] as const;
    });

    const optionsMap = Object.fromEntries(optionsEntries);

    return {
      ImportDeclaration(node) {
        const importSource = node.source.value as string;
        const o = optionsMap[importSource];
        if (!o) {
          return;
        }

        const { specifiers } = node;
        if (specifiers.length < 2) {
          return;
        }

        const iteratee = (item: ImportSpecifier) =>
          o[item.imported.name] ?? o[WILDCARD_OTHER];

        const importedMembers = specifiers.filter(
          item => item.type === "ImportSpecifier",
        ) as ImportSpecifier[];

        if (isNonDecreasing(importedMembers, iteratee)) {
          return;
        }

        context.report({
          node,
          message: `Invalid import order for "${importSource}".`,
          fix(fixer) {
            const { sourceCode } = context;

            const orderedImports = orderBy(importedMembers, iteratee).map(
              item => sourceCode.getText(item),
            );

            return importedMembers.map((item, i) =>
              fixer.replaceText(item, orderedImports[i]),
            );
          },
        });
      },
    };
  },
} as Rule.RuleModule;
