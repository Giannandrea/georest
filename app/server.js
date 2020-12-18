const restify = require('restify');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./geo.db');
const randomip = require('random-ip');
const SELECT_ALL_ELEMENTS = "ip2location_db.country_code, ip2location_db.country_name, ip2location_db.region_name, ip2location_db.city_name, ip2location_db.latitude, ip2location_db.longitude, ip2location_ip.isp"

const ip2int = (ip) => ip.split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;

const int2ip = (ipInt) => ( (ipInt>>>24) +'.' + (ipInt>>16 & 255) +'.' + (ipInt>>8 & 255) +'.' + (ipInt & 255) );

db.query = function (sql, params) {
	const that = this;
	return new Promise((resolve, reject) => {
		that.get(sql, params, (error, rows) => {
			if (error)
				reject(error);
			else
				resolve(rows);
		});
	});
};

const send_error = (res, err) => {
	res.send(422,`{"error": "${err}"}`);
	return
}
 
const respond = async (req, res, next, select_items) => {
	let ip = req.params.ip;
	let ip_int = ip2int(ip)
	res.contentType = 'json';
	let result = null;
	try {
		query = `select ${select_items} FROM ip2location_db, ip2location_ip WHERE (${ip_int} between ip2location_ip.ip_from AND ip2location_ip.ip_to) AND (${ip_int} between ip2location_db.ip_from AND ip2location_db.ip_to) limit 1;`;
		result = await db.query(query, []);
		if (select_items.length > 1 && result.country_code.length < 2 && result.latitude == 0 && result.isp == "") {
			send_error(res, "Wrong query result");
			return;
		}
		console.log(JSON.stringify(result));
	} catch (error) {
		send_error(res, error);
		return; 
	}	
	res.send(200, result);
	return;
}

// ---- requests endpoints ----- 

const respond_json = (req, res, next) => respond(req, res, next, SELECT_ALL_ELEMENTS);

const respond_country_code = (req, res, next) => respond(req, res, next, "country_code");

const respond_isp = (req, res, next) => respond(req, res, next, "isp");

const respond_healthcheck = (req, res, next) => res.send(200, "Georest");

const respond_test = (req, res, next) => { req.params.ip = randomip('0.0.0.0', 0, 32); respond(req, res, next, SELECT_ALL_ELEMENTS);}

// Routes get/head for the rest api "json" and "country"
const server = restify.createServer();
server.get('/json/:ip', respond_json);
server.head('/json/:ip', respond_json);
server.get('/country/:ip',respond_country_code);
server.head('/country/:ip',respond_country_code);
server.get('/isp/:ip',respond_isp);
server.get('/test/:ip',respond_test);
server.head('/isp/:ip',respond_isp);
server.get('/healthcheck',respond_healthcheck);

server.listen(8080, () => console.log(`GeoRest running on ${server.name} listening at ${server.url}\n`));