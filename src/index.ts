/* eslint-disable no-console */
import * as core from '@actions/core'
import * as github from '@actions/github'
import { Context } from '@actions/github/lib/context.js'
import { OctokitResponse } from '@octokit/types'
import * as bolt from '@slack/bolt'
const { context } = github

type ActionConfig = {
  app_name: string
  build_number: string
  build_type: string
  build_version: string
  github_token: string
  notes: string
  include_secrets: string
  slackbot_channel: string
  slackbot_secret: string
  slackbot_token: string
  status: string
  title: string
  ts: string
  ios_build_url: string
  android_build_url: string
}

const inputs: Array<keyof ActionConfig> = [
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
  'ios_build_url',
  'android_build_url',
]

const getActionConfig = (): ActionConfig => {
  const configInput = core.getInput('config')
  // Handle empty/missing config input gracefully
  let config: ActionConfig = configInput ? JSON.parse(configInput) : ({} as ActionConfig)

  return inputs.reduce((c, input) => {
    const value = core.getInput(input)

    c[input] = value || c[input] || ''

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
  ios_build_url: iosBuildUrl,
  android_build_url: androidBuildUrl,
} = getActionConfig()

core.debug(JSON.stringify(getActionConfig(), null, 2))

const { App } = bolt

const app = new App({
  signingSecret: slackbotSecret,
  token: slackbotToken,
})

const messageConfig: MessageConfig = {
  channel: slackbotChannel,
  ts,
}

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
      iosBuildUrl,
      androidBuildUrl,
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

const getCommit = async () => {
  const isPullRequest = context.eventName === 'pull_request'
  const headSha = isPullRequest ? context.payload.pull_request?.head.sha : github.context.sha

  return octokit.rest.git.getCommit({
    ...github.context.repo,
    commit_sha: headSha,
  })
}

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
  iosBuildUrl,
  androidBuildUrl,
}: {
  actor: Actor['data']
  appName: string
  commit: Commit
  context: Context
  messageConfig: MessageConfig
  iosBuildUrl: string
  androidBuildUrl: string
  notes: any
  number: any
  status: any
  title: any
  type: any
  version: any
}) => {
  const { data } = commit
  const { message } = data
  const refString = context.ref.replace('refs/heads/', '')
  const isEasBuild = Boolean(iosBuildUrl || androidBuildUrl)
  const showCommitMessage = !isEasBuild || type !== 'Production'

  const fields = [
    type && `*Type:*\n${type}`,
    number && `*Number:*\n${number}`,
    appName && `*App:*\n${appName}`,
    version && `*Version:*\n${version}`,
    !isEasBuild && `*Triggered by:*\n${actor.name}`,
    `*Ref:*\n<${buildBaseUrl(context)}/tree/${refString}|${refString}>`,
    `*SHA:*\n*<${commit.data.html_url}|${context.sha.slice(-8)}>*`,
    showCommitMessage && `*Commit*\n${message}`,
    notes && `*Notes*\n${notes}`,
    !isEasBuild && generateStatusMessage(status),
    !isEasBuild &&
      `*Follow updates here*\n<${buildBaseUrl(context)}/actions/runs/${
        context.runId
      }|Link to updates>`,
    iosBuildUrl && `*iOS Build*\n<${iosBuildUrl}|Watch :ios: build>`,
    androidBuildUrl && `*Android Build*\n<${androidBuildUrl}|Watch :android: build>`,
  ]

  return {
    ...messageConfig,
    text: title,
    unfurl_links: false,
    unfurl_media: false,
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
  })[status.toLowerCase()]

const buildBaseUrl = ({
  serverUrl,
  repo,
}: {
  serverUrl: string
  repo: { owner: string; repo: string }
}) => `${serverUrl}/${repo.owner}/${repo.repo}`

updateSlackChannel()

type MessageConfig = {
  channel: string
  ts: string
}

type Actor = OctokitResponse<{
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string | null
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
  name: string | null
}>

type Commit = OctokitResponse<{
  sha: string
  node_id: string
  url: string
  author: {
    date: string
    email: string
    name: string
  }
  committer: {
    date: string
    email: string
    name: string
  }
  message: string
  tree: {
    sha: string
    url: string
  }
  html_url: string
}>
