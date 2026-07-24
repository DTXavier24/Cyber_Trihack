#!/bin/sh
set -eu

printf '%s\n' "${GZCTF_FLAG:-TriHack26{placeholder_flag_not_set}}" > /flag
chmod 0444 /flag
chown root:root /flag

exec setpriv \
    --reuid=10001 \
    --regid=10001 \
    --init-groups \
    --inh-caps=-all \
    socat TCP-LISTEN:5000,reuseaddr,fork EXEC:/app/run,stderr
