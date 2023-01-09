#!/bin/sh
sed -i "s/__TFS_BUILD_NUMBER__/$tfs_build_number/g" kubernetes/*
echo "npm i --no-save"
npm i --no-save
echo "npm run deploy:integration"
npm run deploy:integration
echo "creating invoiz-dr.deltra.de:5000/invoiz/web:integration"
docker build --no-cache -q -t invoiz-dr.deltra.de:5000/invoiz/web:integration .
docker push invoiz-dr.deltra.de:5000/invoiz/web:integration
docker rmi invoiz-dr.deltra.de:5000/invoiz/web:integration
