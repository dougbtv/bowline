#!/bin/bash
docker exec -it mongo mongoexport --db bowline --collection releases > json/releases.json
docker exec -it mongo mongoexport --db bowline --collection users > json/users.json

