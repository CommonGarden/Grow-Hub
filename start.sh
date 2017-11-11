#!/bin/bash

echo "Starting Grow-Hub"

# Pull in latest from github
git pull

cd driver

# npm install
npm install

# start script
node Grow-Hub.js