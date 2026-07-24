FROM ubuntu@sha256:4f838adc7181d9039ac795a7d0aba05a9bd9ecd480d294483169c5def983b64d

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

RUN useradd -d /home/ctf -m -s /bin/bash ctf
WORKDIR /home/ctf

COPY jit_vm .
COPY flag.txt .

RUN chown -R root:root /home/ctf && \
    chmod -R 755 /home/ctf && \
    chmod 444 flag.txt

USER ctf
EXPOSE 5000

CMD ["socat", "TCP-LISTEN:5000,reuseaddr,fork", "EXEC:./jit_vm,stderr"]
