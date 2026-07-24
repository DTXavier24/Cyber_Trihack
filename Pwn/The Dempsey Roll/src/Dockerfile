FROM ubuntu:24.04@sha256:4f1db91d9560cf107b5832c0761364ec64f46777aa4ec637cca3008f287c975e

RUN apt-get update \
    && apt-get install -y --no-install-recommends socat util-linux \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 ctf \
    && mkdir -p /app

COPY dempsey_roll /app/run
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod 0555 /app/run /app/entrypoint.sh \
    && chown -R root:root /app

WORKDIR /app

EXPOSE 5000

ENTRYPOINT ["/app/entrypoint.sh"]
