import type {
  Rule,
} from 'eslint'

export default {
  meta: {
    fixable: 'whitespace',
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const { specifiers } = node
        if (specifiers.length < 2) {
          return
        }

        let previousImport = specifiers[0]
        for (let i = 1; i < specifiers.length; ++i) {
          const currentImport = specifiers[i]

          const isError = previousImport.type !== 'ImportDefaultSpecifier'
            && currentImport.loc!.start.line === previousImport.loc!.end.line

          if (isError) {
            context.report({
              node,
              message: 'Import members must be on separate lines',
              fix(fixer) {
                return fixer.insertTextBefore(currentImport, '\n')
              },
            })
            return
          }

          previousImport = currentImport
        }
      },
    }
  },
} as Rule.RuleModule
