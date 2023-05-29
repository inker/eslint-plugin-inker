import type {
  Rule,
} from 'eslint'

import {
  compact,
} from 'lodash'

interface BaseImportName {
  local: string,
  message: string,
}

interface ImportNameDefault extends BaseImportName {
  imported: 'default',
}

interface ImportNameNamespace extends BaseImportName {
  imported: 'namespace',
}

interface ImportNameMember extends BaseImportName {
  imported: string,
}

type ImportNameObj = ImportNameMember | ImportNameDefault | ImportNameNamespace

interface Path {
  name: string,
  importNames: readonly ImportNameObj[],
}

interface Options {
  paths: readonly Path[],
}

export default {
  meta: {
    schema: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              importNames: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                    },
                    imported: {
                      type: 'string',
                    },
                    local: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  create(context) {
    const options: Options = context.options[0] ?? {}

    return {
      ImportDeclaration(node) {
        const {
          source,
          specifiers,
        } = node

        const foundPaths = options.paths.filter(item => item.name === source.value)
        if (foundPaths.length === 0) {
          return
        }

        const importNames = foundPaths.flatMap(item => item.importNames)
        const issuesWithGaps = specifiers.map(s => {
          const importNamesNotMatchingOptions = importNames.filter(
            o => o.local !== s.local.name,
          )

          if (s.type === 'ImportSpecifier') {
            const foundImportedName = importNamesNotMatchingOptions.find(
              o => o.imported === s.imported.name,
            ) as ImportNameMember

            return foundImportedName && {
              node: s.local,
              message: foundImportedName.message,
            }
          }

          if (s.type === 'ImportDefaultSpecifier') {
            const foundImportedName = importNamesNotMatchingOptions.find(
              o => o.imported === 'default',
            ) as ImportNameDefault

            return foundImportedName && {
              node: s.local,
              message: foundImportedName.message,
            }
          }

          if (s.type === 'ImportNamespaceSpecifier') {
            const foundImportedName = importNamesNotMatchingOptions.find(
              o => o.imported === 'namespace',
            ) as ImportNameNamespace

            return foundImportedName && {
              node: s.local,
              message: foundImportedName.message,
            }
          }

          return undefined
        })
        const issues = compact(issuesWithGaps)

        for (const issue of issues) {
          context.report(issue)
        }
      },
    }
  },
} as Rule.RuleModule
