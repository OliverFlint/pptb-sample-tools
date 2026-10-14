# F&O OData Sample

A read-only Finance & Operations OData tool using one F&O connection. It retains
the legacy integer connection declaration (`connections: 1`) with the F&O product
filter. No build or dependency installation is needed.

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
