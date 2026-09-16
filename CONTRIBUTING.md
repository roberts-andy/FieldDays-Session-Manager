# Contributing to FieldDays Session Manager

Thank you for helping improve the FieldDays Session Manager.

## Share feedback

Use [GitHub Issues](https://github.com/roberts-andy/FieldDays-Session-Manager/issues)
to report a bug or request a feature. Before opening a new issue, search the
existing issues for similar feedback.

A useful bug report includes:

* A concise description of the problem.
* Steps that reproduce the behavior.
* The expected and actual results.
* Screenshots or error messages when relevant.

Feature requests should describe the user need, the desired outcome, and any
alternatives considered.

## Set up local development

The application is in the `SessionPlannerApp` directory and requires a current
Node.js installation.

```powershell
cd SessionPlannerApp
npm install
npx rayfin login
npm run dev
```

Open <http://localhost:5173> after the development server starts.

## Make changes

* Keep changes focused on one feature or fix.
* Follow the existing React, TypeScript, Tailwind CSS, and Rayfin patterns.
* Add or update tests when behavior changes.
* Do not commit generated environment files, credentials, deployment metadata,
  dependencies, or build output.
* Do not deploy to the shared Fabric workspace without maintainer approval.

## Validate changes

Run the complete local validation suite:

```powershell
npm run lint
npm run test
npm run build
```

The existing scaffold produces one Fast Refresh warning from
`AuthContext.tsx`. New changes should not add lint errors or warnings.

## Commit changes

Use an imperative [Conventional Commit](https://www.conventionalcommits.org/)
message, for example:

```text
feat: add session search
fix: preserve selected filters
docs: clarify local setup
```

## Submit a pull request

Create a branch from the latest `main`, push your branch, and open a pull
request. Include:

* A summary of the change.
* The reason for the change.
* Validation commands and results.
* Screenshots for visible interface changes.
* A linked issue when one exists.

Maintainers may request changes before merging.
