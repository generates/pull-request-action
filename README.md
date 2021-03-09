# Pull Request Action
> Automate pull requests with GitHub Actions

## About



## Usage

```yml
name: Ch-ch-changes
on:
  pull_request:
    types: [labeled]
jobs:
  changes:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - name: Make Changes
        uses: some-action
      - name: Create Pull Requst
        uses: generates/pull-request-action@v0.0.1
        with:
          title: These are days of miracle and wonder
          message: A loose affiliation of millionaires and billionaires
```

## License

Hippocratic License - See [LICENSE][licenseUrl]

&nbsp;

Created by [Ian Walter](https://ianwalter.dev)

[licenseUrl]: https://github.com/generates/pull-request-action/blob/main/LICENSE
