# build-notifier
Github Action for build notifications


  SLACKBOT_SECRET:  slackbot app secret
  SLACKBOT_TOKEN: slackbot app token
  SLACKBOT_CHANNEL: slack channel for bot to post to
  build_number: Build number
  build_version: Build version
  build_type:  Build type  (Appstore, PlayStore, etc)
  notes: 
    description: 'additional notes'
    required: false
  status:  # id of input
    description: 'The status of the build'
    default: 'working'
  myToken:  # id of input
    description: 'The github actor token'
    required: true
  ts: # id of slack thread
    description: 'The slack thread'


Usage inside a Github Action workflow:

      - name: notify
        id: notify
        uses: ./.github/actions/slack_notifier
        with:
          build_number: ${{ steps.build_step.outputs.build_number }}
          build_version: ${{ steps.version_step.outputs.version }}
          build_type: 'Appstore'
          status: 'working'
          myToken: ${{ secrets.GITHUB_TOKEN }}
          SLACKBOT_SECRET: ${{ secrets.SLACKBOT_SECRET }}
          SLACKBOT_TOKEN: ${{ secrets.SLACKBOT_TOKEN }}
          SLACKBOT_CHANNEL: ${{ secrets.SLACKBOT_CHANNEL }}


      - name: notify-success
        uses: ./.github/actions/slack_notifier
        with:
          build_number: ${{ steps.build_step.outputs.build_number }}
          build_version: ${{ steps.version_step.outputs.version }}
          build_type: 'Appstore'
          status: 'success'
          myToken: ${{ secrets.GITHUB_TOKEN }}
          SLACKBOT_SECRET: ${{ secrets.SLACKBOT_SECRET }}
          SLACKBOT_TOKEN: ${{ secrets.SLACKBOT_TOKEN }}
          SLACKBOT_CHANNEL: ${{ secrets.SLACKBOT_CHANNEL }}
          ts: ${{ steps.notify.outputs.ts }}

      - name: notify-failure
        if: failure() || cancelled()
        uses: ./.github/actions/slack_notifier
        with:
          build_number: ${{ steps.build_step.outputs.build_number }}
          build_version: ${{ steps.version_step.outputs.version }}
          build_type: 'Appstore'
          status: ${{ job.status }}
          notes: 'Check details on Github.'
          myToken: ${{ secrets.GITHUB_TOKEN }}
          SLACKBOT_SECRET: ${{ secrets.SLACKBOT_SECRET }}
          SLACKBOT_TOKEN: ${{ secrets.SLACKBOT_TOKEN }}
          SLACKBOT_CHANNEL: ${{ secrets.SLACKBOT_CHANNEL }}
          ts: ${{ steps.notify.outputs.ts }}
