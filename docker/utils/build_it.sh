#!/bin/bash
MONGO_DIR=/tmp/mongodata
EXAMPLE_DATA=$(pwd)/../../db/

# ------------------ Basic requirements.

echo "Pulling required docker containers...."
sudo docker pull library/mongo:latest
sudo docker pull jpetazzo/dind:latest
sudo docker pull nginx:latest
sudo docker pull svendowideit/ambassador:latest

echo "Copying sample config 
to add to Bowline container"
cp ../../includes/example.config.json ../bowline/config.json

echo "Building bowline specific docker containers..."
sudo docker build -t dougbtv/bowline ../bowline/.
sudo docker build -t dougbtv/bowline-nginx ../nginx/.

# ------------------- Preload Mongo data.

echo "Removing ALL containers..."
sudo docker kill $(docker ps -a -q)
sudo docker rm $(docker ps -a -q)

echo "Running mongo for preload..."
rm -Rf $MONGO_DIR
mkdir $MONGO_DIR
sudo docker run -d -p 27017:27017 -v $MONGO_DIR:/data/db --name temp_mongo library/mongo

CMD_RELEASE_IMPORT=""
CMD_USER_IMPORT=""

echo "Starting mongo client"
sudo docker run -it --rm --link temp_mongo:mongo -v $EXAMPLE_DATA:/exampledata/ library/mongo \
    bash -c 'mongoimport --host mongo --db bowline --collection releases --file /exampledata/json/releases.json; mongoimport --host mongo --db bowline --collection users --file /exampledata/json/users.json'

echo "Cleaning up all containers...."
sudo docker kill $(docker ps -a -q) || true
sudo docker rm $(docker ps -a -q) || true
