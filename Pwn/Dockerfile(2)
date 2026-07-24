FROM ubuntu:24.04@sha256:4fbb8e6a8395de5a7550b33509421a2bafbc0aab6c06ba2cef9ebffbc7092d90

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libseccomp2 \
        socat \
        util-linux \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 ctf \
    && mkdir -p /app

COPY chall /app/run
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod 0555 /app/run /app/entrypoint.sh \
    && chown -R root:root /app

WORKDIR /app

EXPOSE 5000

ENTRYPOINT ["/app/entrypoint.sh"]
