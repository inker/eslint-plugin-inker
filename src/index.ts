import moduleImportOrder from './rules/module-import-order'
import noObjectAssignThis from './rules/no-object-assign-this'
import noSameLineForElements from './rules/no-same-line-for-elements'
import noThisBrackets from './rules/no-this-brackets'
import singleImportPerLine from './rules/single-import-per-line'

export = {
  rules: {
    'module-import-order': moduleImportOrder,
    'no-object-assign-this': noObjectAssignThis,
    'no-same-line-for-elements': noSameLineForElements,
    'no-this-brackets': noThisBrackets,
    'single-import-per-line': singleImportPerLine,
  },
}
