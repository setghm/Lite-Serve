const divContent = document.querySelector('.content')
const btnBrowse = document.querySelector('#browse')
const inpRootPath = document.querySelector('#root-path')
const inpPort = document.querySelector('#port')
const chbHttpsMode = document.querySelector('#https-mode')
const btnStartServer = document.querySelector('#start-server')
const btnStopServer = document.querySelector('#stop-server')
const btnOpenInBrowser = document.querySelector('#open-in-browser')
const divLogsContainer = document.querySelector('#logs-container')
const divServerStatus = document.querySelector('.server-status')

const DEFAULT_PORT = 8000

let serverStarted = false
let config = null

/* ================== EVENT LISTENERS ================== */

window.addEventListener('load', () => {
    setStatus(STATUSES.READY)

    let webRoot = loadWebRoot()

    if (webRoot) {
        inpRootPath.value = webRoot
    }

    let port = loadPort()

    if (port !== DEFAULT_PORT) {
        inpPort.value = port
    }
})

btnBrowse.addEventListener('click', () => {
    window.electronAPI.folderPick()
})

btnStartServer.addEventListener('click', async () => {
    config = collectConfig()

    // Correct configuration
    if (await checkConfig(config)) {
        if (!serverStarted) {
            window.electronAPI.startServer(config)
        } else {
            window.electronAPI.restartServer(config)
        }
    }
})

btnStopServer.addEventListener('click', () => {
    enableActions(false)
    serverStarted = false
    window.electronAPI.stopServer()
})

btnOpenInBrowser.addEventListener('click', () => {
    window.electronAPI.openInBrowser()
})

/* ================== IPC FUNCTIONS ================== */

window.electronAPI.folderSelected((event, directory) => {
    changedRootPathInput()
    inpRootPath.value = directory
})

window.electronAPI.newServerStatus((event, status) => {
    setStatus(status)
})

window.electronAPI.newLog((event, log) => {
    let divLog = HTMLfromString(
        `<div class="log">
            <div class="address">${log.address}</div>
            <div class="hour">${log.hour}</div>
            <div class="message">${log.message}</div>
        </div>`
    )

    divContent.appendChild(divLog)
})

/* ================== MISC FUNCTIONS ================== */

function enableActions(enable=true) {
    btnStopServer.disabled = !enable
    btnOpenInBrowser.disabled = !enable
    btnStartServer.textContent = enable ? 'Restart' : 'Start'
}

function collectConfig() {
    const port = (inpPort.value !== '') ? inpPort.value : DEFAULT_PORT
    const webRoot = inpRootPath.value
    const httpsMode = chbHttpsMode.checked

    const config = {
        port: port,
        path: webRoot,
        advanced: {
            httpsMode: httpsMode,
        }
    }

    return config
}

async function checkConfig(config) {
    // Check if path is a valid directory
    if (!await window.electronAPI.folderExists(config.path)) {
        setStatus(STATUSES.DIR_NOT_EXISTS)
        return false
    }

    return true
}

function setStatus(status=STATUSES.NULL) {
    divServerStatus.status = status
    divServerStatus.textContent = status.message

    divServerStatus.classList.remove('error')
    divServerStatus.classList.remove('warning')

    if (status.type) {
        divServerStatus.classList.add(status.type)
    }

    checkStatus(status.message)
}

function getStatus() {
    return divServerStatus.status
}

function checkStatus(statusMsg) {
    switch (statusMsg) {
        case STATUSES.ADDR_IN_USE.message:
            inpPort.classList.add('error')
            inpPort.addEventListener('input', changedPortInput)
            break;
        case STATUSES.DIR_NOT_EXISTS.message:
            inpRootPath.classList.add('error')
            inpRootPath.addEventListener('input', changedRootPathInput)
            break;
        case STATUSES.LISTENING.message:
            enableActions()
            serverStarted = true
            
            saveWebRoot(config.path)
            if (config.port !== DEFAULT_PORT) {
                savePort(config.port)
            }
            break;
    }
}

function changedPortInput() {
    inpPort.classList.remove('error')
    inpPort.removeEventListener('input', this)
    setStatus()
}

function changedRootPathInput() {
    inpRootPath.classList.remove('error')
    inpRootPath.removeEventListener('input', this)
    setStatus()
}

function HTMLfromString(html) {
    let div = document.createElement('div')
    div.innerHTML = html.trim()
    return div.firstChild
}

/* ================== LOCAL STORAGE FUNCTIONS ================== */

function saveWebRoot(webRoot) {
    localStorage.setItem('webRoot', webRoot)
}

function loadWebRoot() {
    let item = localStorage.getItem('webRoot')

    if (!item) {
        item = ''
    }

    return item
}

function savePort(port) {
    localStorage.setItem('port', port)
}

function loadPort() {
    let item = localStorage.getItem('port')

    if (!item) {
        return DEFAULT_PORT
    }

    return parseInt(item)
}
