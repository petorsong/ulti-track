#!/bin/bash

filenum=$(find src/database/migrations/ -maxdepth 1 -type f|wc -l)
timestamp=$(date +%G%m%e%H%M%S)
touch $(printf "src/database/migrations/%d_%03d_%s.sql\n" $timestamp $filenum $1)
