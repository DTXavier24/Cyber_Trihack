FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends socat \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 ctf

WORKDIR /app

COPY --chown=ctf:ctf service.py /app/service.py
COPY --chown=ctf:ctf run.sh /app/run.sh

RUN chmod 0555 /app/service.py /app/run.sh

USER ctf

EXPOSE 5000

ENTRYPOINT ["/app/run.sh"]