export function element<T extends HTMLElement = HTMLElement>(id: string): T {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing UI element: ${id}`);
    return node as T;
}

export function describeError(error: unknown): string {
    if (typeof error !== "object" || error === null) return String(error);
    const details = error as Partial<FinanceOperationsAPI.RequestError>;
    return [details.message || String(error), details.status && `HTTP ${details.status}`, details.requestId && `Request ID: ${details.requestId}`, details.retryAfter && `Retry after: ${details.retryAfter}`].filter(Boolean).join("\n");
}
