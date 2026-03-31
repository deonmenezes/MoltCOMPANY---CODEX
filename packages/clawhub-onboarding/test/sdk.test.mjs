import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const distDir = join(root, "..", "dist");
const sdk = await import(pathToFileURL(join(distDir, "index.js")).href);

test("buildOnboardingLink includes the community id and payout settings", () => {
  const url = sdk.buildOnboardingLink({
    origin: "https://demo.example",
    source: "community",
    taskId: "3",
    claimId: "claim-123",
    role: "Agent onboarding operator",
    monthlyPrice: 40,
    commissionRate: 20,
  });

  assert.match(url, /community=3/);
  assert.match(url, /claim=claim-123/);
  assert.match(url, /monthly=40/);
  assert.match(url, /commission=20/);
});

test("createOnboardingPacket emits agent-ready URLs and defaults", () => {
  const packet = sdk.createOnboardingPacket({
    source: "official",
    taskId: "bob-ceo",
    title: "Onboard Ops",
    role: "Agent onboarding",
  });

  assert.equal(packet.agent, "openai-agent");
  assert.equal(packet.channel, "chat");
  assert.match(packet.claimUrl, /model=bob-ceo/);
  assert.match(packet.onboardingUrl, /skill=agent-onboarding-link/);
});

test("CLI packet command prints JSON", () => {
  const cliPath = join(distDir, "cli.js");
  const stdout = execFileSync(
    process.execPath,
    [
      cliPath,
      "packet",
      "--source",
      "community",
      "--task-id",
      "3",
      "--title",
      "OpenClaw Intake Desk",
      "--role",
      "Agent onboarding operator",
    ],
    { encoding: "utf8" },
  );

  const packet = JSON.parse(stdout);
  assert.equal(packet.taskId, "3");
  assert.equal(packet.source, "community");
  assert.match(packet.onboardingUrl, /community=3/);
});

test("claimTask posts to the public openclaw API contract", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return new Response(
      JSON.stringify({
        claimId: "claim-123",
        taskRef: "official:bob-ceo",
        task: {
          source: "official",
          taskId: "bob-ceo",
          title: "ONBOARD OPS",
          role: "AGENT ONBOARDING",
        },
        packet: {
          claimId: "claim-123",
          onboardingUrl: "https://www.moltcompany.ai/onboarding?model=bob-ceo&claim=claim-123",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const result = await sdk.claimTask({
      origin: "https://www.moltcompany.ai",
      source: "official",
      taskId: "bob-ceo",
      agent: "openclaw",
      channel: "chat",
    });

    assert.equal(result.claimId, "claim-123");
    assert.match(result.packet.onboardingUrl, /claim=claim-123/);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/api\/openclaw\/claim$/);
    assert.equal(calls[0].init.method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("listTasks hits the public openclaw task list", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response(
      JSON.stringify({
        tasks: [
          {
            source: "official",
            taskId: "bob-ceo",
            taskRef: "official:bob-ceo",
            title: "BOB CEO",
            role: "CEO",
            description: "Task description",
            category: "operations",
            color: "#FFD600",
            author: "MoltCompany",
            tags: ["official"],
            bullets: ["Do the thing"],
            brief: "Brief",
            monthlyPrice: 40,
            commissionRate: 20,
            compensationModel: "completion",
            compensationLabel: "$40/mo base | 20% commission tied to completion",
            claimUrl: "https://www.moltcompany.ai/deploy?model=bob-ceo",
            createdAt: "2025-01-01T00:00:00.000Z"
          }
        ],
        total: 1
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      },
    );
  };

  try {
    const result = await sdk.listTasks({
      origin: "https://www.moltcompany.ai",
      source: "all",
      limit: 10,
    });

    assert.equal(result.total, 1);
    assert.equal(result.tasks[0].taskRef, "official:bob-ceo");
    assert.match(calls[0], /\/api\/openclaw\/tasks\?/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
