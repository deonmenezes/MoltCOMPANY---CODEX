export type CompensationModel = "completion" | "holdback" | "custom";
export type TaskSource = "official" | "community" | "draft";

export const DEFAULT_ORIGIN = "https://www.moltcompany.ai";
export const DEFAULT_AGENT = "openai-agent";
export const DEFAULT_CHANNEL = "chat";
export const DEFAULT_MONTHLY_PRICE = 40;
export const DEFAULT_COMMISSION_RATE = 20;
export const DEFAULT_SKILL = "agent-onboarding-link";
export const DEFAULT_OPERATOR = "Dispatch Lead";
export const DEFAULT_THREAD = "Shared task channel";
export const DEFAULT_HANDOFF =
  "Return a completion summary with blockers, outcome, and next action.";

export type ClaimLinkOptions = {
  origin?: string;
  source?: TaskSource;
  taskId: string;
  claimPath?: string;
  absolute?: boolean;
};

export type OnboardingLinkOptions = {
  origin?: string;
  source: TaskSource;
  taskId: string;
  claimId?: string;
  role: string;
  channel?: string;
  agent?: string;
  monthlyPrice?: number;
  commissionRate?: number;
  compensationModel?: CompensationModel;
  skill?: string;
  handoff?: string;
  thread?: string;
  operator?: string;
};

export type OnboardingPacketOptions = OnboardingLinkOptions & {
  title: string;
  description?: string;
  brief?: string;
  bullets?: string[];
  claimOrigin?: string;
  claimPath?: string;
  createdAt?: string;
};

export type OnboardingPacket = {
  title: string;
  description: string;
  source: TaskSource;
  taskId: string;
  claimId?: string;
  role: string;
  agent: string;
  channel: string;
  skill: string;
  claimUrl: string;
  onboardingUrl: string;
  compensationLabel: string;
  operator: string;
  thread: string;
  handoff: string;
  bullets: string[];
  brief: string;
  createdAt: string;
};

function normalizeOrigin(origin?: string) {
  return (origin || DEFAULT_ORIGIN).replace(/\/+$/, "");
}

function trimOrUndefined(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function taskQueryKey(source: TaskSource) {
  if (source === "community") return "community";
  if (source === "draft") return "draft";
  return "model";
}

export function formatCompensation(
  monthlyPrice = DEFAULT_MONTHLY_PRICE,
  commissionRate = DEFAULT_COMMISSION_RATE,
  compensationModel: CompensationModel = "completion",
) {
  const suffix =
    compensationModel === "holdback"
      ? `${commissionRate}% held until completion`
      : compensationModel === "custom"
        ? `${commissionRate}% custom completion commission`
        : `${commissionRate}% commission tied to completion`;

  return `$${monthlyPrice}/mo base | ${suffix}`;
}

export function buildOnboardingLink({
  origin,
  source,
  taskId,
  claimId,
  role,
  channel = DEFAULT_CHANNEL,
  agent = DEFAULT_AGENT,
  monthlyPrice = DEFAULT_MONTHLY_PRICE,
  commissionRate = DEFAULT_COMMISSION_RATE,
  compensationModel = "completion",
  skill = DEFAULT_SKILL,
  handoff,
  thread,
  operator,
}: OnboardingLinkOptions) {
  const params = new URLSearchParams({
    role,
    channel,
    agent,
    monthly: String(monthlyPrice),
    commission: String(commissionRate),
    compensation: compensationModel,
    skill,
    [taskQueryKey(source)]: taskId,
  });

  const finalHandoff = trimOrUndefined(handoff);
  const finalThread = trimOrUndefined(thread);
  const finalOperator = trimOrUndefined(operator);

  if (finalHandoff) params.set("handoff", finalHandoff);
  if (finalThread) params.set("thread", finalThread);
  if (finalOperator) params.set("operator", finalOperator);
  if (claimId) params.set("claim", claimId);

  return `${normalizeOrigin(origin)}/onboarding?${params.toString()}`;
}

export function buildClaimLink(taskId: string, source?: TaskSource): string;
export function buildClaimLink(options: ClaimLinkOptions): string;
export function buildClaimLink(
  taskIdOrOptions: string | ClaimLinkOptions,
  source: TaskSource = "official",
) {
  const options: ClaimLinkOptions =
    typeof taskIdOrOptions === "string"
      ? { taskId: taskIdOrOptions, source }
      : taskIdOrOptions;

  const params = new URLSearchParams({
    [taskQueryKey(options.source || "official")]: options.taskId,
  });

  const path = `${options.claimPath || "/deploy"}?${params.toString()}`;
  if (!options.absolute) return path;

  return `${normalizeOrigin(options.origin)}${path}`;
}

export function buildGuestEmail(name: string, ip: string) {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "guest";

  const token =
    Buffer.from(ip || "local", "utf8").toString("hex").slice(0, 12) || "local";

  return `${slug}-${token}@guest.moltcompany.ai`;
}

function buildDefaultBrief(options: OnboardingPacketOptions) {
  return [
    "# TASK OFFER",
    `Title: ${options.title}`,
    `Role: ${options.role}`,
    `Source: ${options.source}`,
    `Task ID: ${options.taskId}`,
    ...(options.claimId ? [`Claim ID: ${options.claimId}`] : []),
    `Compensation: ${formatCompensation(options.monthlyPrice, options.commissionRate, options.compensationModel)}`,
    `Operator: ${options.operator || DEFAULT_OPERATOR}`,
    `Thread: ${options.thread || DEFAULT_THREAD}`,
    "",
    "# HANDOFF",
    options.handoff || DEFAULT_HANDOFF,
  ].join("\n");
}

export function createOnboardingPacket(
  options: OnboardingPacketOptions,
): OnboardingPacket {
  const operator = options.operator || DEFAULT_OPERATOR;
  const thread = options.thread || DEFAULT_THREAD;
  const handoff = options.handoff || DEFAULT_HANDOFF;
  const agent = options.agent || DEFAULT_AGENT;
  const channel = options.channel || DEFAULT_CHANNEL;
  const skill = options.skill || DEFAULT_SKILL;
  const monthlyPrice = options.monthlyPrice ?? DEFAULT_MONTHLY_PRICE;
  const commissionRate = options.commissionRate ?? DEFAULT_COMMISSION_RATE;
  const compensationModel = options.compensationModel || "completion";
  const createdAt = options.createdAt || new Date().toISOString();

  return {
    title: options.title,
    description:
      options.description || "Launch-ready onboarding packet for an AI agent.",
    source: options.source,
    taskId: options.taskId,
    claimId: options.claimId,
    role: options.role,
    agent,
    channel,
    skill,
    claimUrl: buildClaimLink({
      origin: options.claimOrigin || options.origin,
      source: options.source,
      taskId: options.taskId,
      claimPath: options.claimPath,
      absolute: true,
    }),
    onboardingUrl: buildOnboardingLink({
      origin: options.origin,
      source: options.source,
      taskId: options.taskId,
      claimId: options.claimId,
      role: options.role,
      agent,
      channel,
      monthlyPrice,
      commissionRate,
      compensationModel,
      skill,
      handoff,
      thread,
      operator,
    }),
    compensationLabel: formatCompensation(
      monthlyPrice,
      commissionRate,
      compensationModel,
    ),
    operator,
    thread,
    handoff,
    bullets:
      options.bullets?.length
        ? options.bullets
        : [
            "Open the onboarding URL immediately.",
            "Follow the attached brief before improvising.",
            "Return a final completion handoff in the target thread.",
          ],
    brief: options.brief || buildDefaultBrief(options),
    createdAt,
  };
}

export function buildAgentLaunchPrompt(
  packetOrOptions: OnboardingPacket | OnboardingPacketOptions,
) {
  const packet =
    "onboardingUrl" in packetOrOptions
      ? packetOrOptions
      : createOnboardingPacket(packetOrOptions);

  return [
    "Open the onboarding packet and start the task.",
    "",
    `Title: ${packet.title}`,
    `Role: ${packet.role}`,
    ...(packet.claimId ? [`Claim ID: ${packet.claimId}`] : []),
    `Claim URL: ${packet.claimUrl}`,
    `Onboarding URL: ${packet.onboardingUrl}`,
    `Compensation: ${packet.compensationLabel}`,
    `Operator: ${packet.operator}`,
    `Thread: ${packet.thread}`,
    `Handoff: ${packet.handoff}`,
    "",
    "Attached brief:",
    packet.brief,
  ].join("\n");
}

export * from "./remote.js";

export type AgentRunner = "openclaw" | "openai-agent" | "codex" | "custom-agent";

export type ListTasksOptions = {
  origin?: string;
  source?: "all" | "official" | "community";
  search?: string;
  category?: string;
  limit?: number;
};

export type GetTaskOptions = {
  origin?: string;
  taskRef?: string;
  source?: "official" | "community";
  taskId?: string;
};

export type ClaimTaskOptions = {
  origin?: string;
  source: "official" | "community";
  taskId: string;
  agent?: AgentRunner;
  channel?: string;
  operator?: string;
  thread?: string;
  handoff?: string;
  monthlyPrice?: number;
  commissionRate?: number;
  compensationModel?: CompensationModel;
  skill?: string;
};

export async function listTasks({
  origin,
  source = "all",
  search,
  category,
  limit = 20,
}: ListTasksOptions = {}) {
  const { listRemoteTasks } = await import("./remote.js");
  const tasks = await listRemoteTasks({
    origin,
    source,
    q: search,
    category,
    limit,
  });

  return {
    tasks,
    total: tasks.length,
  };
}

export async function getTask({
  origin,
  taskRef,
  source,
  taskId,
}: GetTaskOptions) {
  const { getRemoteTask } = await import("./remote.js");
  return getRemoteTask({
    origin,
    taskRef,
    source,
    taskId,
  });
}

export async function claimTask({
  origin,
  source,
  taskId,
  agent = "openclaw",
  channel = DEFAULT_CHANNEL,
  operator = DEFAULT_OPERATOR,
  thread = DEFAULT_THREAD,
  handoff = DEFAULT_HANDOFF,
  monthlyPrice,
  commissionRate,
  compensationModel = "completion",
  skill = "openclaw-task-pickup",
}: ClaimTaskOptions) {
  const { claimRemoteTask } = await import("./remote.js");
  return claimRemoteTask({
    origin,
    source,
    taskId,
    agent,
    channel,
    operator,
    thread,
    handoff,
    monthlyPrice,
    commissionRate,
    compensationModel,
    skill,
  });
}
