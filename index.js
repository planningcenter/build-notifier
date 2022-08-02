/* eslint-disable no-console */
import core from '@actions/core'
import github, { context } from '@actions/github'
import bolt from '@slack/bolt'

const getActionConfig = () => {
  const inputs = [
    'app_name',
    'build_number',
    'build_type',
    'build_version',
    'github_token',
    'notes',
    'include_secrets',
    'slackbot_channel',
    'slackbot_secret',
    'slackbot_token',
    'status',
    'title',
    'ts',
  ]
  let config = {}
  try {
    config = JSON.parse(core.getInput('config')) // what if this errors?
  } catch (e) {
    core.debug(e)
  }

  return inputs.reduce((c, input) => {
    c[input] = core.getInput(input) || c[input]
    return c
  }, config)
}

const {
  app_name: appName,
  build_number: number,
  build_type: type,
  build_version: version,
  github_token: githubToken,
  notes,
  include_secrets: includeSecrets,
  slackbot_channel: slackbotChannel,
  slackbot_secret: slackbotSecret,
  slackbot_token: slackbotToken,
  status,
  title,
  ts,
} = getActionConfig()

core.debug(getActionConfig())

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
    const commit = await getCommit()
    const { data: actor } = await getActor()
    const message = NewBuildMessage({
      actor,
      appName,
      commit,
      context: github.context,
      messageConfig,
      notes,
      number,
      status,
      title,
      type,
      version,
    })
    const method = messageConfig.ts ? 'update' : 'postMessage'
    const response = await app.client.chat[method](message)
    const { ts } = response
    const secrets = /false/.test(includeSecrets) // false || 'false'
      ? {}
      : {
          github_token: githubToken,
          slackbot_channel: slackbotChannel,
          slackbot_secret: slackbotSecret,
          slackbot_token: slackbotToken,
        }

    return core.setOutput(
      'config',
      JSON.stringify({
        app_name: appName,
        build_number: number,
        build_type: type,
        build_version: version,
        include_secrets: includeSecrets,
        notes,
        status,
        title,
        ts,
        ...secrets,
      })
    )
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

const NewBuildMessage = ({
  actor,
  appName,
  commit,
  context,
  messageConfig,
  notes,
  number,
  status,
  title,
  type,
  version,
}) => {
  const { data } = commit
  const { message } = data
  const refString = context.ref.replace('refs/heads/', '')
  const fields = [
    type && `*Type:*\n${type}`,
    number && `*Number:*\n${number}`,
    appName && `*App:*\n${appName}`,
    version && `*Version:*\n${version}`,
    `*Triggered by:*\n${actor.name}`,
    `*Ref:*\n<${buildBaseUrl(context)}/tree/${refString}|${refString}>`,
    `*SHA:*\n*<${commit.data.html_url}|${context.sha.slice(-8)}>*`,
    generateStatusMessage(status),
    `*Follow updates here*\n<${buildBaseUrl(context)}/actions/runs/${
      context.runId
    }|Link to updates>`,
    `*Commit*\n${message}`,
    notes && `*Notes*\n${notes}`,
  ]

  return {
    ...messageConfig,
    text: title,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
        },
      },
      {
        type: 'section',
        fields: fields
          .filter(f => f)
          .map(text => ({
            type: 'mrkdwn',
            text,
          })),
        accessory: {
          type: 'image',
          image_url:
            actor?.avatar_url ??
            'https://avatars.slack-edge.com/2022-03-10/3247522189504_4ef1b59856a2817b2fa8_512.png',
          alt_text: 'author image',
        },
      },
    ],
  }
}

const generateStatusMessage = (status = 'working') =>
  ({
    success: ':pico-success: *Build Succeeded*',
    failure: ':pico-fail: *Build failed*',
    working: ':pico-working: *Building*',
    cancelled: ':pico-fail: *Build cancelled*',
  }[status.toLowerCase()])

const buildBaseUrl = ({ serverUrl, repo }) => `${serverUrl}/${repo.owner}/${repo.repo}`

updateSlackChannel()
