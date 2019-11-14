#!/usr/bin/env bash

# store arguments in a special array
args=("$@")
# get number of elements
ELEMENTS=${#args[@]}

# echo each element
for (( i=0;i<$ELEMENTS;i++)); do
    echo "args[$i]: \"${args[${i}]}\""
done