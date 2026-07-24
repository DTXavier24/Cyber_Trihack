FROM ubuntu:24.04

RUN apt-get update \
    && apt-get install -y --no-install-recommends socat \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 ctf \
    && mkdir /app

COPY jit_vm /app/run
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/run /app/entrypoint.sh \
    && chown -R ctf:ctf /app

USER ctf
WORKDIR /app

EXPOSE 5000

ENTRYPOINT ["/app/entrypoint.sh"]