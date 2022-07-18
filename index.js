/* eslint-disable no-console */
import bolt from '@slack/bolt'
import core from '@actions/core'
import github, { context } from '@actions/github'

// inputs
const slackbotSecret = core.getInput('SLACKBOT_SECRET')
const slackbotToken = core.getInput('SLACKBOT_TOKEN')
const slackbotChannel = core.getInput('SLACKBOT_CHANNEL')
const githubToken = core.getInput('myToken')
const version = core.getInput('build_version')
const number = core.getInput('build_number')
const type = core.getInput('build_type')
const status = core.getInput('status')
const notes = core.getInput('notes')
const ts = core.getInput('ts')

const { App } = bolt

const app = new App({
  signingSecret: slackbotSecret,
  token: slackbotToken,
})

const messageConfig = {
  channel: slackbotChannel,
}
if (ts) messageConfig.ts = ts

const octokit = github.getOctokit(githubToken)

const updateSlackChannel = async () => {
  try {
    const build = {
      type,
      number,
      status,
      version,
    }
    const commit = await getCommit()
    const { data: actor } = await getActor()
    const message = NewBuildMessage({
      messageConfig,
      commit,
      build,
      actor,
      notes,
      context: github.context,
    })
    const method = messageConfig.ts ? 'update' : 'postMessage'
    const response = await app.client.chat[method](message)
    core.setOutput('ts', response.ts)
  } catch (e) {
    console.error(e)
  }
}

const getActor = () => octokit.rest.users.getByUsername({ username: context.actor })
const getCommit = () =>
  octokit.rest.git.getCommit({
    ...github.context.repo,
    commit_sha: github.context.sha,
  })

const NewBuildMessage = ({ messageConfig, commit, build, actor, notes, context }) => {
  const { data } = commit
  const { message } = data
  const statusMessage = {
    success: ':pico-success: *Build Succeeded*',
    failure: ':pico-fail: *Build failed*',
    working: ':pico-working: *Building*',
    cancelled: ':pico-fail: *Build cancelled*',
  }
  const buildIcon = {
    playstore: ':googleplay: ',
    appstore: ':app_store: ',
    firebase: ':firebase: ',
    test: ':firebase: ',
    ios: ':ios: ',
    android: ':android: ',
  }[build?.type.toLowerCase()]

  const text = `${buildIcon ?? ''}${build.type} build #${build.number} by ${actor.name}`
  const refString = context.ref.replace('refs/heads/', '')

  return {
    ...messageConfig,
    text,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Version:*\n${build.version}`,
          },
          {
            type: 'mrkdwn',
            text: `*Ref:*\n<${buildBaseUrl(context)}/tree/${refString}|${refString}>`,
          },
          {
            type: 'mrkdwn',
            text: `*SHA:*\n*<${commit.data.html_url}|${context.sha.slice(-8)}>*`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${
              statusMessage[build.status?.toLowerCase()] ?? statusMessage['working']
            }`,
          },
          {
            type: 'mrkdwn',
            text: `*Follow updates here*\n<${buildBaseUrl(context)}/actions/runs/${
              context.runId
            }|Link to updates>`,
          },
        ],
        accessory: {
          type: 'image',
          image_url:
            actor?.avatar_url ??
            'https://avatars.slack-edge.com/2022-03-10/3247522189504_4ef1b59856a2817b2fa8_512.png',
          alt_text: 'author image',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Commit*\n${message}`,
          },
          {
            type: 'mrkdwn',
            text: `*Notes*\n${notes}`,
          },
        ],
      },
    ],
  }
}

const buildBaseUrl = ({ serverUrl, repo }) => `${serverUrl}/${repo.owner}/${repo.repo}`

updateSlackChannel()
