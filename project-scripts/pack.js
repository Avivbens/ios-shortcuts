#!/usr/bin/env node

const { cwd } = require('node:process')
const { resolve } = require('node:path')
const { exec } = require('node:child_process')
const { rm, readFile, writeFile } = require('node:fs/promises')
const { promisify } = require('node:util')

const DIRECTORIES_TO_DELETE = ['dist', 'bin']
const PACKAGE_JSON_FILE = 'package.json'
const PACKAGE_JSON_LOCK_FILE = 'package-lock.json'

const DEFAULT_OPTIONS = { lockfile: false }

function isCI() {
    return (
        process.env.CI === 'true' ||
        process.env.GITHUB_ACTIONS === 'true' ||
        process.env.GITLAB_CI === 'true' ||
        process.env.CIRCLECI === 'true' ||
        process.env.TF_BUILD === 'true' ||
        process.env.APPVEYOR === 'True'
    )
}

async function readPrettierConfig() {
    try {
        const filePath = resolve(cwd(), '.prettierrc')

        const rawData = await readFile(filePath, 'utf-8')
        const jsonData = JSON.parse(rawData)

        return jsonData
    } catch (error) {
        console.error(`Error reading prettier config: ${error.stack}`)
        throw error
    }
}

async function readWorkflowPackageJson({ lockfile = false } = DEFAULT_OPTIONS) {
    try {
        const filePath = resolve(cwd(), lockfile ? PACKAGE_JSON_LOCK_FILE : PACKAGE_JSON_FILE)

        const rawData = await readFile(filePath, 'utf-8')
        const jsonData = JSON.parse(rawData)

        return jsonData
    } catch (error) {
        console.error(`Error reading workflow package.json: ${error.stack}`)
        throw error
    }
}

async function writeWorkflowPackageJson(
    data,
    { lockfile = false } = DEFAULT_OPTIONS,
) {
    try {
        const { tabWidth = 2 } = await readPrettierConfig()

        const filePath = resolve(cwd(), lockfile ? PACKAGE_JSON_LOCK_FILE : PACKAGE_JSON_FILE)

        const dataToWrite = JSON.stringify(data, null, tabWidth)

        await writeFile(filePath, dataToWrite)
    } catch (error) {
        console.error(`Error writing workflow package.json: ${error.stack}`)
        throw error
    }
}

; (async () => {
    try {

        let [targetVersion] = process.argv.slice(2)
        if (!targetVersion) {
            if (isCI()) {
                console.error('Please provide a version number!')
                process.exit(1)
            }

            console.warn('No version number provided, using 1.0.0')
            targetVersion = '1.0.0'
        }

        /**
         * Clean up
         * */
        console.log('Cleaning up...')
        const deletePrm = DIRECTORIES_TO_DELETE.map(dir => rm(dir, { recursive: true, force: true }))
        await Promise.all(deletePrm)

        /**
         * Bump up versions
        */
        if (isCI()) {
            console.log('Bumping up versions...')

            const packageJson = await readWorkflowPackageJson()
            packageJson.version = targetVersion
            await writeWorkflowPackageJson(packageJson)

            const packageLockJson = await readWorkflowPackageJson({ lockfile: true })
            packageLockJson.version = targetVersion
            await writeWorkflowPackageJson(packageLockJson, { lockfile: true })
        } else {
            console.warn('Skipping version bumping because it is not running in CI')
        }
    } catch (error) {
        console.error(`Error: ${error.stack}`)
    }
})()