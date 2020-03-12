#!/bin/bash

curl --location --request POST "https://uploads.github.com/repos/xiekun1992/lan_control/releases/24450983/assets?name=$1" \
--header 'Authorization: token cc7077f99bcb4f12f69399d6e7abd83b70305012' \
--header 'Content-Type: application/zip' \
--data-binary "@./$1"