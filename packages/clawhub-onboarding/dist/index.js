export const DEFAULT_ORIGIN = "https://www.moltcompany.ai";
export const DEFAULT_AGENT = "openai-agent";
export const DEFAULT_CHANNEL = "chat";
export const DEFAULT_MONTHLY_PRICE = 40;
export const DEFAULT_COMMISSION_RATE = 20;
export const DEFAULT_SKILL = "agent-onboarding-link";
export const DEFAULT_OPERATOR = "Dispatch Lead";
export const DEFAULT_THREAD = "Shared task channel";
export const DEFAULT_HANDOFF = "Return a completion summary with blockers, outcome, and next action.";
function normalizeOrigin(origin) {
    return (origin || DEFAULT_ORIGIN).replace(/\/+$/, "");
}
function trimOrUndefined(value) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
}
function taskQueryKey(source) {
    if (source === "community")
        return "community";
    if (source === "draft")
        return "draft";
    return "model";
}
export function formatCompensation(monthlyPrice = DEFAULT_MONTHLY_PRICE, commissionRate = DEFAULT_COMMISSION_RATE, compensationModel = "completion") {
    const suffix = compensationModel === "holdback"
        ? `${commissionRate}% held until completion`
        : compensationModel === "custom"
            ? `${commissionRate}% custom completion commission`
            : `${commissionRate}% commission tied to completion`;
    return `$${monthlyPrice}/mo base | ${suffix}`;
}
export function buildOnboardingLink({ origin, source, taskId, claimId, role, channel = DEFAULT_CHANNEL, agent = DEFAULT_AGENT, monthlyPrice = DEFAULT_MONTHLY_PRICE, commissionRate = DEFAULT_COMMISSION_RATE, compensationModel = "completion", skill = DEFAULT_SKILL, handoff, thread, operator, }) {
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
    if (finalHandoff)
        params.set("handoff", finalHandoff);
    if (finalThread)
        params.set("thread", finalThread);
    if (finalOperator)
        params.set("operator", finalOperator);
    if (claimId)
        params.set("claim", claimId);
    return `${normalizeOrigin(origin)}/onboarding?${params.toString()}`;
}
export function buildClaimLink(taskIdOrOptions, source = "official") {
    const options = typeof taskIdOrOptions === "string"
        ? { taskId: taskIdOrOptions, source }
        : taskIdOrOptions;
    const params = new URLSearchParams({
        [taskQueryKey(options.source || "official")]: options.taskId,
    });
    const path = `${options.claimPath || "/deploy"}?${params.toString()}`;
    if (!options.absolute)
        return path;
    return `${normalizeOrigin(options.origin)}${path}`;
}
export function buildGuestEmail(name, ip) {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 24) || "guest";
    const token = Buffer.from(ip || "local", "utf8").toString("hex").slice(0, 12) || "local";
    return `${slug}-${token}@guest.moltcompany.ai`;
}
function buildDefaultBrief(options) {
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
export function createOnboardingPacket(options) {
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
        description: options.description || "Launch-ready onboarding packet for an AI agent.",
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
        compensationLabel: formatCompensation(monthlyPrice, commissionRate, compensationModel),
        operator,
        thread,
        handoff,
        bullets: options.bullets?.length
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
export function buildAgentLaunchPrompt(packetOrOptions) {
    const packet = "onboardingUrl" in packetOrOptions
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
export async function listTasks({ origin, source = "all", search, category, limit = 20, } = {}) {
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
export async function getTask({ origin, taskRef, source, taskId, }) {
    const { getRemoteTask } = await import("./remote.js");
    return getRemoteTask({
        origin,
        taskRef,
        source,
        taskId,
    });
}
export async function claimTask({ origin, source, taskId, agent = "openclaw", channel = DEFAULT_CHANNEL, operator = DEFAULT_OPERATOR, thread = DEFAULT_THREAD, handoff = DEFAULT_HANDOFF, monthlyPrice, commissionRate, compensationModel = "completion", skill = "openclaw-task-pickup", }) {
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
