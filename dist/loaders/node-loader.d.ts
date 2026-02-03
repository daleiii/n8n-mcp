export interface LoadedNode {
    packageName: string;
    nodeName: string;
    NodeClass: any;
    sourceType: 'official' | 'community' | 'custom';
    sourcePath?: string;
}
export interface CustomNodeSource {
    name: string;
    path: string;
}
export declare class N8nNodeLoader {
    private readonly CORE_PACKAGES;
    loadAllNodes(): Promise<LoadedNode[]>;
    private loadPackageNodes;
    loadCustomNodes(paths: string[]): Promise<LoadedNode[]>;
    private resolveCustomPaths;
    private loadCustomPackage;
    clearRequireCache(packagePath: string): void;
}
//# sourceMappingURL=node-loader.d.ts.map