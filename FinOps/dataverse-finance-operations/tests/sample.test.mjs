import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let sequence = 0;
async function loadSample(connections, { dataverseError, finopsError } = {}) {
    const elements = new Map();
    for (const id of ["run", "status", "dataverse-connection", "finops-connection", "dataverse-query", "finops-query", "dataverse-result", "finops-result", "dataverse-status", "finops-status"]) {
        elements.set(id, { textContent: "", value: id === "dataverse-query" ? "accounts?$top=5" : "CustomersV3?$top=5", disabled: false, listeners: {}, addEventListener(event, callback) { this.listeners[event] = callback; } });
    }
    globalThis.document = { getElementById: (id) => elements.get(id), querySelectorAll: () => [elements.get("dataverse-query"), elements.get("finops-query")] };
    const requests = [];
    globalThis.window = {
        toolboxAPI: { connections: { getConnections: async () => connections } },
        dataverseAPI: { queryData: async (query, target) => { requests.push({ product: "dataverse", query, target }); if (dataverseError) throw dataverseError; return { value: [{ name: "Account" }] }; } },
        financeOperationsAPI: { queryData: async (query, options) => { requests.push({ product: "financeOperations", query, target: options.connectionTarget }); if (finopsError) throw finopsError; return { value: [{ name: "Customer" }] }; } },
    };
    const ui = await readFile(new URL("../dist/ui.js", import.meta.url), "utf8");
    const source = (await readFile(new URL("../dist/sample.js", import.meta.url), "utf8")).replace('"./ui.js"', JSON.stringify(`data:text/javascript;base64,${Buffer.from(ui).toString("base64")}`));
    await import(`data:text/javascript;base64,${Buffer.from(`${source}\n// load ${sequence++}`).toString("base64")}`);
    await new Promise((resolve) => setImmediate(resolve));
    return { elements, requests, read: () => elements.get("run").listeners.click() };
}

const connections = () => [{ name: "Dataverse", url: "https://dv.test", connectionType: "dataverse" }, { name: "F&O", url: "https://fo.test", connectionType: "financeOperations" }];

test("declared targets stay fixed and labels refresh after compatible reassignment", async () => {
    const assigned = connections();
    const sample = await loadSample(assigned);
    assigned[0] = { ...assigned[0], name: "Replacement", url: "https://replacement.test" };
    await sample.read();
    assert.deepEqual(sample.requests.map(({ product, target }) => ({ product, target })), [{ product: "dataverse", target: 0 }, { product: "financeOperations", target: 1 }]);
    assert.match(sample.elements.get("dataverse-connection").textContent, /Replacement.*replacement.test/);
    assert.equal(sample.elements.get("status").textContent, "Both systems read successfully");
});

test("swapped or missing required assignments make no requests", async () => {
    for (const assigned of [connections().reverse(), [connections()[0], null]]) {
        const sample = await loadSample(assigned);
        await sample.read();
        assert.equal(sample.requests.length, 0);
        assert.match(sample.elements.get("status").textContent, /Choose Dataverse accounts/);
        assert.equal(sample.elements.get("run").disabled, false);
    }
});

for (const failing of ["dataverse", "finops"]) {
    test(`${failing} failure preserves the other product's result`, async () => {
        const sample = await loadSample(connections(), { [`${failing}Error`]: { message: "Denied", status: 403, requestId: "request-1" } });
        await sample.read();
        assert.equal(sample.requests.length, 2);
        assert.match(sample.elements.get(`${failing}-result`).textContent, /Denied\nHTTP 403\nRequest ID: request-1/);
        assert.match(sample.elements.get(`${failing === "dataverse" ? "finops" : "dataverse"}-result`).textContent, /"value"/);
        assert.equal(sample.elements.get("run").disabled, false);
    });
}
