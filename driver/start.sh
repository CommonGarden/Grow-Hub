#!/bin/bash

echo "Starting Grow-Hub"

# Pull in latest from github
git pull

cd driver
npm install
node Grow-Hub.js
