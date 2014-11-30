#!/bin/bash
MONGO_DIR=/tmp/mongodata
EXAMPLE_DATA=$(pwd)/../../db/

# ------------------ Basic requirements.

echo "Pulling required docker containers...."
docker pull dockerfile/mongodb:latest
docker pull jpetazzo/dind:latest
docker pull nginx:latest
docker pull svendowideit/ambassador:latest

echo "Copying sample config 
to add to Bowline container"
cp ../../includes/example.config.json ../bowline/config.json

echo "Building bowline specific docker containers..."
docker build -t dougbtv/bowline ../bowline/.
docker build -t dougbtv/bowline-nginx ../nginx/.

# ------------------- Preload Mongo data.

echo "Removing ALL containers..."
docker kill $(docker ps -a -q)
docker rm $(docker ps -a -q)

echo "Running mongo for preload..."
rm -Rf $MONGO_DIR
mkdir $MONGO_DIR
docker run -d -p 27017:27017 -v $MONGO_DIR/:/data/db --name temp_mongo dockerfile/mongodb

CMD_RELEASE_IMPORT=""
CMD_USER_IMPORT=""

echo "Starting mongo client"
docker run -it --rm --link temp_mongo:mongodb -v $EXAMPLE_DATA:/exampledata/ dockerfile/mongodb \
    bash -c 'mongoimport --host mongodb --db bowline --collection releases --file /exampledata/json/releases.json; mongoimport --host mongodb --db bowline --collection users --file /exampledata/json/users.json'

echo "Cleaning up all containers...."
docker kill $(docker ps -a -q) || true
docker rm $(docker ps -a -q) || true
