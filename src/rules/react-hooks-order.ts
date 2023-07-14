// eslint-disable-next-line import/no-extraneous-dependencies
import {
  type Rule,
} from 'eslint'

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
  },

  create(context) {
    const { order } = context.options[0] as Options
    const indexByHook = new Map(order.map((hook, i) => [hook, i] as const))

    return {
      BlockStatement(node) {
        const previousHooks = new Set<string>()

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

            const hookIdx = indexByHook.get(name) ?? Number.MAX_SAFE_INTEGER

            for (const prevHook of previousHooks) {
              const prevHookIdx = indexByHook.get(prevHook) ?? Number.MAX_SAFE_INTEGER
              if (hookIdx < prevHookIdx) {
                context.report({
                  node: statement,
                  message: `'${name}' should be declared before '${prevHook}'`,
                })
                return
              }
            }

            previousHooks.add(name)
          }
        }
      },
    }
  },
} as Rule.RuleModule
