import { type Rule } from "eslint";
import { capitalize } from "lodash";

const HEADER_RE = /^[A-Z]+[a-z]*(-[A-Z]+[a-z]*)*$/;

const correctHeaderMap = {
  etag: "ETag",
} satisfies Record<Lowercase<string>, string> as Record<string, string>;

const upperCaseParts = new Set([
  "CH",
  "ID",
  "UA",
  "XSS",
] satisfies Uppercase<string>[]) as Set<string>;

export default {
  meta: {
    type: "layout",
    docs: {
      description: "Ensure req.header() use case-sensitive headers",
      recommended: false,
    },
    fixable: "code",
    schema: [],
  },

  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "req" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "header" &&
          node.arguments[0]?.type === "Literal"
        ) {
          const arg = node.arguments[0];
          const argValue = arg.value;
          if (typeof argValue !== "string") {
            context.report({
              node: arg,
              message: "Header value should be a string",
            });
            return;
          }

          if (!HEADER_RE.test(argValue)) {
            const lowerCaseHeader = argValue.toLowerCase();
            const fixedValue =
              correctHeaderMap[lowerCaseHeader] ??
              lowerCaseHeader
                .split("-")
                .map(part => {
                  const uc = part.toUpperCase();
                  return upperCaseParts.has(uc) ? uc : capitalize(part);
                })
                .join("-");
            context.report({
              node: arg,
              message: `Use "${fixedValue}" instead of "${argValue}"`,
              fix: fixer => {
                const quote = arg.raw![0];
                return fixer.replaceText(arg, `${quote}${fixedValue}${quote}`);
              },
            });
          }
        }
      },
    };
  },
} as Rule.RuleModule;
