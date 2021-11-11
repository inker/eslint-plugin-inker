import moduleImportOrder from './rules/module-import-order'
import noObjectAssignThis from './rules/no-object-assign-this'
import noSameLineIfCurlyNewline from './rules/no-same-line-if-curly-newline'
import singleImportPerLine from './rules/single-import-per-line'

export = {
  rules: {
    'module-import-order': moduleImportOrder,
    'no-object-assign-this': noObjectAssignThis,
    'no-same-line-if-curly-newline': noSameLineIfCurlyNewline,
    'single-import-per-line': singleImportPerLine,
  },
}
