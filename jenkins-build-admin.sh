#!/bin/sh
sed -i "s/__TFS_BUILD_NUMBER__/$tfs_build_number/g" kubernetes/*
echo "npm i --no-save"
npm i --no-save
echo "npm run deploy:admin"
npm run deploy:admin

docker build --no-cache -q -t invoiz-dr.deltra.de:5000/invoiz/web:admin$tfs_build_number .
docker push invoiz-dr.deltra.de:5000/invoiz/web:admin$tfs_build_number
docker rmi invoiz-dr.deltra.de:5000/invoiz/web:admin$tfs_build_number
