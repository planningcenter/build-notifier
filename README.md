# build-notifier
Github Action for build notifications

  slackbot_secret:  slackbot app secret - This is a org level github secret `PICO_THE_BUILDER_SLACKBOT_SECRET`.  Ask platform if it's not in your repo
  
  slackbot_token: slackbot app oath token - This is a org level github secret `PICO_THE_BUILDER_SLACKBOT_TOKEN`.  Ask platform if it's not in your repo

  slackbot_channel: slack channel for bot to post to.  You can find this at the bottom of the "About" section of the slack channel.  Example Channel ID: `C0198QJ6FP0`

  build_number: The Build number of the application being built

  build_version: The Version number of the application being built

  build_type:  The type of build - Acceptable values are ["playstore", "appstore", "firebase", "test", "ios", "android"]
      
  notes: 'additional notes'

  status: The status of the build - default: 'working' - acceptable values: ["success", "failure", "working", "cancelled"]
    
  github_token:  The github actor token
    
  ts:  ID of slack thread 'The slack thread' - this app will populate this value and you don't need to provide it as long as you pass a `config`

  config: As a way to pass values from one notify step to another, we use a config value as the output of a previous step.  This config passes all the input values above that are sent and you can override any value in the config by passing it in as an input to a future step.  Example: `config: ${{ steps.notify.outputs.config }}`


Usage inside a Github Action workflow:

      - name: notify
      id: notify
      uses: planningcenter/build-notifier@v0.0.8
      with:
        build_number: ${{ steps.build_step.outputs.build_number }}
        build_version: ${{ steps.version_step.outputs.version }}
        build_type: 'appstore'
        status: 'working'
        github_token: ${{ secrets.MY_REPO_PAT }}
        slackbot_secret: ${{ secrets.PICO_THE_BUILDER_SLACKBOT_SECRET }}
        slackbot_token: ${{ secrets.PICO_THE_BUILDER_SLACKBOT_TOKEN }}
        slackbot_channel: ${{ secrets.SLACKBOT_CHANNEL }}


      - name: notify-success
      uses: planningcenter/build-notifier@v0.0.8
      with:
        status: 'success'
        config: ${{ steps.notify.outputs.config }}

      - name: notify-failure
      if: failure() || cancelled()
      uses: planningcenter/build-notifier@v0.0.8
      with:
        status: ${{ job.status }}
        notes: 'Check details on Github.'
        config: ${{ steps.notify.outputs.config }}

