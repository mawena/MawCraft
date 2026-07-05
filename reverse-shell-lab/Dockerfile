# Image minimale avec les outils du lab : netcat (le shell), tcpdump et ss
# (l'observation/détection côté défense).
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
        netcat-openbsd \
        tcpdump \
        iproute2 \
        procps \
        curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /root
