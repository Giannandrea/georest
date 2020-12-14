const restify = require('restify');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./geo.db');
const SELECT_ELEMENTS = "country_code, country_name, region_name, city_name, latitude, longitude, isp"


const ip2int = (ip) => ip.split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;

const int2ip = (ipInt) => ( (ipInt>>>24) +'.' + (ipInt>>16 & 255) +'.' + (ipInt>>8 & 255) +'.' + (ipInt & 255) );

const respond_json = (req, res, next) => {
	let ip = req.params.ip;
	let ip_int = ip2int(ip)
	db.get(`SELECT ${SELECT_ELEMENTS} FROM ip2location_db WHERE ${ip_int} <= ip_to order by ip_to LIMIT 1;`, function(err, row) {
		res.contentType = 'json';
		if (err || (row.country_code.length <= 1 && row.latitude == 0 && row.isp == null)) {
			if (!err) err = "Wrong query result";
			res.send(422,`{"error": "${err}"}`);
			return;
		}
		console.log(row);
		res.send(200, JSON.stringify(row));
		return;
	});
	return;
}

const respond_country_code = (req, res, next) => {
	let ip = req.params.ip;
	let ip_int = ip2int(ip)
	db.get(`SELECT country_code FROM ip2location_db WHERE ${ip_int} <= ip_to order by ip_to LIMIT 1;`, function(err, row) {
		console.log(row);
		res.send(200, row.country_code);
		return;
	});
	return;
}

const respond_healthcheck = (req, res, next) => {
	res.send(200, "Georest");
	return;
}


// Routes get/head for the rest api "json" and "country"

const server = restify.createServer();
server.get('/json/:ip', respond_json);
server.head('/json/:ip', respond_json);
server.get('/country/:ip',respond_country_code);
server.head('/country/:ip',respond_country_code);
server.get('/healthcheck',respond_healthcheck);

server.listen(8080, () => console.log(`GeoRest running on ${server.name} listening at ${server.url}`));