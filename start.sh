#!/bin/bash

echo "Запускаю бэк в докере"
docker-compose up -d 

echo "Запускаю фронт локально"
cd front
python -m http.server 5500