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
  include_secrets,
  slackbot_channel: slackbotChannel,
  slackbot_secret: slackbotSecret,
  slackbot_token: slackbotToken,
  status,
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
    const build = {
      appName,
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
    const { ts } = response
    const secrets = /false/.test(include_secrets) // false || 'false'
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
        notes,
        status,
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
  }[build?.type?.toLowerCase()]

  const appIcon = {
    services: ':services: ',
    music_stand: ':musicstand: ',
    church_center_app: ':cca: ',
    check_ins: ':check-ins: ',
    headcounts: ':headcounts: ',
    people: ':people: ',
  }[build?.appName?.toLowerCase()]

  const text = `${appIcon ?? ''}${buildIcon ?? ''}version ${build.version} build #${
    build.number
  } by ${actor.name}`
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
            text: `*Notes*\n${notes ?? ''}`,
          },
        ],
      },
    ],
  }
}

const buildBaseUrl = ({ serverUrl, repo }) => `${serverUrl}/${repo.owner}/${repo.repo}`

updateSlackChannel()
