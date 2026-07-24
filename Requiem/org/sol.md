step 1: zsteg project_eliphas.png (tool like zsteg is required)
step 2: echo "VHJpSGFjazI2e1IzMTNAJDM=" | base64 -d
step 3: binwalk project_eliphas.png
step 4: binwalk -Me project_eliphas.png
step 5: stegolsb wavsteg -r -i umbrella_transmission.wav -o out.txt -b 6 -n 1
step 6: cat out.txt