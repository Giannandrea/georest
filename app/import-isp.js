const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');
const fs = require('fs');
const db = new sqlite3.Database('./geo.db');

fs.createReadStream('IP2LOCATION-LITE-ASN.CSV')
  .pipe(csv(['ip_form', 'ip_to', "cidr", "four", "isp"]))
  .on('data', (row) => {
          if (row.isp && row.isp.length > 2 && row.isp != "null") {
          db.get("UPDATE ip2location_db SET isp = \""+row.isp+"\" where ip_from = "+row.ip_form+" and ip_to = "+row.ip_to+";", function(err, row) {
             if (err) { console.log(err); }
           });
           //console.log(row.isp);
      }
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  })