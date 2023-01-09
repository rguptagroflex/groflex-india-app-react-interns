#!/bin/sh
sed -i "s/__TFS_BUILD_NUMBER__/$tfs_build_number/g" kubernetes/*
echo "npm i --no-save"
npm i --no-save
echo "npm run deploy:dev"
npm run deploy:dev
echo "creating invoiz-dr.deltra.de:5000/invoiz/web:ci"
docker build --no-cache -q -t invoiz-dr.deltra.de:5000/invoiz/web:ci .
docker push invoiz-dr.deltra.de:5000/invoiz/web:ci
docker rmi invoiz-dr.deltra.de:5000/invoiz/web:ci
