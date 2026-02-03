export declare class TelemetryManager {
    private static instance;
    private constructor();
    static getInstance(): TelemetryManager;
    trackToolUsage(_toolName: string, _success: boolean, _duration?: number): void;
    trackWorkflowCreation(_workflow: any, _validationPassed: boolean): Promise<void>;
    trackWorkflowMutation(_data: any): Promise<void>;
    trackError(_errorType: string, _context: string, _toolName?: string, _errorMessage?: string): void;
    trackEvent(_eventName: string, _properties: Record<string, any>): void;
    trackSessionStart(): void;
    trackSearchQuery(_query: string, _resultsFound: number, _searchType: string): void;
    trackValidationDetails(_nodeType: string, _errorType: string, _details: Record<string, any>): void;
    trackToolSequence(_previousTool: string, _currentTool: string, _timeDelta: number): void;
    trackNodeConfiguration(_nodeType: string, _propertiesSet: number, _usedDefaults: boolean): void;
    trackPerformanceMetric(_operation: string, _duration: number, _metadata?: Record<string, any>): void;
    flush(): Promise<void>;
    flushMutations(): Promise<void>;
    disable(): void;
    enable(): void;
    getStatus(): {
        enabled: boolean;
        userId: string | null;
        queuedEvents: number;
    };
    shutdown(): Promise<void>;
}
export declare const telemetry: TelemetryManager;
export declare class TelemetryConfigManager {
    private static instance;
    static getInstance(): TelemetryConfigManager;
    isEnabled(): boolean;
    getUserId(): string;
    disable(): void;
    enable(): void;
    getStatus(): string;
}
export type TelemetryConfig = {
    enabled: boolean;
    userId: string | null;
};
export declare class WorkflowSanitizer {
    static sanitize(workflow: any): any;
    static sanitizeNode(node: any): any;
}
export declare class EarlyErrorLogger {
    private static instance;
    static getInstance(): EarlyErrorLogger;
    waitForInit(): Promise<void>;
    logCheckpoint(_checkpoint: string): void;
    logStartupError(_checkpoint: string, _error: unknown): void;
    logStartupSuccess(_checkpoints: string[], _durationMs: number): void;
    getCheckpoints(): string[];
    getStartupDuration(): number;
    getStartupData(): null;
    isEnabled(): boolean;
}
//# sourceMappingURL=telemetry-stub.d.ts.map