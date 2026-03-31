#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare function createMoltCompanyMcpServer(origin?: string): McpServer;
export declare function startMoltCompanyMcpServer(origin?: string): Promise<void>;
