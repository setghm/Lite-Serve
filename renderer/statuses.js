const STATUSES = {
    READY: {
        message: 'Ready to start'
    },
    DIR_NOT_EXISTS: {
        message: 'The selected directory does not exists',
        type: 'error'
    },
    STOPPING: {
        message: 'Stopping server...'
    },
    LISTENING: {
        message: 'Server listening'
    },
    STARTING: {
        message: 'Starting server...'
    },
    ADDR_IN_USE: {
        message: 'Port in use',
        type: 'error'
    },
    NULL: {
        message: ''
    }
}

if (typeof module !== 'undefined') {
    module.exports = STATUSES
}