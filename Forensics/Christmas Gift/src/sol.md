Layer 1 → unzip
bashunzip christmas_gift.zip
# You get: msg.txt  +  gift.tar.gz
cat msg.txt

Layer 2 → tar + gzip
bashtar -xzf gift.tar.gz
# You get: msg.txt  +  gift.tar.lz4
cat msg.txt

Layer 3 → tar + lz4
bashtar lz4 -d gift.tar.lz4 -c | tar -xf -
# You get: msg.txt  +  gift.tar.lz
cat msg.txt

Layer 4 → tar + lzip
bashtar --lzip -xf gift.tar.lz
# You get: msg.txt  +  gift.7z
cat msg.txt

⭐ Layer 5 → 7z — FLAG PART 1 HERE
bash7z x gift.7z
# You get: msg.txt  +  flag.txt  +  gift.tar.zst
cat flag.txt
# >>> TriHack26{S4NTA_KN0W$
cat msg.txt

Layer 6 → tar + zstd
bashtar --zstd -xf gift.tar.zst
# You get: msg.txt  +  gift.tar.lzma
cat msg.txt

Layer 7 → tar + lzma
bashtar --lzma -xf gift.tar.lzma
# You get: msg.txt  +  gift.tar.xz
cat msg.txt

Layer 8 → tar + xz
bashtar -xJf gift.tar.xz
# You get: msg.txt  +  gift.tar.bz2
cat msg.txt

Layer 9 → tar + bzip2
bashtar -xjf gift.tar.bz2
# You get: msg.txt  +  gift.zip
cat msg.txt

🏁 Layer 10 → unzip — FLAG PART 2 HERE
bashunzip gift.zip
# You get: msg.txt  +  flag.txt
cat flag.txt
# >>> _WH4T_Y0U_D1D}
