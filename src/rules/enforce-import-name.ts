import {
  type Rule,
} from 'eslint'

import {
  type Literal,
} from 'estree'

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
          if (s.type === 'ImportSpecifier') {
            const foundImportedName = importNames.find(
              o => o.imported === s.imported.name,
            )
            if (!foundImportedName) {
              return false
            }
            const suggestedName = foundImportedName.local
            return suggestedName !== s.local.name && {
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
            const foundImportedName = importNames.find(
              o => o.imported === 'default',
            )
            if (!foundImportedName) {
              return false
            }
            const suggestedName = foundImportedName.local
            return suggestedName !== s.local.name && {
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
            const foundImportedName = importNames.find(
              o => o.imported === 'namespace',
            )
            if (!foundImportedName) {
              return false
            }
            const suggestedName = foundImportedName.local
            return suggestedName !== s.local.name && {
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

      VariableDeclaration(node) {
        const {
          type,
          declarations,
        } = node

        if (type !== 'VariableDeclaration') {
          return
        }

        const { id, init } = declarations[0]
        const isRequire = init
          && init.type === 'CallExpression'
          && init.callee.type === 'Identifier'
          && init.callee.name === 'require'
        if (!isRequire) {
          return
        }

        const source = init.arguments[0] as Literal
        const foundPaths = findPaths(source.value as string)
        if (foundPaths.length === 0) {
          return
        }

        const importNames = foundPaths.flatMap(item => item.importNames)
        const issuesWithGaps = ((): (ReportDescriptor | false)[] => {
          if (id.type === 'ObjectPattern') {
            return id.properties.map(prop => {
              const { type: propType } = prop
              if (propType !== 'Property') {
                return false
              }
              const { key, value } = prop
              if (key.type !== 'Identifier' || value.type !== 'Identifier') {
                return false
              }
              const keyName = key.name
              const valueName = value.name
              const foundImportedName = importNames.find(
                o => o.imported === keyName,
              )
              if (!foundImportedName) {
                return false
              }
              const suggestedName = foundImportedName.local
              return suggestedName !== valueName && {
                node: value,
                message: `Local name should be "${suggestedName}"`,
                suggest: [
                  {
                    desc: `Rename to '${suggestedName}'`,
                    fix(fixer) {
                      const references = context.getDeclaredVariables(prop)[0]?.references ?? []
                      return [
                        fixer.replaceText(prop, `${keyName}: ${suggestedName}`),
                        ...references.map(ref => fixer.replaceText(ref.identifier, suggestedName)),
                      ]
                    },
                  },
                ],
              }
            })
          }

          if (id.type === 'Identifier') {
            const foundImportedName = importNames.find(
              o => o.imported === 'default' || o.imported === 'namespace',
            )
            if (!foundImportedName) {
              return []
            }
            const suggestedName = foundImportedName.local
            return [
              suggestedName !== id.name && {
                node: id,
                message: `Local name should be "${suggestedName}"`,
                suggest: [
                  {
                    desc: `Rename to '${suggestedName}'`,
                    fix(fixer) {
                      const references = context.getDeclaredVariables(id)[0]?.references ?? []
                      return [
                        id,
                        ...references.map(ref => ref.identifier),
                      ].map(identifier => fixer.replaceText(identifier, suggestedName))
                    },
                  },
                ],
              },
            ]
          }

          return []
        })()

        const issues = compact(issuesWithGaps)

        for (const issue of issues) {
          context.report(issue)
        }
      },
    }
  },
} as Rule.RuleModule
