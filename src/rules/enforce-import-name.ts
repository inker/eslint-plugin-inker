import type {
  Rule,
} from 'eslint'

import micromatch from 'micromatch'

import type {
  JSONSchema4,
} from 'json-schema'

import {
  compact,
} from 'lodash'

interface BaseImportName {
  local: string,
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

interface BasePath {
  importNames: readonly ImportNameObj[],
}

interface PathWithName extends BasePath {
  name: string,
}

interface PathWithPattern extends BasePath {
  pattern: string | readonly string[],
}

type Path = PathWithName | PathWithPattern

interface Options {
  paths: readonly Path[],
}

const importNamesSchema: JSONSchema4 = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      imported: {
        type: 'string',
      },
      local: {
        type: 'string',
      },
    },
  },
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
            oneOf: [
              {
                properties: {
                  name: {
                    type: 'string',
                  },
                  importNames: importNamesSchema,
                },
              },
              {
                properties: {
                  pattern: {
                    oneOf: [
                      {
                        type: 'string',
                      },
                      {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                      },
                    ],
                  },
                  importNames: importNamesSchema,
                },
              },
            ],
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

        const foundPaths = options.paths.filter(
          item => 'name' in item
            ? item.name === source.value
            : micromatch.isMatch(source.value as string, item.pattern),
        )
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
              message: `Use the following local name instead: "${foundImportedName.local}"`,
            }
          }

          if (s.type === 'ImportDefaultSpecifier') {
            const foundImportedName = importNamesNotMatchingOptions.find(
              o => o.imported === 'default',
            ) as ImportNameDefault

            return foundImportedName && {
              node: s.local,
              message: `Use the following local name instead: "${foundImportedName.local}"`,
            }
          }

          if (s.type === 'ImportNamespaceSpecifier') {
            const foundImportedName = importNamesNotMatchingOptions.find(
              o => o.imported === 'namespace',
            ) as ImportNameNamespace

            return foundImportedName && {
              node: s.local,
              message: `Use the following local name instead: "${foundImportedName.local}"`,
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
