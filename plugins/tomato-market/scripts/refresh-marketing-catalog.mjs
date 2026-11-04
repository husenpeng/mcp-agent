// Refreshes the review facts of src/host/marketing-catalog.json from the GitHub API.
//
//   node scripts/refresh-marketing-catalog.mjs           updates stars, pushedAt, and generatedAt
//   node scripts/refresh-marketing-catalog.mjs --check   changes nothing; exits 1 when a repository is gone or archived
//
// Set GITHUB_TOKEN to raise the API limit from 60 to 5000 requests an hour.
// Pinned versions, commits, and install commands are never changed here: moving
// a pin needs a fresh review, because one-click installs run what the file names.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateMarketingCatalog } from '../src/host/marketing.js'

const CATALOG = join(dirname(dirname(fileURLToPath(import.meta.url))), 'src', 'host', 'marketing-catalog.json')
const check = process.argv.includes('--check')
const document = JSON.parse(readFileSync(CATALOG, 'utf8'))
validateMarketingCatalog(document)

const headers = { accept: 'application/vnd.github+json', 'user-agent': 'tomato-market-catalog-refresh' }
if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`

const repositories = new Map()
const problems = []
for (const entry of document.entries) {
  const slug = /^https:\/\/github\.com\/([^/]+\/[^/]+)$/.exec(entry.repository)?.[1]
  if (slug === undefined) {
    problems.push(`${entry.id}: ${entry.repository} is not a GitHub repository URL`)
    continue
  }
  if (!repositories.has(slug)) {
    const response = await fetch(`https://api.github.com/repos/${slug}`, { headers, signal: AbortSignal.timeout(20_000) })
    if (response.status === 403 || response.status === 429) {
      console.error(`GitHub rate limit reached at ${slug}; nothing was written. Set GITHUB_TOKEN and retry.`)
      process.exit(2)
    }
    repositories.set(slug, response.ok ? await response.json() : { missing: response.status })
  }
  const repository = repositories.get(slug)
  if (repository.missing !== undefined) problems.push(`${entry.id}: ${slug} answered HTTP ${repository.missing}`)
  else if (repository.archived) problems.push(`${entry.id}: ${slug} is archived`)
  else {
    entry.stars = repository.stargazers_count
    entry.pushedAt = repository.pushed_at.slice(0, 10)
  }
}
for (const problem of problems) console.error(problem)
if (!check) {
  document.generatedAt = new Date().toISOString().slice(0, 10)
  validateMarketingCatalog(document)
  writeFileSync(CATALOG, `${JSON.stringify(document, undefined, 2)}\n`)
}
console.log(`${repositories.size} repositories read, ${problems.length} problems`)
process.exit(problems.length === 0 ? 0 : 1)
