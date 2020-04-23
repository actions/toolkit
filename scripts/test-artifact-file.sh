#!/bin/sh

path=$1
content=$2

if [ "$path" == "" ]; then
    echo "File path not provided"
    exit 1
fi

if [ "$content" == "" ]; then
    echo "Expected file contents not provided"
    exit 1
fi

if [ ! -f "$path" ]; then
    echo "Expected file $path does not exist"
    exit 1
fi

fileContent=$(cat $path)
if [ "$content" != "$fileContent" ];then
    echo "File contents are not correct, expected $content, recieved $fileContent"
    exit 1
fi