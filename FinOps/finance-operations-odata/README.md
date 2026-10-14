# F&O OData Sample

A read-only Finance & Operations OData tool using one F&O connection. It retains
the legacy integer connection declaration (`connections: 1`) with the F&O product
filter. Build the TypeScript source before loading the tool.

## Source and build

- `src/index.html`: complete UI markup and styles.
- `src/sample.ts`: desktop discovery, metadata, query and pagination logic.
- `src/headless.ts`: complete CommonJS headless invocation implementation.
- `package.json` and `pptb.config.json`: tool, connection and invocation metadata.
- `tsconfig.json`: strict ES2022 browser compilation using `@pptb/types`.
- `tsconfig.headless.json`: CommonJS compilation for the headless loader.

Install dependencies with `npm install`, edit `src`, then run `npm run build` in this folder with Node.js 18 or newer.
Reload the tool in ToolBox after building. Treat `dist` as generated copies.

## Run the sample

1. Save an F&O connection in Power Platform ToolBox.
2. Open **Debug → Local Development → Browse**, select
   `FinOps/finance-operations-odata`, and click **Load Tool**.
3. Select the F&O connection, then list entity sets, read metadata or query an
   available public collection.

`pptb.config.json` also declares the `finance-operations-odata-read` invocation
capability and the `dist/headless.js` headless entry. Prefill accepts `operation`
(`query`, `serviceDocument` or `metadata`), `query` and `pageSize`.

Use desktop 1.3.0 or the local `finops-connection` build containing the F&O API.
Live results depend on your environment's available entities and permissions.

## Development before package publication

Until `@pptb/types` 1.3.0 is published, use the sibling desktop checkout's installed compiler and local type configuration. From this sample folder, run:

```powershell
node ../../../pptb-desktop-app/node_modules/typescript/bin/tsc -p tsconfig.local.json
node ../../../pptb-desktop-app/node_modules/typescript/bin/tsc -p tsconfig.headless.local.json
Copy-Item src/index.html dist/index.html
```

Once the types package is published, use the standard `npm install` and `npm run build` workflow above.

## npm scripts

- `npm run build`: compile strict TypeScript and copy HTML, matching the HTML sample workflow.
- `npm test`: build first, then run behavioral tests against the compiled output with Node's test runner.
- `npm run test:built`: test existing output after using the local unpublished-types build commands above.
- `npm run validate`: validate the tool manifest using the CLI supplied by `@pptb/types`.
- `npm run finalize-package`: generate `npm-shrinkwrap.json`, matching the HTML sample packaging workflow.

Tests stub the ToolBox API boundary and do not use live credentials. They cover headless discovery/metadata/query routing, invalid inputs, error propagation, and desktop pagination/error recovery.
