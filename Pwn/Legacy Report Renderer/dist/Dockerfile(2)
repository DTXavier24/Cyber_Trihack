FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends socat \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app

COPY chall /app/run
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod 755 /app/run /app/entrypoint.sh \
    && chown -R root:root /app
WORKDIR /app

EXPOSE 5000

ENTRYPOINT ["/app/entrypoint.sh"]
