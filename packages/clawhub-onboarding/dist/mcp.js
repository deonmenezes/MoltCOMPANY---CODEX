#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buildOpenClawConnectGuide, claimRemoteTask, getRemoteTask, listRemoteTasks, } from "./remote.js";
export function createMoltCompanyMcpServer(origin) {
    const server = new McpServer({
        name: "moltcompany",
        version: "0.2.0",
    });
    server.tool("list_tasks", "List public MoltCompany tasks that an OpenClaw or Codex agent can claim.", {
        source: z.enum(["all", "official", "community"]).optional(),
        q: z.string().optional(),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
    }, async (args) => {
        const tasks = await listRemoteTasks({
            origin,
            source: args.source,
            q: args.q,
            category: args.category,
            limit: args.limit,
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ tasks }, null, 2),
                },
            ],
        };
    });
    server.tool("get_task", "Resolve a single public MoltCompany task by official/community source and task id or a canonical task ref.", {
        taskRef: z.string().optional(),
        source: z.enum(["official", "community"]).optional(),
        taskId: z.string().optional(),
    }, async (args) => {
        const task = await getRemoteTask({
            origin,
            taskRef: args.taskRef,
            source: args.source,
            taskId: args.taskId,
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ task }, null, 2),
                },
            ],
        };
    });
    server.tool("claim_task", "Claim a MoltCompany task and generate the onboarding packet, onboarding link, and next commands for an OpenClaw/Codex agent.", {
        taskRef: z.string().optional(),
        source: z.enum(["official", "community"]).optional(),
        taskId: z.string().optional(),
        agent: z.string().optional(),
        channel: z.string().optional(),
        operator: z.string().optional(),
        thread: z.string().optional(),
        handoff: z.string().optional(),
    }, async (args) => {
        const claim = await claimRemoteTask({
            origin,
            taskRef: args.taskRef,
            source: args.source,
            taskId: args.taskId,
            agent: args.agent,
            channel: args.channel,
            operator: args.operator,
            thread: args.thread,
            handoff: args.handoff,
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(claim, null, 2),
                },
            ],
        };
    });
    server.tool("openclaw_connect_guide", "Print the exact OpenClaw + MoltCompany commands to install the bundle, start the MCP bridge, list tasks, and claim a task.", {
        taskRef: z.string().optional(),
    }, async (args) => ({
        content: [
            {
                type: "text",
                text: buildOpenClawConnectGuide({
                    origin,
                    taskRef: args.taskRef,
                }),
            },
        ],
    }));
    return server;
}
export async function startMoltCompanyMcpServer(origin) {
    const server = createMoltCompanyMcpServer(origin);
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
function parseOriginArg() {
    const index = process.argv.indexOf("--origin");
    if (index === -1)
        return undefined;
    return process.argv[index + 1];
}
if (process.argv[1] && process.argv[1].endsWith("mcp.js")) {
    startMoltCompanyMcpServer(parseOriginArg()).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`${message}\n`);
        process.exitCode = 1;
    });
}
