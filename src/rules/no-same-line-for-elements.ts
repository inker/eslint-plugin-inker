import {
  compact,
} from 'lodash'

import type {
  Rule,
} from 'eslint'

import type {
  BaseNodeWithoutComments,
  Node,
} from 'estree'

import invokeIfFunction from '../utils/invokeIfFunction'

function findSameLineNodes<T extends Node>(nodes: readonly T[]) {
  const problematicNodes: T[] = []

  let prevNode = nodes[0]
  for (let i = 1; i < nodes.length; ++i) {
    const node = nodes[i]
    if (node.loc!.start.line === prevNode.loc!.end.line) {
      problematicNodes.push(node)
    }
    prevNode = node
  }

  return problematicNodes
}

interface HandleOptions<N extends BaseNodeWithoutComments, C extends Node> {
  node: N,
  message: string,
  children: C[] | (() => C[]),
}

const getHandler = (context: Rule.RuleContext) =>
  <N extends BaseNodeWithoutComments, C extends Node>(options: HandleOptions<N, C>) => {
    const { loc } = options.node
    if (!loc || loc.start.line === loc.end.line) {
      return
    }

    const children = invokeIfFunction(options.children)
    if (children.length < 2) {
      return
    }

    const isFirstItemSameLine = children[0].loc?.start.line === loc.start.line
    // eslint-disable-next-line unicorn/prefer-at
    const isLastItemSameLine = children[children.length - 1].loc?.end.line === loc.end.line
    if (isFirstItemSameLine || isLastItemSameLine) {
      return
    }

    const problematicNodes = findSameLineNodes(children)

    const { message } = options
    for (const problematicNode of problematicNodes) {
      context.report({
        node: problematicNode,
        message,
        fix(fixer) {
          return fixer.insertTextBefore(problematicNode, '\n')
        },
      })
    }
  }

export default {
  meta: {
    fixable: 'whitespace',
  },

  create(context) {
    const handle = getHandler(context)

    return {
      FunctionDeclaration(node) {
        handle({
          node,
          message: 'Function parameters must be on separate lines',
          children: node.params,
        })
      },

      CallExpression(node) {
        handle({
          node,
          message: 'Function arguments must be on separate lines',
          children: node.arguments,
        })
      },

      ArrayExpression(node) {
        handle({
          node,
          message: 'Array elements must be on separate lines',
          children: () => compact(node.elements),
        })
      },

      ArrayPattern(node) {
        handle({
          node,
          message: 'Variables from array destructuring must be on separate lines',
          children: () => compact(node.elements),
        })
      },

      ObjectExpression(node) {
        handle({
          node,
          message: 'Object properties must be on separate lines',
          children: node.properties,
        })
      },

      ObjectPattern(node) {
        handle({
          node,
          message: 'Variables from object destructuring must be on separate lines',
          children: node.properties,
        })
      },
    }
  },
} as Rule.RuleModule