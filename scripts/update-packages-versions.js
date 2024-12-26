// @ts-check

const { workspaceRoot, getProjects } = require('@nx/devkit')
const { writeFile } = require('node:fs/promises')
const { join } = require('node:path')
const { cwd } = require('node:process')
const { FsTree } = require('nx/src/generators/tree')

const SHORTCUTS_FILE = join(cwd(), 'shortcuts.json')
const DOWNLOAD_URL = `https://github.com/Avivbens/ios-shortcuts/raw/refs/heads/master/packages`

const tree = new FsTree(workspaceRoot, false)
const projectsMap = getProjects(tree)
const projects = Object.fromEntries(projectsMap)

function readProjectPackageJson(packageJsonFile) {
    const packageJson = Buffer.from(tree.read(packageJsonFile))
    const packageJsonObj = JSON.parse(packageJson.toString())

    return packageJsonObj
}

;(async () => {
    try {
        const shortcuts = Object.keys(projects).reduce((acc, projectName) => {
            const project = projects[projectName]
            const packageJsonFile = project.targets['nx-release-publish']?.options?.packageJson
            const isExists = tree.exists(packageJsonFile)
            if (!isExists) {
                console.warn(`No packageJson file found for project ${project.name}`)
                return
            }

            const packageJsonObj = readProjectPackageJson(packageJsonFile)

            const version = packageJsonObj.version
            const downloadAsset = packageJsonObj.nx.targets['nx-release-publish']?.options?.download
            console.log(`Project ${project.name} version: ${version}`)

            const downloadLink = new URL(`${DOWNLOAD_URL}/${projectName}/${downloadAsset}`)
            acc[projectName] = {
                version,
                download: downloadLink.href,
            }
            return acc
        }, {})

        await writeFile(SHORTCUTS_FILE, JSON.stringify(shortcuts, null, 4))
        console.log(`Shortcuts file updated at ${SHORTCUTS_FILE}`)
    } catch (error) {
        console.error(error.stack)
    }
})()
