import type {
  Rule,
} from 'eslint'

import type {
  ObjectExpression,
  ObjectPattern,
} from 'estree'

type ObjectNode = ObjectExpression | ObjectPattern
type ObjectNodeProperty = ObjectNode['properties'][0]

function findProblematicNodes(
  node: ObjectNode,
  onFind: (problematicNode: ObjectNodeProperty) => void,
) {
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
      onFind(currentProp)
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
        findProblematicNodes(node, (problematicNode) => {
          context.report({
            node: problematicNode,
            message: 'Object properties must be on separate lines',
            fix(fixer) {
              return fixer.insertTextBefore(problematicNode, '\n')
            },
          })
        })
      },

      ObjectPattern(node) {
        findProblematicNodes(node, (problematicNode) => {
          context.report({
            node: problematicNode,
            message: 'Variables from object destructuring must be on separate lines',
            fix(fixer) {
              return fixer.insertTextBefore(problematicNode, '\n')
            },
          })
        })
      },
    }
  },
} as Rule.RuleModule
