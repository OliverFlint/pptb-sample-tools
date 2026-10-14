# Dataverse + F&O Explorer

A read-only desktop example that queries both products in one tool session. Build the TypeScript source before loading the tool.

## Source and build

- `src/index.html`: complete UI markup and styles.
- `src/sample.ts`: connection metadata, fixed-target API calls and independent error handling.
- `package.json`: tool metadata and typed connection slot declaration.
- `tsconfig.json`: strict ES2022 TypeScript compilation using `@pptb/types`.
- `package.json` scripts: compile TypeScript and copy HTML using `shx`.

Install dependencies with `npm install`, edit `src`, then run `npm run build` in this folder with Node.js 18 or newer.
Reload the tool in ToolBox after building. Treat `dist` as generated copies.

## Run the sample

1. Start Power Platform ToolBox and save a Dataverse connection and an F&O connection.
2. Open **Debug → Local Development → Browse**, select `FinOps/dataverse-finance-operations`, and click **Load Tool**.
3. Choose a Dataverse connection for **Dataverse accounts** (slot 1) and an F&O connection for **F&O customers** (slot 2). The picker shows each slot's purpose, filters by its product, and requires both assignments.
4. Click **Read both systems**. The defaults read five Dataverse accounts and five F&O `CustomersV3` records. Change the queries if your environments use different collections or permissions.

The manifest opts into two fixed typed required slots. Launch and runtime reassignment reject wrong products, missing assignments and extra slots. Existing integer and `{ min, max }` declarations remain the default/fallback for other tools; they can still allow either product in any slot through tool-level `connectionTypes`.

`dist/sample.js` reads connection metadata using `toolboxAPI.connections.getConnections()` to display current names/URLs and defensively check the declared order. It passes fixed zero-based targets to each API:

```js
window.dataverseAPI.queryData(dataverseQuery, 0);
window.financeOperationsAPI.queryData(finopsQuery, { connectionTarget: 1 });
```

Connection names/URLs are refreshed on each read to respect compatible reassignment. Targets retain their declared indexes. Requests run concurrently and report failures separately, so one failed system does not hide the other's result. Output uses text content rather than rendering server data as HTML.

The tool reads one page from each system. It does not match, synchronize, or modify records. The desktop repository retains a snapshot under `tests/e2e/tool-fixtures/dataverse-finance-operations` for its self-contained Electron regression test, which exercises declared-order routing, compatible reassignment, independent errors and wrong-slot rejection through the real preload/IPC/API managers with simulated HTTP responses. Separate legacy count-declaration coverage retains either-order behavior. Live credentials and environments are still needed for a live smoke test.

Connection slots are scheduled for desktop release **1.3.0**, and this example declares `features.minAPI: "1.3.0"`. Use the local `finops-connection` build while the release is being prepared. The updated types and validator packages have not been published. See the [author guide](https://github.com/OliverFlint/pptb-desktop-app/blob/finops-connection/docs/N_CONNECTION_TOOL_AUTHOR_GUIDE.md) and [release checklist](https://github.com/OliverFlint/pptb-desktop-app/blob/finops-connection/docs/CONNECTION_SLOT_DEFINITIONS_IMPLEMENTATION_PLAN.md).

## Development before package publication

Until `@pptb/types` 1.3.0 is published, use the sibling desktop checkout's installed compiler and local type configuration. From this sample folder, run:

```powershell
node ../../../pptb-desktop-app/node_modules/typescript/bin/tsc -p tsconfig.local.json
Copy-Item src/index.html dist/index.html
```

Once the types package is published, use the standard `npm install` and `npm run build` workflow above.

## npm scripts

- `npm run build`: compile strict TypeScript and copy HTML, matching the HTML sample workflow.
- `npm test`: build first, then run behavioral tests against the compiled output with Node's test runner.
- `npm run test:built`: test existing output after using the local unpublished-types build commands above.
- `npm run validate`: validate the tool manifest using the CLI supplied by `@pptb/types`.
- `npm run finalize-package`: generate `npm-shrinkwrap.json`, matching the HTML sample packaging workflow.

Tests stub the ToolBox API boundary and do not use live credentials. They cover fixed connection targets, compatible reassignment, rejection before requests, and independent failures on either product.
