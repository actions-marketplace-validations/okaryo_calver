# calver

`okaryo/calver` is a small GitHub Action that calculates the next Calendar Versioning tag from existing repository tags and exposes the result as outputs.

It only calculates the next version. It does not create Git tags, create GitHub Releases, push commits, update files, infer semantic version bumps from commits, or parse Conventional Commits.

## Version Format

The supported format is:

```text
{prefix}{major-version}.{yyyyMMdd}.{sequence}
```

Examples:

```text
v1.20260710.0
v1.20260710.1
1.20260710.0
```

## Inputs

| Name            | Required | Default               | Description                                                                                      |
| --------------- | -------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| `prefix`        | No       | `v`                   | Prefix prepended to the generated version. Use an empty string for versions like `1.20260710.0`. |
| `major-version` | No       | `1`                   | Major version segment. Must be a non-negative integer.                                           |
| `timezone`      | No       | `UTC`                 | IANA timezone name used to calculate the calendar date.                                          |
| `github-token`  | No       | `${{ github.token }}` | Token used to load repository tags through the GitHub API.                                       |

## Outputs

| Name                   | Description                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `version`              | Generated CalVer version, such as `v1.20260710.0`.                                             |
| `date`                 | Resolved calendar date in `yyyyMMdd` format.                                                   |
| `sequence`             | Daily release sequence number.                                                                 |
| `previous-version`     | Latest existing matching CalVer tag for the same prefix and major version, or an empty string. |
| `has-previous-version` | `true` when `previous-version` is present, otherwise `false`.                                  |

## Basic Usage

This Action reads repository tags through the GitHub API, so it needs `contents: read`. It does not create tags or releases, so `contents: write` is not required. If you omit `permissions`, GitHub uses the repository or organization default token permissions; the Action works as long as those defaults include `contents: read`.

```yaml
permissions:
  contents: read

steps:
  - uses: okaryo/calver@v1.0.0
    id: calver
    with:
      prefix: v
      major-version: 1
      timezone: UTC

  - run: echo "${{ steps.calver.outputs.version }}"
```

## Timezone Example

```yaml
- uses: okaryo/calver@v1.0.0
  id: calver
  with:
    timezone: Asia/Tokyo
```

The `timezone` input must be a valid IANA timezone name. The Action fails clearly when the value is invalid.

## Empty Prefix Example

```yaml
- uses: okaryo/calver@v1.0.0
  id: calver
  with:
    prefix: ""
    major-version: 1
```

This generates versions like:

```text
1.20260710.0
```

## Major Version

`major-version` is configured manually through Action input.

Valid values:

```text
1
2
10
```

Invalid values:

```text
v1
1.0
-1
```

## Concurrency

If your release workflow can run multiple times in parallel, consider configuring workflow concurrency:

```yaml
concurrency:
  group: production-release
  cancel-in-progress: false
```

Without concurrency, two jobs may calculate the same next version before either job creates the tag. Depending on your release process, this may not be necessary.

## Tag Loading

The Action loads tags through the GitHub API instead of local Git tags. Workflow checkouts often use shallow history, so relying on local tags can miss existing versions. GitHub API pagination is used so repositories with many tags are handled correctly.

Only exact tags matching the configured prefix and major version are considered:

```text
{prefix}{major-version}.{yyyyMMdd}.{sequence}
```

Sorting uses numeric date and sequence values, not lexicographic string order.
