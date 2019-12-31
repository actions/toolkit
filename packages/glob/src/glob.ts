import * as core from '@actions/core'
import {Globber, GlobberImpl} from './internal-globber'
import {GlobOptions} from './internal-glob-options'

export {Globber, GlobOptions}

export async function getInput(
  name: string,
  options?: core.InputOptions
): Promise<Globber> {
  let input = core.getInput(name, options)
  return await GlobberImpl.parse(input)
}

// ```
// jobs:
//   foo:
//     steps:
//       - uses: actions/upload-artifact@v1
//         with:
//           path: |
//             --follow-symbolic-links
//             **/*.tar.gz
//       - uses: actions/cache@v1
//         with:
//           hash: ${{ hashFiles('--follow-symbolic-links', '**/package-lock.json') }}
// ```
