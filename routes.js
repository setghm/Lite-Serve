const url = require('url');
const path = require('path');
const fs = require('fs');
const MimeType = require('./mime.js');

function routes(req, res, webRoot, logCallback) {
	switch (req.method) {
		case 'GET': {
			const url = req.url;
			let pathName = path.join(webRoot, url);
			let resource = /[^\\]*$/.exec(pathName)[0];

			if (resource === '') {
				pathName = path.join(pathName, '/index.html');
			}
			
			fs.access(pathName, (err) => {
				if (!err) {
					let ext = path.parse(pathName).ext;
					let type = MimeType(ext);
					
					fs.readFile(pathName, 'utf8', (err, data) => {
						if (!err) {
							res.writeHead(200, {'Content-Type': type});
							res.end(data);
							logCallback(`200 ${req.method} => ${pathName}`);
						} else {
							res.writeHead(500, {'Content-Type': 'text/html'});
							res.end('<h1>Internal Server Error</h1>');
							logCallback(`500 ${req.method} => ${pathName}`);
						}
					});
				} else {
					res.writeHead(404, {'Content-Type': 'text/html'});
					res.end('<h1>Not found</h1>');
					logCallback(`404 ${req.method} => ${pathName}`);
				}
			});
			break;
		}
		/*case 'HEAD': {
			break;
		}*/
		default: {
			res.writeHead(501, {'Content-Type': 'text/html'});
			res.end('<h1>Not Implemented</h1>');
			logCallback(`501 ${req.method}`);
		}
	}
}

module.exports = routes;