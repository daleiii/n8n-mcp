#!/usr/bin/env node
declare function parseCustomNodePaths(envValue: string | undefined): string[];
declare function refreshCustomNodes(overridePaths?: string[]): Promise<{
    deleted: number;
    loaded: number;
    errors: string[];
}>;
export { refreshCustomNodes, parseCustomNodePaths };
//# sourceMappingURL=refresh-custom-nodes.d.ts.map