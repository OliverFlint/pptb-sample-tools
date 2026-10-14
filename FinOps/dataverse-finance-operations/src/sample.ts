import { element, describeError } from "./ui.js";

const runButton = element<HTMLButtonElement>("run");
const status = element("status");

// The manifest declares fixed zero-based targets: Dataverse 0, F&O 1.
async function refreshConnections() {
    const connections = await window.toolboxAPI.connections.getConnections();
    for (const [product, slot, label] of [
        ["dataverse", 0, "Dataverse accounts"],
        ["finops", 1, "F&O customers"],
    ] as const) {
        const connection = connections[slot];
        element(`${product}-connection`).textContent = connection ? `${label} · ${connection.name} · Slot ${slot + 1} · ${connection.url}` : `Choose a connection for ${label}.`;
    }
    if (connections.length !== 2 || !connections[0] || (connections[0].connectionType ?? "dataverse") !== "dataverse" || connections[1]?.connectionType !== "financeOperations") {
        throw new Error("Choose Dataverse accounts in slot 1 and F&O customers in slot 2, then try again.");
    }
}

async function readProduct(product: "dataverse" | "finops", operation: () => Promise<{ value: Record<string, unknown>[]; "@odata.nextLink"?: string }>) {
    const output = element(`${product}-result`);
    const progress = element(`${product}-status`);
    output.textContent = "Loading…";
    progress.textContent = "Reading one page…";
    try {
        const result = await operation();
        output.textContent = JSON.stringify(result, null, 2);
        progress.textContent = `Read ${result.value.length} record(s)${result["@odata.nextLink"] ? " · More pages available" : ""}`;
        return true;
    } catch (error) {
        output.textContent = describeError(error);
        progress.textContent = "Request failed";
        return false;
    }
}

runButton.addEventListener("click", async () => {
    runButton.disabled = true;
    const inputs = [...document.querySelectorAll("input")];
    inputs.forEach((input) => (input.disabled = true));
    status.textContent = "Reading both systems…";
    try {
        // Refresh displayed names/URLs after compatible connection reassignment.
        await refreshConnections();
        const dataverseQuery = element<HTMLInputElement>("dataverse-query").value.trim();
        const finopsQuery = element<HTMLInputElement>("finops-query").value.trim();
        if (!dataverseQuery || !finopsQuery) throw new Error("Enter a query for each system.");
        const results = await Promise.all([
            readProduct("dataverse", () => window.dataverseAPI.queryData(dataverseQuery, 0)),
            readProduct("finops", () => window.financeOperationsAPI.queryData(finopsQuery, { connectionTarget: 1 })),
        ]);
        status.textContent = results.every(Boolean) ? "Both systems read successfully" : "Finished with errors · See the individual results";
    } catch (error) {
        status.textContent = describeError(error);
    } finally {
        runButton.disabled = false;
        inputs.forEach((input) => (input.disabled = false));
    }
});

refreshConnections()
    .then(() => {
        status.textContent = "Ready to read both systems";
    })
    .catch((error) => {
        status.textContent = describeError(error);
    })
    .finally(() => {
        // Allow retry after fixing the selected connections.
        runButton.disabled = false;
    });
