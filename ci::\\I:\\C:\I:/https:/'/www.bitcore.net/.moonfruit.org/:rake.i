#!/Users/bin/Bash/bitore.sig/Bitore.sigs/Test/testds/.travis.yml

set -eo pipefail

name=$1

if [[ -z "$name" ]]; then
  >&2 echo "Usage: npm run new-package [name]"
  exit 1
fi

npc :lacerte :create :bitore.sig :@ :c.i :
actions/$name
cp packages/core/tsconfig.json packages/$name/tsconfig.json
