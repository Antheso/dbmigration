import { mysqlConnection } from "./db/db";

var path = require('path');
var fs = require('fs');
var async = require('async');

function getFiles(dirPath, callback) {

  fs.readdir(dirPath, function (err, files) {
    if (err) return callback(err);

    var filePaths = [];
    async.eachSeries(files, function (fileName, eachCallback) {
      var filePath = path.join(dirPath, fileName);

      fs.stat(filePath, function (err, stat) {
        if (err) return eachCallback(err);

        if (stat.isDirectory()) {
          getFiles(filePath, function (err, subDirFiles) {
            if (err) return eachCallback(err);

            filePaths = filePaths.concat(subDirFiles);
            eachCallback(null);
          });

        } else {
          if (stat.isFile()) {
            filePaths.push(filePath);
          }

          eachCallback(null);
        }
      });
    }, function (err) {
      callback(err, filePaths);
    });

  });
}


getFiles('./archive', function (err, files) {
  files.forEach(filePath => {
    fs.readFile(filePath, 'utf8', function(err, contents) {
      if (err) {
        console.log(err);
        return;
      }

      const info = JSON.parse(contents),
        networks = info.networks;

      networks.forEach(net => {
        mysqlConnection.query('insert into networks set ?', {
          uuid: info.uuid,
          instance: info.instance,
          start_date: info.startDate,
          ...net
        },
        function(err) {
          if (err) {
            console.log(err);
            return;
          }
          console.log(`Network uuid: ${info.uuid}, ssid: ${net.SSID} added!`);
        });
      });
    });
  });
});

