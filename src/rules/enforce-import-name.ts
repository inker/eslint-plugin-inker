import {
  type Rule,
} from 'eslint'

import { minimatch } from 'minimatch'

import {
  type JSONSchema4,
} from 'json-schema'

import {
  castArray,
  compact,
} from 'lodash'

interface ImportNameObj {
  imported: string,
  local: string,
}

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
    required: [
      'imported',
      'local',
    ],
  },
}

export default {
  meta: {
    schema: [
      {
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
                  required: [
                    'name',
                    'importNames',
                  ],
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
                  required: [
                    'pattern',
                    'importNames',
                  ],
                },
              ],
            },
          },
        },
      },
    ],
    hasSuggestions: true,
  },

  create(context) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const options: Options = context.options[0] ?? {}

    type ReportDescriptor = Parameters<typeof context.report>[0]

    const findPaths = (name: string) =>
      options.paths.filter(item => {
        if ('name' in item) {
          return item.name === name
        }
        const patterns = castArray(item.pattern)
        return patterns.some(pattern => minimatch(name, pattern))
      })

    return {
      ImportDeclaration(node) {
        const {
          source,
          specifiers,
        } = node

        const foundPaths = findPaths(source.value as string)
        if (foundPaths.length === 0) {
          return
        }

        const importNames = foundPaths.flatMap(item => item.importNames)
        const issuesWithGaps = specifiers.map((s): ReportDescriptor | false => {
          const importNamesNotMatchingOptions = importNames.filter(
            o => o.local !== s.local.name,
          )

          if (s.type === 'ImportSpecifier') {
            const foundImportedName = importNamesNotMatchingOptions.find(
              o => o.imported === s.imported.name,
            )
            const suggestedName = foundImportedName?.local
            return suggestedName !== undefined && {
              node: s.local,
              message: `Local name should be "${suggestedName}"`,
              suggest: [
                {
                  desc: `Rename to '${suggestedName}'`,
                  fix(fixer) {
                    const references = context.getDeclaredVariables(s)[0]?.references ?? []
                    return [
                      fixer.replaceText(s, `${s.imported.name} as ${suggestedName}`),
                      ...references.map(ref => fixer.replaceText(ref.identifier, suggestedName)),
                    ]
                  },
                },
              ],
            }
          }

          if (s.type === 'ImportDefaultSpecifier') {
            const foundImportedName = importNamesNotMatchingOptions.find(
              o => o.imported === 'default',
            )
            const suggestedName = foundImportedName?.local
            return suggestedName !== undefined && {
              node: s.local,
              message: `Local name should be "${suggestedName}"`,
              suggest: [
                {
                  desc: `Rename to '${suggestedName}'`,
                  fix(fixer) {
                    const references = context.getDeclaredVariables(s)[0]?.references ?? []
                    return [
                      s.local,
                      ...references.map(ref => ref.identifier),
                    ].map(identifier => fixer.replaceText(identifier, suggestedName))
                  },
                },
              ],
            }
          }

          if (s.type === 'ImportNamespaceSpecifier') {
            const foundImportedName = importNamesNotMatchingOptions.find(
              o => o.imported === 'namespace',
            )
            const suggestedName = foundImportedName?.local
            return suggestedName !== undefined && {
              node: s.local,
              message: `Local name should be "${suggestedName}"`,
              suggest: [
                {
                  desc: `Rename to '${suggestedName}'`,
                  fix(fixer) {
                    const references = context.getDeclaredVariables(s)[0]?.references ?? []
                    return [
                      s.local,
                      ...references.map(ref => ref.identifier),
                    ].map(identifier => fixer.replaceText(identifier, suggestedName))
                  },
                },
              ],
            }
          }

          return false
        })
        const issues = compact(issuesWithGaps)

        for (const issue of issues) {
          context.report(issue)
        }
      },
    }
  },
} as Rule.RuleModule
