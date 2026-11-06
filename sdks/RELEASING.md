# Releasing the SDKs

Crossmart has three official SDKs, all generated from the API's OpenAPI document:

| SDK        | Directory         | Registry                                                            | Package                   | Tag in this repository |
| ---------- | ----------------- | ------------------------------------------------------------------- | ------------------------- | ---------------------- |
| TypeScript | `sdks/typescript` | [npm](https://www.npmjs.com/package/@crossmart/sdk)                 | `@crossmart/sdk`          | `sdk-ts-vX.Y.Z`        |
| Python     | `sdks/python`     | [PyPI](https://pypi.org/project/crossmart/)                         | `crossmart`               | `sdk-py-vX.Y.Z`        |
| PHP        | `sdks/php`        | [Packagist](https://packagist.org/packages/crossmart/crossmart-php) | `crossmart/crossmart-php` | `sdk-php-vX.Y.Z`       |

Releases are made by a maintainer from their own machine. The project runs no CI, so nothing is
published by GitHub Actions: the tag-triggered workflows in `.github/workflows` do not run, and
this document is the procedure.

## Versions

- The SDKs follow [semantic versioning](https://semver.org/) and are released together, with the
  same version number, from the same commit. A user can then tell which SDKs match each other and
  the API.
- The major version follows the API's path version: the SDKs for `/api/v1` are `1.x` once the API
  is declared stable. Until then they are `0.x`, where a minor bump may break the SDK's interface.
- **Minor** (`0.2.0`): the generated code changed because the API gained endpoints, fields or enum
  values, or the hand-written client gained features.
- **Patch** (`0.1.1`): fixes that change no public interface.
- **Major**: a breaking change to the SDK's interface, or a new API version (`/api/v2`). Deprecate
  first: keep the old method for at least one minor release and say so in the changelog.
- Each SDK keeps a `CHANGELOG.md` in the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
  format. Add entries under `Unreleased` in the pull request that makes the change, and turn
  `Unreleased` into the version and date when releasing.

## Before every release

From an up-to-date `main`, in a clean worktree:

```bash
pnpm install && pnpm db:generate && pnpm build:api && pnpm openapi:generate   # writes openapi.json

# TypeScript
(cd sdks/typescript && pnpm install && pnpm check:drift && pnpm lint && pnpm typecheck && pnpm test && pnpm build)

# Python
(cd sdks/python && scripts/generate.sh && git diff --exit-code -- crossmart/_generated \
  && ruff check . && ruff format --check . && mypy && pytest)

# PHP
sdks/php/scripts/check.sh
```

If a drift check fails, regenerate (`pnpm generate`, `scripts/generate.sh`, `composer generate`),
commit, and start again. Then, in one pull request, set the new version in all three packages and
date the changelogs:

- TypeScript: `version` in `sdks/typescript/package.json`
- Python: `__version__` in `sdks/python/crossmart/_version.py`
- PHP: `Crossmart::VERSION` in `sdks/php/src/Crossmart.php` (Packagist takes the version from the tag)

Merge it, and release each SDK from the merge commit.

## npm (TypeScript)

One-time setup:

1. Create the `crossmart` organization on [npmjs.com](https://www.npmjs.com/org/create), so the
   `@crossmart` scope exists, and add a second owner for recovery.
2. Turn on two-factor authentication for writes on every owner's account.

Each release:

```bash
cd sdks/typescript
npm login                        # once per machine
pnpm publish --access public     # prepack copies LICENSE; prepublishOnly lints, tests and builds
git tag sdk-ts-v0.1.0 && git push origin sdk-ts-v0.1.0
```

npm asks for the one-time password. Packages published from a laptop cannot carry
[provenance](https://docs.npmjs.com/generating-provenance-statements), which needs a supported CI
provider, so `package.json` does not ask for it.

## PyPI (Python)

One-time setup:

1. Sign in to [PyPI](https://pypi.org) with the account that should own the project, turn on
   two-factor authentication, and add a second owner after the first upload.
2. Create an API token. The first upload needs an account-wide token, because the `crossmart`
   project does not exist yet; afterwards replace it with a token scoped to the project. Keep it in
   `~/.pypirc` or a password manager, never in the repository.

   [Trusted publishing](https://docs.pypi.org/trusted-publishers/) is the alternative to tokens,
   but it needs a CI workflow to publish from, which the project does not run.

Each release:

```bash
cd sdks/python
python -m pip install build twine                # once per environment
rm -rf dist && python -m build                   # sdist and wheel
python -m twine check dist/*
python -m twine upload dist/*                    # username __token__, password: the API token
git tag sdk-py-v0.1.0 && git push origin sdk-py-v0.1.0
```

Try a release first on [TestPyPI](https://test.pypi.org) with
`twine upload --repository testpypi dist/*` when the packaging changed.

## Packagist (PHP)

Packagist reads `composer.json` at the root of a Git repository, so the PHP SDK is published from
a read-only mirror, `crossmart-io/crossmart-php`, that `git subtree split` fills from `sdks/php`.
Pull requests and issues stay in this repository.

One-time setup:

1. Create the public repository `crossmart-io/crossmart-php`, say in its description that it is a
   read-only split of `crossmart-io/crossmart`, and turn off issues and pull requests there.
2. Push the first split (below), then submit `https://github.com/crossmart-io/crossmart-php` on
   [Packagist](https://packagist.org/packages/submit) with the account that should own the
   `crossmart` vendor, and add a second maintainer.
3. Let Packagist update itself: connect its GitHub integration, or add a webhook to the mirror
   (payload URL `https://packagist.org/api/github?username=<packagist-user>`, content type
   `application/json`, secret: the Packagist API token).

Each release:

```bash
git subtree split --prefix=sdks/php -b sdk-php-split
git push git@github.com:crossmart-io/crossmart-php.git sdk-php-split:main
git tag v0.1.0 sdk-php-split
git push git@github.com:crossmart-io/crossmart-php.git v0.1.0   # Packagist reads this tag
git tag -d v0.1.0 && git branch -D sdk-php-split
git tag sdk-php-v0.1.0 && git push origin sdk-php-v0.1.0
```

The mirror's tags are plain `vX.Y.Z`, because Packagist turns each tag of the package's repository
into a version. `.gitattributes` keeps the generator, scripts and tests out of the archive users
download.

## After a release

- Check the package pages and install each package in an empty project.
- Start a new `Unreleased` section in each changelog if the release pull request did not.
