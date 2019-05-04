#!/bin/sh
NODE_ENV=production
PACKAGE_VERSION=`node -p "require('./version.json').version"`

#docker build
docker pull node:8
docker build . --rm -t quay.io/maphubs/raster-upload:v$PACKAGE_VERSION

#commit version tag
git add version.json
git commit  -m "version $PACKAGE_VERSION"
git tag v$PACKAGE_VERSION
git push origin
git push origin v$PACKAGE_VERSION

#push Docker image to repo
docker push quay.io/maphubs/raster-upload:v$PACKAGE_VERSION
