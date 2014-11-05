#!/bin/bash

echo "Removing containers..."
docker kill $(docker ps -a -q) || true
docker rm $(docker ps -a -q) || true

echo "Starting registry server..."
docker run -p 5000:5000 --name regserver -d -t registry

echo "Starting nginx..."
docker run -p 80:80 -p 443:443 --link regserver:regserver -i -t dougbtv/bowline-nginx
