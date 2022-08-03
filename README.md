# build-notifier

Github Action for build notifications

### Parameters:

Required Parameters:
- **slackbot_secret:** - Slackbot app secret - This is a org level github secret `PICO_THE_BUILDER_SLACKBOT_SECRET`. Ask platform if it's not in your repo

- **slackbot_token:** - slackbot app oath token - This is a org level github secret `PICO_THE_BUILDER_SLACKBOT_TOKEN`. Ask platform if it's not in your repo

- **slackbot_channel:** - Slack channel for the notification to be posted to. You can find this at the bottom of the "About" section of the slack channel. Example Channel ID: `C0198QJ6FP0`
- **github_token:** - The github actor token

- **title:** - The title of your notification

Optional Parameters
- **app_name:** - The name of the app being built. Acceptable values are ["services", "music_stand", "church_center_app", "check_ins", "headcounts", "people"]

- **build_number:** - The Build number of the application being built

- **build_version:** - The Version number of the application being built

- **build_type:** - The type of build

- **notes:** - Additional optional notes

- **status:** - The status of the build - default: 'working' - acceptable values: ["success", "failure", "working", "cancelled"]

- **config:** - As a way to pass values from one notify step to another, we use a config value as the output of a previous step. This config passes all the input values above that are sent and you can override any value in the config by passing it in as an input to a future step. Example: `config: ${{ steps.notify.outputs.config }}`

- **include_secrets:** - If you wish to use the config to pass from one job to another, the repository secrets included in the returned config from this action will cause github to skip returning it. To avoid this, you can set include_secrets to false and they won't be returned.

### Example Github Action Workflow Usage:

      - name: notify
      id: notify
      uses: planningcenter/build-notifier@v0.0.9
      with:
        title: ":google_play: Playstore build #${{ github.run_number }}"
        build_number: ${{ steps.build_step.outputs.build_number }}
        build_version: ${{ steps.version_step.outputs.version }}
        build_type: 'Appstore'
        status: 'working'
        github_token: ${{ secrets.MY_REPO_PAT }}
        slackbot_secret: ${{ secrets.PICO_THE_BUILDER_SLACKBOT_SECRET }}
        slackbot_token: ${{ secrets.PICO_THE_BUILDER_SLACKBOT_TOKEN }}
        slackbot_channel: ${{ secrets.SLACKBOT_CHANNEL }}


      - name: notify-success
      uses: planningcenter/build-notifier@v0.0.9
      with:
        status: 'success'
        config: ${{ steps.notify.outputs.config }}

      - name: notify-failure
      if: failure() || cancelled()
      uses: planningcenter/build-notifier@v0.0.9
      with:
        status: ${{ job.status }}
        notes: 'Check details on Github.'
        config: ${{ steps.notify.outputs.config }}
