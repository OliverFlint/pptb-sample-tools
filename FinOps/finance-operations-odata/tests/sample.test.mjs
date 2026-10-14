import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

const { invokeHeadless } = createRequire(import.meta.url)("../dist/headless.js");

test("headless discovery, metadata and queries use the injected API", async () => {
    const requests = [];
    globalThis.financeOperationsAPI = {
        getServiceDocument: async () => ({ value: [{ name: "CustomersV3" }] }),
        getMetadata: async () => "<metadata/>",
        queryData: async (...args) => { requests.push(args); return { value: [{ account: "1" }] }; },
    };
    assert.deepEqual(await invokeHeadless({ operation: "serviceDocument" }), { serviceDocument: { value: [{ name: "CustomersV3" }] } });
    assert.deepEqual(await invokeHeadless({ operation: "metadata" }), { metadata: "<metadata/>" });
    assert.deepEqual(await invokeHeadless({ query: " CustomersV3?$top=5 ", pageSize: 5 }), { page: { value: [{ account: "1" }] } });
    assert.deepEqual(requests, [["CustomersV3?$top=5", { headers: { Prefer: "odata.maxpagesize=5" } }]]);
});

test("invalid headless inputs reject before querying", async () => {
    let calls = 0;
    globalThis.financeOperationsAPI = { queryData: async () => { calls++; } };
    for (const input of [{}, { query: " " }, { operation: "unsupported" }, ...[0, 10001, 1.5].map((pageSize) => ({ query: "CustomersV3", pageSize }))]) {
        await assert.rejects(() => invokeHeadless(input));
    }
    assert.equal(calls, 0);
});

test("headless errors propagate to the caller", async () => {
    const failure = new Error("Access denied");
    globalThis.financeOperationsAPI = { queryData: async () => { throw failure; } };
    await assert.rejects(() => invokeHeadless({ query: "CustomersV3" }), (error) => error === failure);
});

test("desktop pagination uses the returned next link and recovers after a failed request", async () => {
    const elements = new Map();
    for (const id of ["result", "status", "query", "page-size", "next", "discover", "metadata", "run", "connection"]) {
        elements.set(id, { textContent: "", value: id === "query" ? "CustomersV3?$top=5" : "", disabled: false, listeners: {}, addEventListener(event, callback) { this.listeners[event] = callback; } });
    }
    const buttons = ["next", "discover", "metadata", "run"].map((id) => elements.get(id));
    globalThis.document = { getElementById: (id) => elements.get(id), querySelectorAll: () => buttons };
    const requests = [];
    globalThis.window = {
        toolboxAPI: { connections: { getActiveConnection: async () => ({ name: "F&O", url: "https://fo.test" }) } },
        financeOperationsAPI: { queryData: async (path) => { requests.push(path); if (requests.length === 2) throw { message: "Denied", status: 403 }; return { value: [], "@odata.nextLink": "CustomersV3?$skiptoken=next" }; } },
    };
    const ui = await readFile(new URL("../dist/ui.js", import.meta.url), "utf8");
    const source = (await readFile(new URL("../dist/sample.js", import.meta.url), "utf8")).replace('"./ui.js"', JSON.stringify(`data:text/javascript;base64,${Buffer.from(ui).toString("base64")}`));
    await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
    await elements.get("run").listeners.click();
    assert.equal(elements.get("next").disabled, false);
    elements.get("next").listeners.click();
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(requests, ["CustomersV3?$top=5", "CustomersV3?$skiptoken=next"]);
    assert.match(elements.get("result").textContent, /Denied\nHTTP 403/);
    assert.equal(elements.get("run").disabled, false);
    assert.equal(elements.get("next").disabled, true);
});
