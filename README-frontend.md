# Cased

This project was generated using [Nx](https://nx.dev). For the generated NX docs [see here](./nx-docs.md). It includes lots of important docs on generator commands and how to use the library. So you'll want to check it out.

## Quickstart

1. Spin up a codespace at https://github.com/cased/shell/codespaces
2. Start the server and visit the URL output in the terminal.

To check out nightly builds go here.

https://fluffy-fiesta-6bb8b150.pages.github.io/

### Generating Components

You can auto generate your React components with a CSS file and a boiler plate test! To generate a component in the application run the following.

```bash
npm run g:component your-component-name -- --directory app/modules
```

To generate a component in the UI library, you'll need to declare the project and an export flag to hoist it for library import.

```bash
npm run g:ui:component your-component-name -- --directory lib
```

Full docs can be found here: https://nx.dev/packages/react/generators/component

## Commands

### Add Git Hooks

If you want on commit prettier and push linting you must opt-in to the Git hooks. This can be done with the following command.

```bash
npm run install-git-hooks
```

### UI Library / Storybook

To run storybook locally simply use the following.

```bash
npm run storybook
```

### Testing

```bash
# Only test the shell repo
npm test

# Test everything with coverage
npm run test:all

# Watch testing on the shell
npm run test:shell

# Watch testing on the UI
npm run test:ui
```

### E2Es / Cypress

Simply run the following to interactively debug and run Cypress tests with a parallel. This runs the server for you as a parallel, so don't try to run it with `npm start` at the same time.

```bash
# Codespace builds may require stopping, then running the command a second time after initial setup
npm run e2e
```

Cypress will appear to hang like so:

```
Opening Cypress...
```

Visit http://127.0.0.1:8080/index.html?password=cypress to open Cypress, forwarded via https://hub.docker.com/r/jare/x11-bridge which uses https://github.com/Xpra-org/xpra-html5 under the hood. Based on our research this is currently the [state of the art approach to running Cypress in Codespaces](https://github.com/cypress-io/cypress-documentation/issues/2956).

### Linting

```bash
# Lint shell only
npm run lint

# Lint all JS
npm run lint:js

# Lint all CSS
npm run lint:css
```

### Run coverage reports

```bash
npx nx run test --project=ui --codeCoverage
```

### NX Upgrade Migrations

Don't manually upgrade NX packages or use dependabot to upgrade anything outside a patch. Instead use the [NX migration CLI](https://nx.dev/packages/nx/documents/migrate). This is an evolving tool, so be sure to check the command's documentation for best practices.

```bash
npx nx migrate latest --interactive
```

### API structure

When working with the Python APIs you can upgrade them to return camelcase instead of underscores. For example converting `my_var` into `myVar` automatically. To do so just swap `self.write` with `self.write_api` in the Python files.

`self.write({})` returns original snake case JSON object api response

`self.write_api({})` returns transformed camel case JSON object api response
