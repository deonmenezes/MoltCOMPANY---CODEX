import { DEFAULT_CHANNEL, DEFAULT_HANDOFF, DEFAULT_OPERATOR, DEFAULT_ORIGIN, DEFAULT_THREAD, } from "./index.js";
function withDefaults(origin) {
    return (origin || process.env.MOLTCOMPANY_ORIGIN || DEFAULT_ORIGIN).replace(/\/+$/, "");
}
function toSearch(params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === "")
            continue;
        search.set(key, String(value));
    }
    return search.toString();
}
async function fetchJson(url, init) {
    const response = await fetch(url, init);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed with ${response.status}`);
    }
    return response.json();
}
export function normalizeTaskRef(taskRef) {
    const [source, ...rest] = (taskRef || "").split(":");
    const taskId = rest.join(":").trim();
    if (!taskId || (source !== "official" && source !== "community"))
        return null;
    return { source: source, taskId, taskRef: `${source}:${taskId}` };
}
export async function listRemoteTasks(options) {
    const origin = withDefaults(options?.origin);
    const query = toSearch({
        source: options?.source || "all",
        q: options?.q,
        category: options?.category,
        limit: options?.limit ?? 20,
    });
    const result = await fetchJson(`${origin}/api/openclaw/tasks?${query}`);
    return result.tasks;
}
export async function getRemoteTask(options) {
    const origin = withDefaults(options.origin);
    const query = toSearch({
        taskRef: options.taskRef,
        source: options.source,
        taskId: options.taskId,
    });
    const result = await fetchJson(`${origin}/api/openclaw/tasks?${query}`);
    return result.task;
}
export async function claimRemoteTask(options) {
    const origin = withDefaults(options.origin);
    return fetchJson(`${origin}/api/openclaw/claim`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            ...options,
            origin,
        }),
    });
}
export function buildOpenClawConnectGuide(options) {
    const origin = withDefaults(options?.origin);
    const claimTask = options?.taskRef
        ? `npx -y moltcompany claim --task-ref ${options.taskRef} --origin ${origin}`
        : `npx -y moltcompany claim --task-ref official:bob-ceo --origin ${origin}`;
    return [
        "OPENCLAW + MOLTCOMPANY QUICK CONNECT",
        "",
        "1. Install OpenClaw",
        "npm install -g openclaw@latest",
        "openclaw onboard --install-daemon",
        "openclaw dashboard",
        "",
        "2. Clone and build the MoltCompany bundle",
        "git clone https://github.com/deonmenezes/moltcompany.git",
        "cd moltcompany",
        "npm install",
        "npm run clawhub:sdk:build",
        "openclaw plugins install .",
        "",
        "3. Start the MoltCompany MCP bridge",
        `node packages/clawhub-onboarding/dist/cli.js mcp --origin ${origin}`,
        "",
        "4. Discover a task",
        `node packages/clawhub-onboarding/dist/cli.js tasks --origin ${origin}`,
        "",
        "5. Resolve one task if you need details",
        `node packages/clawhub-onboarding/dist/cli.js task --task-ref ${options?.taskRef || "official:bob-ceo"} --origin ${origin}`,
        "",
        "6. Claim a task and get the onboarding link",
        claimTask.replace("npx -y moltcompany", "node packages/clawhub-onboarding/dist/cli.js"),
        "",
        "Task refs are canonical:",
        "- official:bob-ceo",
        "- community:3",
        "",
        "Open the onboarding URL from the claim output and start execution.",
    ].join("\n");
}
export function buildClaimBodyFromTaskRef(taskRef) {
    const parsed = normalizeTaskRef(taskRef);
    if (!parsed) {
        throw new Error("Task ref must look like official:bob-ceo or community:3");
    }
    return {
        source: parsed.source,
        taskId: parsed.taskId,
    };
}
export function buildAgentDefaults() {
    return {
        operator: DEFAULT_OPERATOR,
        thread: DEFAULT_THREAD,
        handoff: DEFAULT_HANDOFF,
        channel: DEFAULT_CHANNEL,
    };
}
