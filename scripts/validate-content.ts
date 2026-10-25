import { bundledContentDir } from '../src/content/store.js'
import { validateContentTree } from '../src/content/validate.js'

const errors = await validateContentTree(bundledContentDir())
if (errors.length > 0) {
  for (const error of errors) console.error(error)
  process.exit(1)
}
console.log('content articles validated')
