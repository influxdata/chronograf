#!/bin/bash

# Print help message:
# Usage: rename-to-tsx [option]
#   -h (help): Print this help message.
#   -a (all): Rename files ending in .js and .jsx to .tsx.
#   -r (respectively): Rename files ending in .js to .ts and .jsx to .tsx.
display_help () {
  space='  '
  msg="Usage: $(basename $0) [option]\n"
  msg="$msg$space-h (help): Print this help message.\n"
  msg="$msg$space-a (all): Rename files ending in .js and .jsx to .tsx.\n"
  msg="$msg$space-r (respectively): Rename files ending in .js to .ts and .jsx to .tsx."
  echo -e $msg
  exit 0
}

# Find .js and .jsx files in current directory (ignore node_modules)
# and execute script given as first argument (`$1`).
rename_with () {
  find . -type f \( -iname '*.js' -or -iname '*.jsx' \) \
    -not -wholename '*node_modules*' -exec sh -c "$1" _ {} \;
}

# Rename both .js and .jsx to .tsx.
rename_all () {
  rename_with 'mv "$1" "${1%.js*}.tsx"'
  exit 0
}

# Rename both .js and .jsx to .ts and .tsx, respectively.
rename_respectively () {
  rename_with 'mv "$1" `sed -re "s/\.js(x)?$/\.ts\1/g" <<< "$1"`'
  exit 0
}

# Parse check for -h, -r and -a script options.
# I've decided to run all (-a) and respectively (-r) only
# when argument is given, to avoid accidental runs.
OPTIND=1
while getopts "hra" opt; do
  case "$opt" in
    h) display_help ;;
    r) rename_respectively ;;
    a) rename_all ;;
  esac
done
shift $((OPTIND-1)); [ "$1" = "--" ] && shift

# Since none of options were choosen, display usage instructions.
display_help