import moduleImportOrder from './rules/module-import-order'
import noObjectAssignThis from './rules/no-object-assign-this'
import singleImportPerLine from './rules/single-import-per-line'

export = {
  rules: {
    'module-import-order': moduleImportOrder,
    'no-object-assign-this': noObjectAssignThis,
    'single-import-per-line': singleImportPerLine,
  },
}
