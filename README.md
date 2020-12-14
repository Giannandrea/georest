# Georest
Ip to geo informations service with docker creation and restify application

## Introduction

This project provides a simple service for ip geolocation.
It run on a docker, All the data are in a sqlite3 db and requests managed by nodejs server with restify framework.
The data about geolocation are provided by ip2location free db. In order to have the best level of details we use 2 dabatases [DBASNLITE](https://lite.ip2location.com/database/ip-asn) and [DB5LITE](https://lite.ip2location.com/database/ip-country-region-city-latitude-longitude).
Considering the new rules about privacy in order to download these databases registrition is required.
Other information about databases types can be found a this [link](https://lite.ip2location.com)

## Installation
This software run on a docker container. This container is based on [bitnami/minideb]() image with sqlite3 and nodoejs. All the procedure are covedere by scripts so the building of the image is automatic and an be used on CI.
In order to build and pull on dockerhub
```bash
bash createDocker.sh <IMAGE_TAG> <IP2LOCATION_TOKEN>
```
In order to build and pull on AWS ecr
```bash
bash createDocker.sh <IMAGE_TAG> <IP2LOCATION_TOKEN> ecr <AWS_PROFILE> <AWS_REGION>
```
Is possible to pull in any other registry simply logging in before to run the script above.

## Use it
The node app work by default on 8080 TCP port. 
In order to the test the app is possible to run the docker in this way:
```bash
docker run -ti -p 8080:8080 <IMAGE_TAG> node server.js
```
And is possible to receve the JSON formatted informations using curl
```bash
curl -vv "localhost:8080/json/8.8.8.8"
```
## Rest api
Path  | Protocols  |  Errors  |  Success
------------- | ------------- | ------------- | -------------   
/json/:ip  | GET,HEAD  | 422, {"error":"<Error message>"}  | 200, Json format below
/country/:ip  | GET,HEAD  | 422, {"error":"<Error message>"}  | 200, {"country_code":"US"}
/isp/:ip  | GET,HEAD  | 422, {"error":"<Error message>"}  | 200, {"country_code":"US"}
/healthcheck  | GET  | ---  | 200, "Georest"

## Json format
The informations contained in the Json are listed in the table below:
Key  | value
------------- | -------------
country_code  | Two-character ISO 3166
country_name  | Country name ISO 3166
region_name  | Region or state name
city_name  | City name
latitude  | City latitude. Capital city latitude if unknown city
longitude  | City longitude. Capital city longitude if unknown city
isp  | Autonomous system (AS) name

Json example
```json
{
   "country_code":"US",
   "country_name":"United States of America",
   "region_name":"California",
   "city_name":"Mountain View",
   "latitude":37.405992,
   "longitude":-122.078515,
   "isp":"Google"
}
```
## License

This module is released under the MIT license.

## Bugs

See <https://github.com/Giannandrea/georest/issues>.
