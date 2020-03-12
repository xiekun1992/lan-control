#!/bin/bash

curl --location --request POST 'https://api.github.com/repos/xiekun1992/lan_control/releases' \
--header 'Content-Type: application/json' \
--header 'Authorization: token 0d6b17a1b5782a7bbe8559a3e36e8dedddc924fd' \
--data-raw '{
  "tag_name": "v1.0.0",
  "target_commitish": "master",
  "name": "v1.0.0",
  "body": "Description of the release",
  "draft": false,
  "prerelease": false
}'