#!/bin/sh

# Validate args
prefix="$1"
if [ -z "$prefix" ]; then
  echo "Must supply prefix argument"
  exit 1
fi

path="$2"
if [ -z "$path" ]; then
  echo "Must supply path argument"
  exit 1
fi

mkdir -p $path
echo "$prefix $GITHUB_RUN_ID" > $path/test-file.txt
