FROM python:bookworm

# Copy Web UI
COPY src/ /app/
WORKDIR /app
RUN apt-get update -y && apt-get install -y wireguard net-tools iproute2 iptables
RUN chmod u+x entrypoint.sh
RUN chmod u+x wgd.sh
RUN ./wgd.sh install
RUN mkdir -p config
ENV CONFIGURATION_PATH=config
ENV IN_DOCKER=1

WORKDIR /app
CMD ["/app/entrypoint.sh"]