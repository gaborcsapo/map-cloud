#!/bin/bash
rm -r dist
mkdir -p dist/resources &&
cp public/resources/img/favicon.png dist/ &&
cp -r public/resources/* dist/resources &&
npm run compile:sass &&
npm run compile:rollup &&

touch dist/secrets.json &&

echo -n "{\"maps_api_key\":\"" > dist/secrets.json &&

# cloud build makes the env var available while on local builds we have to manually fetch the secret
if [[ -z "${MAPS_API_KEY}" ]]; then
  echo "API key env var found"
  echo ${MAPS_API_KEY} >> dist/secrets.json
else
  echo "API key env var not found"
  gcloud secrets versions access 1 --secret=MAPS_API_KEY >> dist/secrets.json
fi

echo -n "\"}" >> dist/secrets.json &&
mustache dist/secrets.json public/views/home.mustache > dist/index.html &&
mkdir dist/trip &&
mustache dist/secrets.json public/views/player.mustache > dist/trip/index.html &&
mkdir dist/editor &&
mustache dist/secrets.json public/views/editor.mustache > dist/editor/index.html

rm dist/secrets.json