#!/bin/bash
docker kill $(docker ps -a -q) || true
docker rm $(docker ps -a -q) || true
