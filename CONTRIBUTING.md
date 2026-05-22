# Contributing to ios-shortcuts

Thank you for your interest in contributing to `ios-shortcuts`! We welcome contributions from everyone.

## Getting Started

To get started, follow these steps:

1. Fork the repository
1. Clone your forked repository
1. Install dependencies with `npm ci --no-fund --no-audit --no-progress`
1. Make changes
1. Test your changes
1. Submit a pull request against the `beta` branch

**Commit your changes, like `fix(shortcut): <Explain>`, and open a PR 🎉**

## Exporting a Shortcut Binary

When adding or updating a shortcut, you need to export the `.shortcut` file from the Shortcuts app and place it under the package's `src/` directory (e.g. `packages/<shortcut-name>/src/<Shortcut Name>.shortcut`).

### On macOS

1. Open the **Shortcuts** app.
1. Single-click the shortcut tile so it's highlighted (don't open it for editing).
1. From the menu bar, choose **File → Export…**.
1. Save the file as `<Shortcut Name>.shortcut` and move it into the package's `src/` directory.

> Alternatives if **File → Export…** is unavailable: drag the shortcut tile directly onto the Desktop / a Finder window, or right-click → **Share → AirDrop** to yourself.

### On iOS / iPadOS

1. Open the **Shortcuts** app.
1. Long-press the shortcut → **Share** → **Save to Files**.
1. Pick iCloud Drive (or any synced location) and move the file into the package's `src/` directory on your Mac.

Make sure the filename matches the `download` path declared in the package's `package.json` (under `nx.targets.nx-release-publish.options.download`).

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. Make sure your commit messages follow the format below:

```git
<type>(optional scope): <description>
```

Available types:

1. `chore` - changes that should not affect production user code, e.g. update dev-dependencies
1. `fix` - bug fixes, e.g. fix linting errors
1. `feat` - new features, e.g. add new command
1. `docs` - changes to documentation
1. `ci` - changes to CI configuration
1. For breaking changes, add a `BREAKING CHANGE` section to the commit message body:

```git
feat: <description>

BREAKING CHANGE: <description>
```

## Contact

If you have any questions or concerns, please contact us at `avivbens87@gmail.com`

Happy contributing!
