# build-notifier
Github Action for build notifications


  PICO_THE_BUILDER_SLACKBOT_SECRET:  slackbot app secret
  
  PICO_THE_BUILDER_SLACKBOT_TOKEN: slackbot app oath token

  SLACKBOT_CHANNEL: slack channel for bot to post to

  build_number: Build number

  build_version: Build version

  build_type:  Build type  (Appstore, PlayStore, etc)

  notes: 'additional notes'

  status: 'The status of the build' default: 'working'
  myToken:  'The github actor token'
    
  ts: # id of slack thread 'The slack thread'


Usage inside a Github Action workflow:

      - name: notify
        id: notify
        uses: planningcenter/build-notifier@0.02
        with:
          build_number: ${{ steps.build_step.outputs.build_number }}
          build_type: 'Appstore'
          build_version: ${{ steps.version_step.outputs.version }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          notes: 'Lemme tell you a thing about this build'
          slackbot_channel: ${{ secrets.SLACKBOT_CHANNEL }}
          slackbot_secret: ${{ secrets.PICO_THE_BUILDER_SLACKBOT_SECRET }}
          slackbot_token: ${{ secrets.PICO_THE_BUILDER_SLACKBOT_TOKEN }}
          status: 'working'


      - name: notify-success
        uses: planningcenter/build-notifier@0.02
        with:
          status: ${{ job.status }}
          config: ${{ steps.notify.outputs.config }}

      - name: notify-failure
        if: failure() || cancelled()
        uses: planningcenter/build-notifier@0.02
        with:
          status: ${{ job.status }}
          config: ${{ steps.notify.outputs.config }}
