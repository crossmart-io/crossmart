# Releasing the Python SDK

The SDK is published to [PyPI](https://pypi.org/project/crossmart/) by the
[`sdk-python-release.yml`](../../.github/workflows/sdk-python-release.yml) workflow, with
[Trusted Publishing](https://docs.pypi.org/trusted-publishers/): no PyPI token is stored in GitHub.

## One-time setup

1. Sign in to PyPI with the account that should own the project, and add a second owner for recovery.
2. Add a pending trusted publisher (Account → Publishing → Add a new pending publisher), which also
   reserves the `crossmart` name on the first upload:
   - PyPI project name: `crossmart`
   - Owner: `crossmart-io`
   - Repository: `crossmart`
   - Workflow name: `sdk-python-release.yml`
   - Environment name: `pypi`
3. In the GitHub repository, create the `pypi` environment (Settings → Environments). Add required
   reviewers so each release needs an approval, and limit it to `sdk-py-v*` tags.

## Each release

1. Make sure the generated client is current: the `Python SDK` workflow passes on `main`.
2. Bump `__version__` in `crossmart/_version.py` ([semantic versioning](https://semver.org/);
   while the version is `0.x`, a minor bump may break the API) and merge it.
3. Tag the merge commit and push the tag:

   ```bash
   git tag sdk-py-v0.1.0
   git push origin sdk-py-v0.1.0
   ```

4. The workflow checks that the tag matches `__version__`, runs the checks, builds the sdist and
   wheel, and waits for the `pypi` environment's approval before publishing.
