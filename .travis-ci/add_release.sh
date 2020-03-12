#!/bin/bash

curl --location --request POST 'https://api.github.com/repos/xiekun1992/lan_control/releases' \
--header 'Content-Type: application/json' \
--header 'Authorization: token cc7077f99bcb4f12f69399d6e7abd83b70305012' \
--data-raw '{
  "tag_name": "v1.0.0",
  "target_commitish": "master",
  "name": "v1.0.0",
  "body": "Description of the release",
  "draft": false,
  "prerelease": false
}'