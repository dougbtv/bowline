#!/bin/bash
docker images | grep -i "none" | awk '{print $3}' | xargs docker rmi
