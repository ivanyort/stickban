import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function getLatestTag() {
  try {
    const tags = runGit(['tag', '--list', 'v*', '--sort=-version:refname'])
    return tags.split('\n').filter(Boolean)[0] ?? null
  } catch {
    return null
  }
}

function getCommitMessages(range) {
  try {
    const output = runGit(['log', range, '--pretty=%s%n%b%x1e'])
    return output
      .split('\x1e')
      .map((entry) => entry.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function getBumpType(messages) {
  let bump = 'patch'
  for (const message of messages) {
    if (/BREAKING CHANGE:/m.test(message) || /^[a-z]+(\([\w./-]+\))?!:/m.test(message)) {
      return 'major'
    }
    if (/^feat(\([\w./-]+\))?:/m.test(message)) {
      bump = bump === 'major' ? 'major' : 'minor'
      continue
    }
    if (/^(fix|docs|chore|refactor|perf|style|test|build|ci)(\([\w./-]+\))?:/m.test(message)) {
      bump = bump === 'minor' || bump === 'major' ? bump : 'patch'
    }
  }

  return bump
}

function increment(version, bump) {
  const parts = version.split('.').map((part) => Number(part))
  const [major, minor, patch] = parts

  if (bump === 'major') {
    return `${major + 1}.0.0`
  }

  if (bump === 'minor') {
    return `${major}.${minor + 1}.0`
  }

  return `${major}.${minor}.${patch + 1}`
}

const latestTag = getLatestTag()
const baseVersion = latestTag ? latestTag.replace(/^v/, '') : packageJson.version
const range = latestTag ? `${latestTag}..HEAD` : 'HEAD'
const commits = getCommitMessages(range)
const bump = commits.length === 0 ? 'none' : getBumpType(commits)
const version = bump === 'none' ? baseVersion : increment(baseVersion, bump)
const tag = `v${version}`

if (process.env.GITHUB_OUTPUT) {
  const lines = [
    `base_version=${baseVersion}`,
    `bump=${bump}`,
    `version=${version}`,
    `tag=${tag}`
  ]

  await import('node:fs/promises').then(({ appendFile }) =>
    appendFile(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`)
  )
}

console.log(JSON.stringify({ baseVersion, bump, version, tag }, null, 2))
