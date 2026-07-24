#!/bin/sh
set -eu

if [ "${GZCTF_FLAG:-}" ]; then
    printf '%s\n' "$GZCTF_FLAG" > /flag
else
    printf '%s\n' 'TriHack26{placeholder_flag_not_set}' > /flag
fi
chmod 444 /flag

exec socat \
    TCP-LISTEN:5000,reuseaddr,fork \
    EXEC:"/app/run",stderr
