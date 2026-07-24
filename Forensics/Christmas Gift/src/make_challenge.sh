#!/bin/bash

set -e

rm -rf _xmas_build
mkdir -p _xmas_build
cd _xmas_build

# Helper for tar compress fallback
tar_compress() {
    local flag="$1"; local out="$2"; shift 2
    if tar "$flag" -cf "$out" "$@" 2>/dev/null; then
        return 0
    fi
    local tool="${flag/--/}"
    local tmp_tar="${out}.tmp"
    tar -cf "$tmp_tar" "$@"
    "$tool" < "$tmp_tar" > "$out"
    rm "$tmp_tar"
}

# LAYER 10
echo "Final unwrap" > msg.txt
printf '_WH4T_Y0U_D1D}' > flag.txt
zip gift.zip msg.txt flag.txt >/dev/null
rm msg.txt flag.txt

# LAYER 9
echo "Almost there..." > msg.txt
tar -cjf gift.tar.bz2 msg.txt gift.zip
rm msg.txt gift.zip

# LAYER 8
echo "Keep going..." > msg.txt
tar -cJf gift.tar.xz msg.txt gift.tar.bz2
rm msg.txt gift.tar.bz2

# LAYER 7
echo "Santa is watching..." > msg.txt
tar_compress --lzma gift.tar.lzma msg.txt gift.tar.xz
rm msg.txt gift.tar.xz

# LAYER 6
echo "Not much left..." > msg.txt
tar_compress --zstd gift.tar.zst msg.txt gift.tar.lzma
rm msg.txt gift.tar.lzma

# LAYER 5 (FLAG PART 1)
echo "Halfway there..." > msg.txt
printf 'TriHack26{S4NTA_KN0W$' > flag.txt
7z a gift.7z msg.txt flag.txt gift.tar.zst >/dev/null
rm msg.txt flag.txt gift.tar.zst

# LAYER 4
echo "Keep unwrapping..." > msg.txt
tar_compress --lzip gift.tar.lz msg.txt gift.7z
rm msg.txt gift.7z

# LAYER 3
echo "Getting closer..." > msg.txt
tar_compress --lz4 gift.tar.lz4 msg.txt gift.tar.lz
rm msg.txt gift.tar.lz

# LAYER 2
echo "Almost there..." > msg.txt
tar -czf gift.tar.gz msg.txt gift.tar.lz4
rm msg.txt gift.tar.lz4

# LAYER 1 (OUTERMOST)
echo "Start unwrapping..." > msg.txt
zip ../christmas_gift.zip msg.txt gift.tar.gz >/dev/null

cd ..
rm -rf _xmas_build
``
