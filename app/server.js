const restify = require('restify');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./geo.db');
const randomip = require('random-ip');
const BigNumber = require('bignumber.js');
const SELECT_ALL_ELEMENTS_V4 = "country_code, country_name, region_name, city_name, latitude, longitude, isp"
const SELECT_ALL_ELEMENTS_V6 = "country_code, country_name, region_name, city_name, latitude, longitude"

const hex2bin = (hex) => ("00000000" + (parseInt(hex, 16)).toString(2)).substr(-4);

const ipv42int = (ip) => ip.split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;

const int2ip = (ipInt) => ( (ipInt>>>24) +'.' + (ipInt>>16 & 255) +'.' + (ipInt>>8 & 255) +'.' + (ipInt & 255) );

const ipv62int = (ip) => {
	binary_result = ""
	for (const ch of ip){
		if (ch != ":" ) {
			binary_result += hex2bin(ch)+"";
		}
	}
	res = BigNumber(parseInt(binary_result, 2)).toFixed() + "";
	return res.replace(/0+$/,'');
}

const ip2int = (ip, ip_version) => (ip_version == 4 ? ipv42int(ip) : ipv62int(ip));

const query_builder = (ip_int, select_items, ip_version) => {
	let where = `(${ip_int} between ip2location_ip.ip_from AND ip2location_ip.ip_to) AND (${ip_int} between ip2location_db.ip_from AND ip2location_db.ip_to)`;
	let query = `SELECT ${select_items} FROM ip2location_db, ip2location_ip WHERE ${where} LIMIT 1;`;
	if (ip_version == 6) {
		where = `${ip_int} <= ipv62location_db.ip_to ORDER BY ipv62location_db.ip_to`;
		query = `SELECT ${select_items} FROM ipv62location_db WHERE ${where} LIMIT 1;`;
	}
	return query;
}

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
 
const respond = async (req, res, next, select_items, ip_version) => {
	let ip = req.params.ip;
	let ip_int = ip2int(ip, ip_version);
	res.contentType = 'json';
	let result = null;
	try {
		let query = query_builder(ip_int, select_items, ip_version)
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

const respond_json = (req, res, next) => {
	let malformed = true;
	if (/^(\d{1,3}\.){3}\d{1,3}$/.test(req.params.ip)) { malformed = false; respond(req, res, next, SELECT_ALL_ELEMENTS_V4, 4); }
	if (/^((\d|\w){1,4}:){1,7}(\d|\w){1,4}$/.test(req.params.ip)) { malformed = false; respond(req, res, next, SELECT_ALL_ELEMENTS_V6, 6); }
	if (malformed == true) { res.send(400, "Error"); }
}

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