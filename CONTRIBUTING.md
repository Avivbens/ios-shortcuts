# Contributing to ios-shortcuts

Thank you for your interest in contributing to `ios-shortcuts`! We welcome contributions from everyone.

## Getting Started

To get started, follow these steps:

1. Fork the repository
1. Clone your forked repository
1. Install dependencies with `pnpm install --frozen-lockfile` (pnpm is pinned via `packageManager`, run `corepack enable` if `pnpm` is missing)
1. Make changes
1. Test your changes
1. Submit a pull request against the `master` branch

**Commit your changes, like `fix(shortcut): <Explain>`, and open a PR 🎉**

## Generating New Libraries

```bash
nx g @ios-shortcuts/workspace:generate-library <your-library-name>
```

Libraries are pnpm workspace packages named `@ios-shortcuts/<your-library-name>`. To use one, declare it in the consuming shortcut's `package.json` and run `pnpm install`:

```json
"dependencies": {
  "@ios-shortcuts/<your-library-name>": "workspace:*"
}
```

## Writing a Shortcut

Each shortcut is TypeScript. `projects/packages/<project>/src/main.ts` exports `shortcut({ version })`, built from the actions in `@ios-shortcuts/shortcut`, and `shortcut.config.ts` holds its display name.

```bash
pnpm exec nx run <project>:build   # writes dist/<project>/<project>.plist
pnpm exec nx run <project>:serve   # signs it on a Mac signed into iCloud, then opens it in Shortcuts
```

Signed `.shortcut` files are never committed - each release carries its own (see [Releasing a Shortcut](#releasing-a-shortcut)).

### Porting a Shortcut From the Shortcuts App

1. Export it: on macOS, single-click its tile in **Shortcuts** and choose **File → Export…**; on iOS, long-press it, then **Share → Save to Files**.
1. Save the export anywhere in the repo (git ignores `*.shortcut`) and decode it as a reference for `src/main.ts`:

```bash
pnpm run unwrap "<Shortcut Name>.shortcut"   # path from the repo root, writes dist/<Shortcut Name>.unwrapped.plist
```

## Releasing a Shortcut

Merging to `master` cuts a `release/<project>/<version>` tag and its GitHub release. Signing needs a Mac signed into iCloud, so the signed file is attached from your Mac, never from CI:

```bash
git fetch --tags
git switch --detach release/<project>/<version>
pnpm install --frozen-lockfile
pnpm run attach-asset release/<project>/<version>
```

The release run also comments these commands, filled in with the new tags, on every PR it released.

`attach-asset` signs the shortcut, uploads it to the release as `<Display.Name>.shortcut` (its display name, with the dots GitHub puts in place of spaces, so an update replaces the installed copy), and dispatches the **Sync README Links** workflow. That workflow points the README table and `shortcuts.json` at the new file, and installed copies then offer the update.

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
