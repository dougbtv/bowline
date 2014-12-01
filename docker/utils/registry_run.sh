#!/bin/bash
MONGO_DIR=/tmp/mongodata
REGISTRY_DIR=/tmp/registry

echo "Removing ALL containers..."
docker kill $(docker ps -a -q) || true
docker rm $(docker ps -a -q) || true

echo "Starting registry server..."
# docker run -p 5000:5000 --name regserver -d -t registry
docker run -d -e GUNICORN_OPTS=[--preload] -v $REGISTRY_DIR:/registry -e SETTINGS_FLAVOR=local -e STORAGE_PATH=/registry -e SEARCH_BACKEND=sqlalchemy -p 5000:5000  --name regserver registry:latest

echo "Starting nginx ambassador..."
HOST_IP_ADDRESS=$(ifconfig | grep -a2 docker0 | grep -P "inet[^6]" | awk '{print $2}')
docker run -d --name bowline-amb --expose 8000 -e NGINX_PORT_8000_TCP=tcp://$HOST_IP_ADDRESS:8000 svendowideit/ambassador

echo "Starting nginx..."
docker run \
    -p 80:80 -p 443:443 \
    --link bowline-amb:bowline \
    --link regserver:regserver \
    -d -t dougbtv/bowline-nginx

