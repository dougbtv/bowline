#!/bin/bash
docker exec -it mongo mongoexport --quiet --db bowline --collection releases > json/releases.json
docker exec -it mongo mongoexport --quiet --db bowline --collection users > json/users.json

