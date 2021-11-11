import type {
  Rule,
} from 'eslint'

import type {
  ObjectExpression,
  ObjectPattern,
} from 'estree'

function findProblematicNode(node: ObjectExpression | ObjectPattern) {
  if (node.loc!.start.line === node.loc?.end.line) {
    return
  }

  const { properties } = node
  if (properties.length < 2) {
    return
  }

  let prop = properties[0]
  for (let i = 1; i < properties.length; ++i) {
    const currentProp = properties[i]

    if (currentProp.loc!.start.line === prop.loc!.end.line) {
      return currentProp
    }

    prop = currentProp
  }
}

export default {
  meta: {
    fixable: 'whitespace',
  },

  create(context) {
    return {
      ObjectExpression(node) {
        const problematicNode = findProblematicNode(node)
        if (!problematicNode) {
          return
        }

        context.report({
          node,
          message: 'Object properties must be on separate lines',
          fix(fixer) {
            return fixer.insertTextBefore(problematicNode, '\n')
          },
        })
      },

      ObjectPattern(node) {
        const problematicNode = findProblematicNode(node)
        if (!problematicNode) {
          return
        }

        context.report({
          node,
          message: 'Variables from object destructuring must be on separate lines',
          fix(fixer) {
            return fixer.insertTextBefore(problematicNode, '\n')
          },
        })
      },
    }
  },
} as Rule.RuleModule
