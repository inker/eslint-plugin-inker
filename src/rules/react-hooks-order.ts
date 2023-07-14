// eslint-disable-next-line import/no-extraneous-dependencies
import {
  type Rule,
} from 'eslint'

// eslint-disable-next-line import/no-extraneous-dependencies
import {
  type VariableDeclaration,
} from 'estree'

interface Options {
  order: readonly string[],
}

export default {
  meta: {
    schema: [
      {
        type: 'object',
        properties: {
          order: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
    ],
    hasSuggestions: true,
  },

  create(context) {
    const { order } = context.options[0] as Options

    const indexByHook = new Map(order.map((hook, i) => [hook, i] as const))

    const getHookIndex = (name: string) =>
      indexByHook.get(name) ?? Number.MAX_SAFE_INTEGER

    return {
      BlockStatement(node) {
        const previousHooks = new Map<string, VariableDeclaration>()

        for (const statement of node.body) {
          if (statement.type !== 'VariableDeclaration') {
            continue
          }

          for (const declarator of statement.declarations) {
            if (declarator.type !== 'VariableDeclarator') {
              continue
            }

            const { init } = declarator
            if (!init || init.type !== 'CallExpression') {
              continue
            }

            const { callee } = init
            if (callee.type !== 'Identifier') {
              continue
            }

            const { name } = callee
            if (!name.startsWith('use')) {
              continue
            }

            const hookIdx = getHookIndex(name)

            for (const [prevHookName, prevHookNode] of previousHooks) {
              const prevHookIdx = getHookIndex(prevHookName)
              if (hookIdx < prevHookIdx) {
                context.report({
                  node: statement,
                  message: `'${name}' should be declared before '${prevHookName}'`,
                  suggest: [
                    {
                      desc: `Move before first '${prevHookName}'`,
                      fix(fixer) {
                        const { sourceCode } = context

                        const statementText = sourceCode.getText(statement)
                        const prevHookNodeIndentation = prevHookNode.loc?.start.column ?? 0
                        const indentation = ' '.repeat(prevHookNodeIndentation)
                        return [
                          fixer.remove(statement),
                          fixer.insertTextBefore(prevHookNode, `${statementText};\n${indentation}`),
                        ]
                      },
                    },
                  ],
                })
                return
              }
            }

            // TODO: replace with "upsert" once it's available
            if (!previousHooks.has(name)) {
              previousHooks.set(name, statement)
            }
          }
        }
      },
    }
  },
} as Rule.RuleModule
