"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EarlyErrorLogger = exports.WorkflowSanitizer = exports.TelemetryConfigManager = exports.telemetry = exports.TelemetryManager = void 0;
class TelemetryManager {
    constructor() { }
    static getInstance() {
        if (!TelemetryManager.instance) {
            TelemetryManager.instance = new TelemetryManager();
        }
        return TelemetryManager.instance;
    }
    trackToolUsage(_toolName, _success, _duration) { }
    async trackWorkflowCreation(_workflow, _validationPassed) { }
    async trackWorkflowMutation(_data) { }
    trackError(_errorType, _context, _toolName, _errorMessage) { }
    trackEvent(_eventName, _properties) { }
    trackSessionStart() { }
    trackSearchQuery(_query, _resultsFound, _searchType) { }
    trackValidationDetails(_nodeType, _errorType, _details) { }
    trackToolSequence(_previousTool, _currentTool, _timeDelta) { }
    trackNodeConfiguration(_nodeType, _propertiesSet, _usedDefaults) { }
    trackPerformanceMetric(_operation, _duration, _metadata) { }
    async flush() { }
    async flushMutations() { }
    disable() { }
    enable() { }
    getStatus() {
        return { enabled: false, userId: null, queuedEvents: 0 };
    }
    async shutdown() { }
}
exports.TelemetryManager = TelemetryManager;
exports.telemetry = TelemetryManager.getInstance();
class TelemetryConfigManager {
    static getInstance() {
        if (!TelemetryConfigManager.instance) {
            TelemetryConfigManager.instance = new TelemetryConfigManager();
        }
        return TelemetryConfigManager.instance;
    }
    isEnabled() { return false; }
    getUserId() { return 'disabled'; }
    disable() { }
    enable() { }
    getStatus() { return 'Telemetry is disabled in this fork.'; }
}
exports.TelemetryConfigManager = TelemetryConfigManager;
class WorkflowSanitizer {
    static sanitize(workflow) { return workflow; }
    static sanitizeNode(node) { return node; }
}
exports.WorkflowSanitizer = WorkflowSanitizer;
class EarlyErrorLogger {
    static getInstance() {
        if (!EarlyErrorLogger.instance) {
            EarlyErrorLogger.instance = new EarlyErrorLogger();
        }
        return EarlyErrorLogger.instance;
    }
    async waitForInit() { }
    logCheckpoint(_checkpoint) { }
    logStartupError(_checkpoint, _error) { }
    logStartupSuccess(_checkpoints, _durationMs) { }
    getCheckpoints() { return []; }
    getStartupDuration() { return 0; }
    getStartupData() { return null; }
    isEnabled() { return false; }
}
exports.EarlyErrorLogger = EarlyErrorLogger;
//# sourceMappingURL=telemetry-stub.js.map