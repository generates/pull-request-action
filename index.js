#!/usr/bin/env node

const core = require('@actions/core')
const { createLogger } = require('@generates/logger')
const execa = require('execa')
const slugify = require('@sindresorhus/slugify')
const octokit = require('@octokit/request')

const logger = createLogger({ level: 'info', namespace: 'pull-request-action' })

async function run () {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
  const headers = { authorization: `token ${process.env.INPUT_TOKEN}` }
  const request = octokit.request.defaults({ headers })
  logger.debug('Repo', { owner, repo })

  // Determine the pull request title.
  const title = process.env.INPUT_TITLE
  logger.debug('Title', title)
  if (!title) throw new Error('No pull request title specified')

  // Determine the head branch.
  let head = process.env.INPUT_HEAD
  if (!head) head = slugify(title)
  logger.debug('Head', head)

  // Determine the base branch.
  let base = process.env.INPUT_BASE
  if (!base) {
    // If the base branch isn't specified, use the repo's default branch.
    const { data } = await request('GET /repos/{owner}/{repo}', { owner, repo })
    base = data.default_branch
  }
  logger.debug('Base', base)

  let pr
  try {
    // Try fetching the head branch from origin.
    logger.debug('Fetch from origin')
    await execa('git', ['fetch', 'origin', head])

    // Search for an existing pull request if the head branch exists.
    const q = `head:${head} type:pr is:open repo:${owner}/${repo}`
    const { data } = await request('GET /search/issues', { q })
    pr = data.items?.length && data.items[0]
    if (pr) logger.debug('Found existing PR', pr)

    // Check out the head branch.
    logger.debug('Checkout existing branch', head)
    await execa('git', ['checkout', head])
  } catch (err) {
    // If an error was thrown, the branch doesn't exist, so create it.
    logger.debug('Failed to fetch branch from origin', err)
    await execa('git', ['checkout', '-b', head])
  }

  // Commit changed files if necessary.
  const commitParams = ['--yes', '@generates/commit-action']
  const { INPUT_COMMIT, INPUT_MESSAGE, INPUT_FILES } = process.env
  if (INPUT_COMMIT || INPUT_MESSAGE || INPUT_FILES) {
    const token = process.env.INPUT_ACTOR ? process.env.INPUT_TOKEN : undefined
    const env = { INPUT_BRANCH: head, INPUT_TOKEN: token }
    await execa('npx', commitParams, { env })
  }

  // Push the branch to origin.
  logger.debug('Push to origin', head)
  await execa('git', ['push', 'origin', head])

  const body = process.env.INPUT_BODY
  const payload = { owner, repo, title, body, head, base }
  if (pr) {
    // Update the existing pull request and make sure it's open.
    payload.pull_number = pr.pull_number
    payload.state = 'open'
    logger.debug('Update existing PR', payload)
    await request('PUT /repos/{owner}/{repo}/pulls/{pull_number}', payload)
  } else {
    // Create the pull request if it doesn't exist.
    logger.debug('Create PR', payload)
    await request('POST /repos/{owner}/{repo}/pulls', payload)
  }
}

run().catch(err => {
  logger.error(err)
  core.setFailed(err.message)
})
