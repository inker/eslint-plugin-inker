// eslint-disable-next-line import/no-extraneous-dependencies
import {
  type Rule,
} from 'eslint'

export default {
  meta: {
    hasSuggestions: true,
  },

  create(context) {
    const isVariableNameTaken = (name: string) => {
      const scope = context.getScope()
      return scope.variables.some(variable => variable.name === name)
    }

    const getVariableUsages = (name: string) => {
      const scope = context.getScope()
      return scope.references.filter(ref => ref.identifier.name === name)
    }

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

        type Suggest = Parameters<typeof context.report>[0]['suggest']

        const suggest: Suggest = isVariableNameTaken(suggestedName)
          ? undefined
          : [
            {
              desc: `Rename variable to '${suggestedName}'`,
              fix(fixer) {
                const usages = getVariableUsages(id.name)
                const referenceIdentifiers = usages.map(ref => ref.identifier)
                return [
                  id,
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
