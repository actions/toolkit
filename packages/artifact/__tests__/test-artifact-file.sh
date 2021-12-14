#!/bin/bash

path="$1"
expectedContent="$2"

if [ "$path" == "" ]; then
    echo "File path not provided"
    exit 1
fi

if [ "$expectedContent" == "" ]; then
    echo "Expected file contents not provided"
    exit 1
fi

if [ ! -f "$path" ]; then
    echo "Expected file $path does not exist"
    exit 1
fi

actualContent=$(cat "$path")
if [ "$expectedContent" == "_EMPTY_" ] && [ ! -s "$path" ]; then
    exit 0
elif  [ "$actualContent" != "$expectedContent" ]; then
    echo "File contents are not correct, expected $expectedContent, received $actualContent"
    exit 1
fi