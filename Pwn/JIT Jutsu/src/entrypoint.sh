#!/bin/sh
set -eu

# Write the flag at runtime from the env var, falling back to a placeholder
echo "${GZCTF_FLAG:-TriHack26{placeholder_flag_not_set}}" > /app/flag.txt
chmod 444 /app/flag.txt

exec socat \
    TCP-LISTEN:5000,reuseaddr,fork \
    EXEC:"/app/run"