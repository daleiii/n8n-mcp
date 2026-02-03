/**
 * Telemetry Stub
 * No-op implementation - telemetry disabled for this fork
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class TelemetryManager {
  private static instance: TelemetryManager;

  private constructor() {}

  static getInstance(): TelemetryManager {
    if (!TelemetryManager.instance) {
      TelemetryManager.instance = new TelemetryManager();
    }
    return TelemetryManager.instance;
  }

  // All methods are no-ops
  trackToolUsage(_toolName: string, _success: boolean, _duration?: number): void {}
  async trackWorkflowCreation(_workflow: any, _validationPassed: boolean): Promise<void> {}
  async trackWorkflowMutation(_data: any): Promise<void> {}
  trackError(_errorType: string, _context: string, _toolName?: string, _errorMessage?: string): void {}
  trackEvent(_eventName: string, _properties: Record<string, any>): void {}
  trackSessionStart(): void {}
  trackSearchQuery(_query: string, _resultsFound: number, _searchType: string): void {}
  trackValidationDetails(_nodeType: string, _errorType: string, _details: Record<string, any>): void {}
  trackToolSequence(_previousTool: string, _currentTool: string, _timeDelta: number): void {}
  trackNodeConfiguration(_nodeType: string, _propertiesSet: number, _usedDefaults: boolean): void {}
  trackPerformanceMetric(_operation: string, _duration: number, _metadata?: Record<string, any>): void {}
  async flush(): Promise<void> {}
  async flushMutations(): Promise<void> {}
  disable(): void {}
  enable(): void {}

  getStatus(): { enabled: boolean; userId: string | null; queuedEvents: number } {
    return { enabled: false, userId: null, queuedEvents: 0 };
  }

  async shutdown(): Promise<void> {}
}

// Singleton instance
export const telemetry = TelemetryManager.getInstance();

// Stub config manager
export class TelemetryConfigManager {
  private static instance: TelemetryConfigManager;

  static getInstance(): TelemetryConfigManager {
    if (!TelemetryConfigManager.instance) {
      TelemetryConfigManager.instance = new TelemetryConfigManager();
    }
    return TelemetryConfigManager.instance;
  }

  isEnabled(): boolean { return false; }
  getUserId(): string { return 'disabled'; }
  disable(): void {}
  enable(): void {}
  getStatus(): string { return 'Telemetry is disabled in this fork.'; }
}

export type TelemetryConfig = {
  enabled: boolean;
  userId: string | null;
};

// Stub workflow sanitizer
export class WorkflowSanitizer {
  static sanitize(workflow: any): any { return workflow; }
  static sanitizeNode(node: any): any { return node; }
}

// Stub early error logger
export class EarlyErrorLogger {
  private static instance: EarlyErrorLogger;

  static getInstance(): EarlyErrorLogger {
    if (!EarlyErrorLogger.instance) {
      EarlyErrorLogger.instance = new EarlyErrorLogger();
    }
    return EarlyErrorLogger.instance;
  }

  async waitForInit(): Promise<void> {}
  logCheckpoint(_checkpoint: string): void {}
  logStartupError(_checkpoint: string, _error: unknown): void {}
  logStartupSuccess(_checkpoints: string[], _durationMs: number): void {}
  getCheckpoints(): string[] { return []; }
  getStartupDuration(): number { return 0; }
  getStartupData(): null { return null; }
  isEnabled(): boolean { return false; }
}
