/**
 * Lite Serve
 *
 * Set HM 2024.
 *
 * A mini web server for your personal projects with a friendly user interface.
 *
 */
const { app, BrowserWindow, ipcMain, dialog } = require('electron')

const http = require('http')
const net = require('net')
const path = require('path')
const fs = require('fs')
const routes = require('./routes.js')
const STATUSES = require('./renderer/statuses.js')

// key passphrase = lite-serve

/* ================ ELECTRON ================ */

let mainWindow = null

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 520,
		minWidth: 800,
		minHeight: 520,
		autoHideMenuBar: true,
		icon: 'renderer/assets/icon.png',
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		}
	})
	
	//mainWindow.setMenu(null)
	mainWindow.loadFile('renderer/index.html')
}

app.whenReady().then(() => {
	ipcMain.handle('folder:exists', existsFolder)
	ipcMain.on('folder:pick', pickFolder)
	ipcMain.on('server:start', startServer)
	ipcMain.on('server:stop', stopServer)
	ipcMain.on('server:restart', restartServer)
	ipcMain.on('browser:open', openInBrowser)

	createWindow()
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit()
})

/* =============== SERVER FUNCTIONS =============== */

let server = null
let cfg = null

function startServer(event, config) {
	cfg = config
	mainWindow.webContents.send('server:status', STATUSES.STARTING)

	server = http.createServer((req, res) => {
		routes(req, res, config.path, (message) => {
			let remoteIP = /:([\d\.]+)/.exec(req.socket.remoteAddress)[1]
			mainWindow.webContents.send('log:new', {
				address: `${remoteIP}:${req.socket.remotePort}`,
				hour: now(),
				message: message
			})
		})
	})
	
	/*server.on('connection', (conn) => {
		mainWindow.webContents.send('log:new', {
			address: `${conn.remoteAddress}:${conn.remotePort}`,
			hour: now(),
			message: 'Welcome'
		})
	})*/
	
	server.on('error', (err) => {
		if (err.code === 'EADDRINUSE') {
			mainWindow.webContents.send('server:status', STATUSES.ADDR_IN_USE)
		} else {
			mainWindow.webContents.send('log:new', {
				address: 'local',
				hour: now(),
				message: `ERROR: ${err.code}`
			})
		}
	})

	server.listen(config.port, () => {
		mainWindow.webContents.send('log:new', {
			address: 'local',
			hour: now(),
			message: `Server up ${localIP()}:${config.port}`
		})
		mainWindow.webContents.send('server:status', STATUSES.LISTENING)
	})
}

function stopServer() {
	mainWindow.webContents.send('server:status', STATUSES.STOPPING)

	server.close(() => {
		mainWindow.webContents.send('log:new', {
			address: 'local',
			hour: now(),
			message: 'Server closed'
		})
		mainWindow.webContents.send('server:status', STATUSES.READY)
	})
}

function restartServer(event, config) {
	stopServer()
	startServer(event, config)
}

/* =============== MISC FUNCTIONS =============== */

function pickFolder() {
	dialog.showOpenDialog({
		properties: ['openDirectory']
	}).then((result) => {
		if (!result.canceled) {
			mainWindow.webContents.send('folder:selected', result.filePaths[0])
		}
	})
}

function existsFolder(event, path) {
	return fs.existsSync(path)
}

function openInBrowser() {
	const command = {
		'darwin': 'open',
		'win32': 'start',
		'linux': 'xdg-open'
	}
	const mode = cfg.advanced.httpsMode ? 'http' : 'https'

	require('child_process')
	.exec(`${command[process.platform]} ${mode}://localhost:${cfg.port}`)
}

function now() {
	let date = new Date()
	let hours = zeroes(date.getHours())
	let minutes = zeroes(date.getMinutes())
	let seconds = zeroes(date.getSeconds())

	return `${hours}:${minutes}:${seconds}`
}

function zeroes(number) {
	if (number < 10) {
		return '0' + number
	}
	return number
}

function localIP() {
	const { networkInterfaces } = require('os')
	const nets = networkInterfaces()

	for (const name of Object.keys(nets)) {
		for (const net of nets[name]) {
			const familyV4Value = typeof net.family == 'string' ? 'IPv4' : 4

			if (net.family == familyV4Value && !net.internal) {
				return net.address
			}
		}
	}
}

/*

GENERATE SSL 
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
*/
