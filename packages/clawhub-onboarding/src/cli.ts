#!/usr/bin/env node

import { readFileSync } from "node:fs";
import {
  DEFAULT_HANDOFF,
  DEFAULT_OPERATOR,
  DEFAULT_THREAD,
  buildAgentLaunchPrompt,
  buildOnboardingLink,
  createOnboardingPacket,
  type CompensationModel,
  type TaskSource,
} from "./index.js";
import {
  buildClaimBodyFromTaskRef,
  buildOpenClawConnectGuide,
  claimRemoteTask,
  getRemoteTask,
  listRemoteTasks,
} from "./remote.js";
import { startMoltCompanyMcpServer } from "./mcp.js";

type ParsedArgs = {
  command: string;
  values: Map<string, string[]>;
  flags: Set<string>;
};

function parseArgs(argv: string[]): ParsedArgs {
  let command = "packet";
  const values = new Map<string, string[]>();
  const flags = new Set<string>();
  let index = 0;

  if (argv[0] && !argv[0].startsWith("--")) {
    command = argv[0];
    index = 1;
  }

  while (index < argv.length) {
    const entry = argv[index];
    if (!entry.startsWith("--")) {
      index += 1;
      continue;
    }

    const key = entry.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags.add(key);
      index += 1;
      continue;
    }

    const existing = values.get(key) || [];
    existing.push(next);
    values.set(key, existing);
    index += 2;
  }

  return { command, values, flags };
}

function takeFirst(args: ParsedArgs, ...keys: string[]) {
  for (const key of keys) {
    const value = args.values.get(key)?.[0];
    if (value) return value;
  }
  return undefined;
}

function takeAll(args: ParsedArgs, ...keys: string[]) {
  const output: string[] = [];
  for (const key of keys) {
    const values = args.values.get(key);
    if (values) output.push(...values);
  }
  return output;
}

function readBrief(args: ParsedArgs) {
  const inlineBrief = takeFirst(args, "brief");
  if (inlineBrief) return inlineBrief;

  const briefFile = takeFirst(args, "brief-file", "briefFile");
  if (!briefFile) return undefined;
  return readFileSync(briefFile, "utf8");
}

function parseNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function printHelp() {
  process.stdout.write(
    [
      "moltcompany <tasks|task|claim|connect-openclaw|mcp|packet|prompt|url>",
      "",
      "Task pickup commands:",
      "  tasks --origin <url> [--source all|official|community] [--q <search>] [--category <category>] [--limit <n>]",
      "  task (--task-ref official:bob-ceo | --source official --task-id bob-ceo) [--origin <url>]",
      "  claim --origin <url> (--task-ref official:bob-ceo | --source official --task-id bob-ceo) [--agent openclaw] [--channel chat]",
      "  mcp --origin <url>",
      "  connect-openclaw [--origin <url>] [--task-ref official:bob-ceo]",
      "  guide [--origin <url>] [--task-ref official:bob-ceo] (alias for connect-openclaw)",
      "",
      "Local packet commands:",
      "  packet --task-id <id> --title <title> --role <role>",
      "  prompt --task-id <id> --title <title> --role <role>",
      "  url --task-id <id> --title <title> --role <role>",
      "",
      "Examples:",
      '  moltcompany tasks --origin "https://www.moltcompany.ai" --source community --limit 10',
      '  moltcompany task --origin "https://www.moltcompany.ai" --task-ref community:3',
      '  moltcompany claim --origin "https://www.moltcompany.ai" --task-ref official:bob-ceo --agent openclaw --channel chat',
      '  moltcompany connect-openclaw --origin "https://www.moltcompany.ai" --task-ref community:3',
      '  moltcompany mcp --origin "https://www.moltcompany.ai"',
      '  moltcompany packet --source community --task-id 3 --title "OpenClaw Intake Desk" --role "Agent onboarding operator"',
    ].join("\n"),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.flags.has("help") || args.flags.has("h")) {
    printHelp();
    return;
  }

  if (args.command === "tasks") {
    const tasks = await listRemoteTasks({
      origin: takeFirst(args, "origin"),
      source: takeFirst(args, "source") as "all" | "official" | "community" | undefined,
      q: takeFirst(args, "q", "search"),
      category: takeFirst(args, "category"),
      limit: parseNumber(takeFirst(args, "limit"), 20),
    });
    process.stdout.write(JSON.stringify({ tasks }, null, 2));
    return;
  }

  if (args.command === "claim") {
    const taskRef = takeFirst(args, "task-ref", "taskRef");
    const taskId = takeFirst(args, "task-id", "taskId");
    const source = takeFirst(args, "source") as "official" | "community" | undefined;

    const claimInput = taskRef
      ? buildClaimBodyFromTaskRef(taskRef)
      : source && taskId
        ? { source, taskId }
        : null;

    if (!claimInput) {
      printHelp();
      process.exitCode = 1;
      return;
    }

    const claim = await claimRemoteTask({
      origin: takeFirst(args, "origin"),
      taskRef,
      source: claimInput.source,
      taskId: claimInput.taskId,
      agent: takeFirst(args, "agent"),
      channel: takeFirst(args, "channel"),
      operator: takeFirst(args, "operator"),
      thread: takeFirst(args, "thread"),
      handoff: takeFirst(args, "handoff"),
      monthlyPrice: takeFirst(args, "monthly")
        ? parseNumber(takeFirst(args, "monthly"), 40)
        : undefined,
      commissionRate: takeFirst(args, "commission")
        ? parseNumber(takeFirst(args, "commission"), 20)
        : undefined,
      compensationModel: takeFirst(args, "compensation") as CompensationModel | undefined,
      skill: takeFirst(args, "skill"),
    });
    process.stdout.write(JSON.stringify(claim, null, 2));
    return;
  }

  if (args.command === "task") {
    const task = await getRemoteTask({
      origin: takeFirst(args, "origin"),
      taskRef: takeFirst(args, "task-ref", "taskRef"),
      source: takeFirst(args, "source") as "official" | "community" | undefined,
      taskId: takeFirst(args, "task-id", "taskId"),
    });
    process.stdout.write(JSON.stringify({ task }, null, 2));
    return;
  }

  if (args.command === "mcp") {
    await startMoltCompanyMcpServer(takeFirst(args, "origin"));
    return;
  }

  if (args.command === "guide" || args.command === "connect-openclaw") {
    process.stdout.write(
      buildOpenClawConnectGuide({
        origin: takeFirst(args, "origin"),
        taskRef: takeFirst(args, "task-ref", "taskRef"),
      }),
    );
    return;
  }

  const taskId = takeFirst(args, "task-id", "taskId");
  const title = takeFirst(args, "title");
  const role = takeFirst(args, "role");

  if (!taskId || !title || !role) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const source = (takeFirst(args, "source") || "official") as TaskSource;
  const compensationModel = (
    takeFirst(args, "compensation") || "completion"
  ) as CompensationModel;
  const packet = createOnboardingPacket({
    origin: takeFirst(args, "origin"),
    source,
    taskId,
    claimId: takeFirst(args, "claim", "claim-id", "claimId"),
    title,
    role,
    description: takeFirst(args, "description"),
    agent: takeFirst(args, "agent"),
    channel: takeFirst(args, "channel"),
    monthlyPrice: parseNumber(takeFirst(args, "monthly"), 40),
    commissionRate: parseNumber(takeFirst(args, "commission"), 20),
    compensationModel,
    operator: takeFirst(args, "operator") || DEFAULT_OPERATOR,
    thread: takeFirst(args, "thread") || DEFAULT_THREAD,
    handoff: takeFirst(args, "handoff") || DEFAULT_HANDOFF,
    brief: readBrief(args),
    bullets: takeAll(args, "bullet"),
  });

  if (args.command === "url") {
    process.stdout.write(
      buildOnboardingLink({
        origin: takeFirst(args, "origin"),
        source,
        taskId,
        claimId: packet.claimId,
        role,
        agent: packet.agent,
        channel: packet.channel,
        monthlyPrice: parseNumber(takeFirst(args, "monthly"), 40),
        commissionRate: parseNumber(takeFirst(args, "commission"), 20),
        compensationModel,
        operator: packet.operator,
        thread: packet.thread,
        handoff: packet.handoff,
      }),
    );
    return;
  }

  if (args.command === "prompt") {
    process.stdout.write(buildAgentLaunchPrompt(packet));
    return;
  }

  process.stdout.write(JSON.stringify(packet, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
