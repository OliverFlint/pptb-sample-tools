interface Input {
    operation?: "query" | "serviceDocument" | "metadata";
    query?: string;
    pageSize?: number;
}

// Compiled separately as CommonJS for the desktop headless loader.
export async function invokeHeadless(input: Input) {
    if (!globalThis.financeOperationsAPI) {
        throw new Error("This sample requires a PPTB build with Finance & Operations API support.");
    }
    const operation = input.operation ?? "query";
    if (operation === "serviceDocument") return { serviceDocument: await globalThis.financeOperationsAPI.getServiceDocument() };
    if (operation === "metadata") return { metadata: await globalThis.financeOperationsAPI.getMetadata() };
    if (operation !== "query") throw new Error("Unsupported operation. Use query, serviceDocument or metadata.");
    if (typeof input.query !== "string" || !input.query.trim()) throw new Error("Provide a query such as CustomersV3?$top=5.");
    let options: FinanceOperationsAPI.Options | undefined;
    if (input.pageSize !== undefined) {
        if (!Number.isInteger(input.pageSize) || input.pageSize < 1 || input.pageSize > 10000) throw new Error("Page size must be an integer between 1 and 10000.");
        options = { headers: { Prefer: `odata.maxpagesize=${input.pageSize}` } };
    }
    return { page: await globalThis.financeOperationsAPI.queryData(input.query.trim(), options) };
}
