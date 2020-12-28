FROM bitnami/minideb

ARG IP2LOCATION_TOKEN
ENV IP2LOCATION_TOKEN=$IP2LOCATION_TOKEN
ENV IP2LOCATION_URL="https://www.ip2location.com"
ENV NODEVER v12.9.1
ENV NPM ./node-$NODEVER-linux-x64/lib/node_modules/npm/bin/npm-cli.js
ENV NODE_OPTIONS "--max-old-space-size=5120"

WORKDIR /app 
COPY app/create_geodb.sql ./create_geodb.sql
COPY app/import_geo.sql ./import_geo.sql
COPY app/server.js ./server.js
COPY app/import-isp.js ./import-isp.js
COPY app/package.json ./package.json

# use them for local test
#COPY IP2LOCATION-LITE-DB.CSV.ZIP ./IP2LOCATION-LITE-DB.CSV.ZIP
#COPY IP2LOCATION-LITE-ASN.CSV.ZIP ./IP2LOCATION-LITE-ASN.CSV.ZIP
#COPY IP2LOCATION-LITE-DB5.IPV6.CSV.ZIP ./IP2LOCATION-LITE-DB5.IPV6.CSV.ZIP
#COPY IP2LOCATION-LITE-ASN.IPV6.CSV.ZIP ./IP2LOCATION-LITE-ASN.IPV6.CSV.ZIP

RUN apt update && apt -y --no-install-recommends upgrade && apt install --no-install-recommends -y unzip sqlite3 wget nodejs npm \
	&& wget --no-check-certificate "$IP2LOCATION_URL/download/?token=$IP2LOCATION_TOKEN&file=DB5LITE" -O IP2LOCATION-LITE-DB.CSV.ZIP \
	&& unzip IP2LOCATION-LITE-DB.CSV.ZIP && sed -i 's/\(.*\)"/\1",/' IP2LOCATION-LITE-DB5.CSV \
	&& npm install && rm LICENSE_LITE.TXT README_LITE.TXT\
	&& wget --no-check-certificate "$IP2LOCATION_URL/download/?token=$IP2LOCATION_TOKEN&file=DBASNLITE" -O IP2LOCATION-LITE-ASN.CSV.ZIP \
	&& unzip IP2LOCATION-LITE-ASN.CSV.ZIP && rm LICENSE_LITE.TXT README_LITE.TXT \
	&& sed -n '/"-"/!p' IP2LOCATION-LITE-ASN.CSV | awk 'BEGIN { FS = "," } ; { print $1","$2","$5}' > IP2LOCATION-LITE-ASN-SMALL.CSV \
	&& wget --no-check-certificate "$IP2LOCATION_URL/download/?token=$IP2LOCATION_TOKEN&file=DB5LITEIPV6" -O IP2LOCATION-LITE-DB5.IPV6.CSV.ZIP \
	&& unzip IP2LOCATION-LITE-DB5.IPV6.CSV.ZIP && rm LICENSE_LITE.TXT README_LITE.TXT \
	&& wget --no-check-certificate "$IP2LOCATION_URL/download/?token=$IP2LOCATION_TOKEN&file=DBASNLITEIPV6" -O IP2LOCATION-LITE-ASN.IPV6.CSV.ZIP \
	&& sed -n '/"-"/!p' IP2LOCATION-LITE-ASN.IPV6.CSV | awk 'BEGIN { FS = "," } ; { print $1","$2","$5}' > IP2LOCATION-LITE-ASN-IPV6-SMALL.CSV \
	&& sqlite3 geo.db && sqlite3 geo.db < create_geodb.sql && sqlite3 geo.db < import_geo.sql \
	#&& node import-isp.js \
	&& apt purge -y nodejs npm python2* python2* libpython2* libpython3* > /dev/null \
	&& wget --no-check-certificate -nv https://nodejs.org/dist/$NODEVER/node-$NODEVER-linux-x64.tar.gz && tar zxf node-$NODEVER-linux-x64.tar.gz \
	&& ln -s $PWD/node-$NODEVER-linux-x64/bin/node /usr/bin/node && ln -s $PWD/node-$NODEVER-linux-x64/bin/npm /usr/bin/npm \
	&& rm -fr *.csv *CSV *.TXT *.ZIP *.zip *.sql setup_12.x node-v12.9.1-linux-x64.tar.gz && $NPM cache clean --force --loglevel=error \
	&& apt purge -y python3* xz-utils curl wget unzip && apt-get autoremove -y && apt-get clean && rm -rf /var/lib/apt/lists/* && apt-get autoclean \
	&& find .  -name "*.min*" -or -name "LICENSE" -or -name "*.md" -or -name "*.png" -or -name "*.yml" -delete \
	&& rm -fr $PWD/node-$NODEVER-linux-x64/bin/npm $PWD/node-$NODEVER-linux-x64/lib/node_modules

EXPOSE 8080/tcp

CMD ["node", "server.js"