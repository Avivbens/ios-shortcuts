const { exec } = require('child_process')
const { existsSync } = require('fs')
const { argv } = require('process')

;(() => {
    const [, , shortcutName] = argv

    const filePath = `dist/${shortcutName}.js`

    if (!shortcutName || !existsSync(filePath)) {
        console.log('Please provide a valid shortcut name.')
        return
    }

    console.log('Creating shortcut...')

    exec(`node ${filePath}`, () => {
        console.log('Shortcut created.')
    })
})()
