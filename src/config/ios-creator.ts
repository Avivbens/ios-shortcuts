import { exec } from 'child_process'
import { mkdir, writeFile } from 'fs/promises'
import { IOS_DIST } from './global-config'

export const createIOSShortcut = async (shortcutName: string, shortcut: string) => {
    // Write the Shortcut to a file in the current directory
    try {
        const filePath = IOS_DIST(shortcutName)
        await mkdir('ios')
        await writeFile(filePath, shortcut)

        exec(`shortcuts sign -i ${filePath} -o ${filePath}`)

        console.log('Shortcut created!')
    } catch (error) {
        console.error('Failed to create Shortcut', error)
    }
}
