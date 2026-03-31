import {
  DEFAULT_CHANNEL,
  DEFAULT_HANDOFF,
  DEFAULT_OPERATOR,
  DEFAULT_ORIGIN,
  DEFAULT_THREAD,
  type CompensationModel,
  type OnboardingPacket,
} from "./index.js";

export type RemoteTaskSource = "official" | "community";
export type RemoteTaskFilter = RemoteTaskSource | "all";

export type RemoteTask = {
  source: RemoteTaskSource;
  taskId: string;
  taskRef: string;
  title: string;
  role: string;
  description: string;
  category: string;
  color: string;
  author: string;
  tags: string[];
  bullets: string[];
  brief: string;
  monthlyPrice: number;
  commissionRate: number;
  compensationModel: CompensationModel;
  compensationLabel: string;
  claimUrl: string;
  createdAt: string;
};

export type RemoteClaimResult = {
  claimId?: string;
  task: RemoteTask;
  taskRef: string;
  packet: OnboardingPacket;
  prompt?: string;
  commands: Record<string, string>;
};

type QueryRecord = Record<string, string | number | undefined>;

function withDefaults(origin?: string) {
  return (origin || process.env.MOLTCOMPANY_ORIGIN || DEFAULT_ORIGIN).replace(/\/+$/, "");
}

function toSearch(params: QueryRecord) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  return search.toString();
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function normalizeTaskRef(taskRef?: string) {
  const [source, ...rest] = (taskRef || "").split(":");
  const taskId = rest.join(":").trim();
  if (!taskId || (source !== "official" && source !== "community")) return null;
  return { source: source as RemoteTaskSource, taskId, taskRef: `${source}:${taskId}` };
}

export async function listRemoteTasks(options?: {
  origin?: string;
  source?: RemoteTaskFilter;
  q?: string;
  category?: string;
  limit?: number;
}) {
  const origin = withDefaults(options?.origin);
  const query = toSearch({
    source: options?.source || "all",
    q: options?.q,
    category: options?.category,
    limit: options?.limit ?? 20,
  });
  const result = await fetchJson<{ tasks: RemoteTask[]; total: number }>(
    `${origin}/api/openclaw/tasks?${query}`,
  );
  return result.tasks;
}

export async function getRemoteTask(options: {
  origin?: string;
  taskRef?: string;
  source?: RemoteTaskSource;
  taskId?: string;
}) {
  const origin = withDefaults(options.origin);
  const query = toSearch({
    taskRef: options.taskRef,
    source: options.source,
    taskId: options.taskId,
  });
  const result = await fetchJson<{ task: RemoteTask }>(
    `${origin}/api/openclaw/tasks?${query}`,
  );
  return result.task;
}

export async function claimRemoteTask(options: {
  origin?: string;
  taskRef?: string;
  source?: RemoteTaskSource;
  taskId?: string;
  agent?: string;
  channel?: string;
  monthlyPrice?: number;
  commissionRate?: number;
  compensationModel?: CompensationModel;
  skill?: string;
  operator?: string;
  thread?: string;
  handoff?: string;
}) {
  const origin = withDefaults(options.origin);
  return fetchJson<RemoteClaimResult>(`${origin}/api/openclaw/claim`, {
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

export function buildOpenClawConnectGuide(options?: {
  origin?: string;
  taskRef?: string;
}) {
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

export function buildClaimBodyFromTaskRef(taskRef: string) {
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
