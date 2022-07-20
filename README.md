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
        uses: planningcenter/build-notifier@0.01
        with:
          build_number: ${{ steps.build_step.outputs.build_number }}
          build_version: ${{ steps.version_step.outputs.version }}
          build_type: 'Appstore'
          status: 'working'
          myToken: ${{ secrets.GITHUB_TOKEN }}
          SLACKBOT_SECRET: ${{ secrets.PICO_THE_BUILDER_SLACKBOT_SECRET }}
          SLACKBOT_TOKEN: ${{ secrets.PICO_THE_BUILDER_SLACKBOT_TOKEN }}
          SLACKBOT_CHANNEL: ${{ secrets.SLACKBOT_CHANNEL }}


      - name: notify-success
        uses: planningcenter/build-notifier@0.01
        with:
          build_number: ${{ steps.build_step.outputs.build_number }}
          build_version: ${{ steps.version_step.outputs.version }}
          build_type: 'Appstore'
          status: 'success'
          myToken: ${{ secrets.GITHUB_TOKEN }}
          SLACKBOT_SECRET: ${{ secrets.PICO_THE_BUILDER_SLACKBOT_SECRET }}
          SLACKBOT_TOKEN: ${{ secrets.PICO_THE_BUILDER_SLACKBOT_TOKEN }}
          SLACKBOT_CHANNEL: ${{ secrets.SLACKBOT_CHANNEL }}
          ts: ${{ steps.notify.outputs.ts }}

      - name: notify-failure
        if: failure() || cancelled()
        uses: planningcenter/build-notifier@0.01
        with:
          build_number: ${{ steps.build_step.outputs.build_number }}
          build_version: ${{ steps.version_step.outputs.version }}
          build_type: 'Appstore'
          status: ${{ job.status }}
          notes: 'Check details on Github.'
          myToken: ${{ secrets.GITHUB_TOKEN }}
          SLACKBOT_SECRET: ${{ secrets.PICO_THE_BUILDER_SLACKBOT_SECRET }}
          SLACKBOT_TOKEN: ${{ secrets.PICO_THE_BUILDER_SLACKBOT_TOKEN }}
          SLACKBOT_CHANNEL: ${{ secrets.SLACKBOT_CHANNEL }}
          ts: ${{ steps.notify.outputs.ts }}
