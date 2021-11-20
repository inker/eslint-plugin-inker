import moduleImportOrder from './rules/module-import-order'
import noObjectAssignThis from './rules/no-object-assign-this'
import noSameLineForElements from './rules/no-same-line-for-elements'
import singleImportPerLine from './rules/single-import-per-line'

export = {
  rules: {
    'module-import-order': moduleImportOrder,
    'no-object-assign-this': noObjectAssignThis,
    'no-same-line-for-elements': noSameLineForElements,
    'single-import-per-line': singleImportPerLine,
  },
}
