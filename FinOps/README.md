# Finance & Operations samples

These read-only tools use the same strict TypeScript workflow as the HTML sample
in `new`: edit `src`, compile with `tsc`, and copy HTML with `shx`. Use Power Platform ToolBox 1.3.0 or the
local `finops-connection` development build while that release is being prepared.

- [F&O OData Sample](finance-operations-odata/README.md): one F&O connection,
  service document, metadata and entity queries, with a headless entry.
- [Dataverse + F&O Explorer](dataverse-finance-operations/README.md): two required
  typed connection slots and independent concurrent reads from both products.

Open **Debug → Local Development → Browse**, select the individual tool folder,
and click **Load Tool**. Save the required connections in ToolBox first.

Install dependencies and run `npm run build` inside each tool folder before loading
it. The build emits browser ES modules into `dist`; the OData tool also compiles
its headless TypeScript entry as CommonJS. See each README for local unpublished
types setup. Reload the tool after rebuilding.
