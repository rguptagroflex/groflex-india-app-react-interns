#!/bin/sh
sed -i "s/__TFS_BUILD_NUMBER__/$tfs_build_number/g" kubernetes/*
npm i --no-save

echo "building qa"
npm run deploy:qa
docker build --no-cache -q -t invoiz-dr.deltra.de:5000/invoiz/web:qa .
docker push invoiz-dr.deltra.de:5000/invoiz/web:qa
docker rmi invoiz-dr.deltra.de:5000/invoiz/web:qa

echo "building staging"
npm run deploy:staging
docker build --no-cache -q -t invoiz-dr.deltra.de:5000/invoiz/web:staging .
docker push invoiz-dr.deltra.de:5000/invoiz/web:staging
docker rmi invoiz-dr.deltra.de:5000/invoiz/web:staging

echo "building production"
npm run deploy:production
docker build --no-cache -q -t invoiz-dr.deltra.de:5000/invoiz/web:v$tfs_build_number .
docker push invoiz-dr.deltra.de:5000/invoiz/web:v$tfs_build_number
docker rmi invoiz-dr.deltra.de:5000/invoiz/web:v$tfs_build_number