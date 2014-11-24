#!/bin/bash

echo "Removing containers..."
docker kill $(docker ps -a -q) || true
docker rm $(docker ps -a -q) || true

echo "Starting registry server..."
# docker run -p 5000:5000 --name regserver -d -t registry
docker run -d -v /tmp/registry:/registry -e SETTINGS_FLAVOR=local -e STORAGE_PATH=/registry -e SEARCH_BACKEND=sqlalchemy -p 5000:5000  --name regserver registry:latest

echo "Starting nginx..."
docker run -p 80:80 -p 443:443 --link regserver:regserver -i -t dougbtv/bowline-nginx
