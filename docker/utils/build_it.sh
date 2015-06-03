#!/bin/bash
MONGO_DIR=/tmp/mongodata
EXAMPLE_DATA=$(pwd)/../../db/

# ------------------ Basic requirements.

echo "Pulling required docker containers...."
docker pull library/mongo:latest
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
docker run -d --privileged -v $MONGO_DIR:/data/db --name temp_mongo library/mongo

CMD_RELEASE_IMPORT=""
CMD_USER_IMPORT=""

echo "Starting mongo client"
docker run -it --rm --link temp_mongo:mongo -v $EXAMPLE_DATA:/exampledata/ library/mongo \
    bash -c 'mongoimport --host mongo --db bowline --collection releases --file /exampledata/json/releases.json; mongoimport --host mongo --db bowline --collection users --file /exampledata/json/users.json'

echo "Cleaning up all containers...."
docker kill $(docker ps -a -q) || true
docker rm $(docker ps -a -q) || true
