#!/bin/bash
MONGO_DIR=/tmp/mongodata
REGISTRY_DIR=/tmp/registry

echo "Removing ALL containers..."
docker kill $(docker ps -a -q) || true
docker rm $(docker ps -a -q) || true

# echo "Starting docker-in-docker"
# docker run \
#  --privileged \
#  --name dind \
#  -d -p 4444:4444 \
#  -e PORT=4444 \
#  -t jpetazzo/dind:latest

echo "Starting registry server..."
# docker run -p 5000:5000 --name regserver -d -t registry
docker run -d -v $REGISTRY_DIR:/registry -e SETTINGS_FLAVOR=local -e STORAGE_PATH=/registry -e SEARCH_BACKEND=sqlalchemy -p 5000:5000  --name regserver registry:latest

echo "Starting mongodb..."
docker run -d -p 27017:27017 -v $MONGO_DIR:/data/db --name mongodb dockerfile/mongodb

echo "Starting bowline..."
docker run -p 8000:8000 -v /var/run/docker.sock:/var/run/docker.sock -v /bowline/ --name bowline -d -t dougbtv/bowline
# --link dind:dind 

echo "Starting nginx..."
docker run -p 80:80 -p 443:443 --volumes-from bowline --link regserver:regserver -d -t dougbtv/bowline-nginx

