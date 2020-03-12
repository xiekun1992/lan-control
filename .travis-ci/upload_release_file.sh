#!/bin/bash

curl --location --request POST "https://uploads.github.com/repos/xiekun1992/lan_control/releases/24450983/assets?name=$1" \
--header 'Authorization: token 0d6b17a1b5782a7bbe8559a3e36e8dedddc924fd' \
--header 'Content-Type: application/zip' \
--data-binary "@./$1"