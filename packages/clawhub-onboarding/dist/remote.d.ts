import { type CompensationModel, type OnboardingPacket } from "./index.js";
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
export declare function normalizeTaskRef(taskRef?: string): {
    source: RemoteTaskSource;
    taskId: string;
    taskRef: string;
} | null;
export declare function listRemoteTasks(options?: {
    origin?: string;
    source?: RemoteTaskFilter;
    q?: string;
    category?: string;
    limit?: number;
}): Promise<RemoteTask[]>;
export declare function getRemoteTask(options: {
    origin?: string;
    taskRef?: string;
    source?: RemoteTaskSource;
    taskId?: string;
}): Promise<RemoteTask>;
export declare function claimRemoteTask(options: {
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
}): Promise<RemoteClaimResult>;
export declare function buildOpenClawConnectGuide(options?: {
    origin?: string;
    taskRef?: string;
}): string;
export declare function buildClaimBodyFromTaskRef(taskRef: string): {
    source: RemoteTaskSource;
    taskId: string;
};
export declare function buildAgentDefaults(): {
    operator: string;
    thread: string;
    handoff: string;
    channel: string;
};
