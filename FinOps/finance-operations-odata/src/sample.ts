import { element, describeError } from "./ui.js";

const api = window.financeOperationsAPI;
const output = element("result");
const status = element("status");
const query = element<HTMLInputElement>("query");
const pageSize = element<HTMLInputElement>("page-size");
const nextButton = element<HTMLButtonElement>("next");
let nextLink: string | undefined;

async function run(operation: () => Promise<string | FinanceOperationsAPI.Page | FinanceOperationsAPI.ServiceDocument>) {
    const buttons = [...document.querySelectorAll("button")];
    buttons.forEach((button) => button.disabled = true);
    status.textContent = "Loading…";
    nextLink = undefined;
    try {
        const result = await operation();
        output.textContent = typeof result === "string" ? result : JSON.stringify(result, null, 2);
        nextLink = typeof result === "object" && "@odata.nextLink" in result ? result["@odata.nextLink"] : undefined;
        status.textContent = "Request succeeded";
    } catch (error) {
        output.textContent = describeError(error);
        status.textContent = "Request failed";
    } finally {
        buttons.forEach((button) => button.disabled = false);
        nextButton.disabled = !nextLink;
    }
}
element("discover").addEventListener("click", () => run(() => api.getServiceDocument()));
element("metadata").addEventListener("click", () => run(() => api.getMetadata()));
function queryPage(path: string) {
    const value = pageSize.value.trim();
    if (!value) return api.queryData(path);
    const size = Number(value);
    if (!Number.isInteger(size) || size < 1 || size > 10000) {
        throw new Error("Page size must be an integer between 1 and 10000.");
    }
    return api.queryData(path, { headers: { Prefer: `odata.maxpagesize=${size}` } });
}
element<HTMLButtonElement>("run").addEventListener("click", () => run(() => queryPage(query.value.trim())));
nextButton.addEventListener("click", () => { const link = nextLink; if (link) { query.value = link; run(() => queryPage(link)); } });
window.toolboxAPI.connections.getActiveConnection().then((connection) => {
    element("connection").textContent = connection ? `${connection.name} — ${connection.url}` : "No connection selected";
});
