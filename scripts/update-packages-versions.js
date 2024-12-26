// @ts-check

const { workspaceRoot, getProjects } = require('@nx/devkit')
const { writeFile } = require('node:fs/promises')
const { join } = require('node:path')
const { cwd } = require('node:process')
const { FsTree } = require('nx/src/generators/tree')

const SHORTCUTS_FILE = join(cwd(), 'shortcuts.json')

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
            console.log(`Project ${project.name} version: ${version}`)

            acc[projectName] = version
            return acc
        }, {})

        await writeFile(SHORTCUTS_FILE, JSON.stringify(shortcuts, null, 2))
        console.log(`Shortcuts file updated at ${SHORTCUTS_FILE}`)
    } catch (error) {
        console.error(error.stack)
    }
})()
