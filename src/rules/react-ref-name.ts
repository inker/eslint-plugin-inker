// eslint-disable-next-line import/no-extraneous-dependencies
import {
  type Rule,
} from 'eslint'

export default {
  meta: {
    hasSuggestions: true,
  },

  create(context) {
    return {
      VariableDeclarator(node) {
        const {
          id,
          init,
        } = node

        if (init?.type !== 'CallExpression') {
          return
        }

        const { callee } = init
        if (callee.type !== 'Identifier' || callee.name !== 'useRef') {
          return
        }

        if (id.type !== 'Identifier') {
          return
        }

        const isValidName = id.name === 'ref' || id.name.endsWith('Ref')
        if (isValidName) {
          return
        }

        const suggestedName = `${id.name}Ref`

        const scope = context.getScope()
        const isNameTaken = scope.variables.some(variable => variable.name === suggestedName)

        type Suggest = Parameters<typeof context.report>[0]['suggest']
        const suggest: Suggest = isNameTaken
          ? undefined
          : [
            {
              desc: `Rename variable to '${suggestedName}'`,
              fix(fixer) {
                const references = context.getDeclaredVariables(node)[0]?.references ?? []
                const referenceIdentifiers = references.map(ref => ref.identifier)
                return [
                  // id,
                  ...referenceIdentifiers,
                ].map(identifier => fixer.replaceText(identifier, suggestedName))
              },
            },
          ]

        context.report({
          node: id,
          message: 'Variable names for createRef should be "ref" or end with "Ref".',
          suggest,
        })
      },

      PropertyDefinition(node) {
        const {
          key,
          value,
        } = node

        if (value?.type !== 'CallExpression') {
          return
        }

        const { callee } = value
        if (callee.type !== 'Identifier' || callee.name !== 'createRef') {
          return
        }

        if (key.type !== 'Identifier') {
          return
        }

        const isValidName = key.name === 'ref' || key.name.endsWith('Ref')
        if (isValidName) {
          return
        }

        context.report({
          node: key,
          message: 'Property names for createRef should be "ref" or end with "Ref".',
        })
      },
    }
  },
} as Rule.RuleModule
