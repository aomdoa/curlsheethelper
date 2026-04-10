#!/bin/bash
set -e

echo "Cleaning dist..."
rm -rf dist build
mkdir build

VERSION=$(node -p "require('./package.json').version")
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_TAG=$(git tag --points-at HEAD 2>/dev/null || echo "")
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [[ ! -n $GIT_TAG ]]; then
  VERSION="${VERSION}-SNAPSHOT"
fi

cat <<EOF > src/buildInfo.ts
// AUTO-GENERATED FILE. DO NOT EDIT.
export const buildInfo = {
  version: "${VERSION}",
  buildTime: "${BUILD_TIME}",
  gitSha: "${GIT_SHA}"
}
EOF


echo "Bundling with esbuild..."
npx esbuild src/index.ts \
  --bundle \
  --platform=node \
  --target=esnext \
  --outfile=dist/index.js \
  --external:@aws-sdk/* \
  --external:aws-sdk --external:mock-aws-s3 \
  --external:node-pre-gyp --external:@mapbox/node-pre-gyp \
  --minify

echo "Zipping..."
cd dist && zip -r ../build/lambda.zip index.js && cd ..

echo "Build complete → ./build/lambda.zip"
