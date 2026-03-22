import { readFileSync, writeFileSync } from 'node:fs'

const nextVersion = process.argv[2]

if (!nextVersion) {
  console.error('Usage: node scripts/release/set-package-version.mjs <version>')
  process.exit(1)
}

const packageJsonPath = new URL('../../package.json', import.meta.url)
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
packageJson.version = nextVersion
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
