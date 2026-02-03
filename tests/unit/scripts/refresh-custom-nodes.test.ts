/**
 * Unit tests for refresh-custom-nodes script (Hot Reload)
 * Tests the ability to refresh custom nodes without a full database rebuild.
 * Fork-specific feature added in v2.34.0.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('@/database/database-adapter', () => ({
  createDatabaseAdapter: vi.fn(),
}));

vi.mock('@/database/node-repository', () => ({
  NodeRepository: vi.fn().mockImplementation(() => ({
    deleteCustomNodes: vi.fn(),
    saveNode: vi.fn(),
  })),
}));

vi.mock('@/loaders/node-loader', () => ({
  N8nNodeLoader: vi.fn().mockImplementation(() => ({
    loadCustomNodes: vi.fn(),
  })),
}));

vi.mock('@/parsers/node-parser', () => ({
  NodeParser: vi.fn().mockImplementation(() => ({
    parse: vi.fn(),
  })),
}));

vi.mock('@/services/tool-variant-generator', () => ({
  ToolVariantGenerator: vi.fn().mockImplementation(() => ({
    generateToolVariant: vi.fn(),
  })),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('refresh-custom-nodes', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    delete process.env.CUSTOM_NODE_PATHS;
    delete process.env.NODE_DB_PATH;
  });

  describe('parseCustomNodePaths', () => {
    it('should return empty array for undefined input', async () => {
      const { parseCustomNodePaths } = await import('@/scripts/refresh-custom-nodes');

      const result = parseCustomNodePaths(undefined);

      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', async () => {
      const { parseCustomNodePaths } = await import('@/scripts/refresh-custom-nodes');

      const result = parseCustomNodePaths('');

      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only string', async () => {
      const { parseCustomNodePaths } = await import('@/scripts/refresh-custom-nodes');

      const result = parseCustomNodePaths('   \t\n  ');

      expect(result).toEqual([]);
    });

    it('should parse single path', async () => {
      const { parseCustomNodePaths } = await import('@/scripts/refresh-custom-nodes');

      const result = parseCustomNodePaths('/path/to/nodes');

      expect(result).toEqual(['/path/to/nodes']);
    });

    it('should parse multiple comma-separated paths', async () => {
      const { parseCustomNodePaths } = await import('@/scripts/refresh-custom-nodes');

      const result = parseCustomNodePaths('/path/one,/path/two,/path/three');

      expect(result).toEqual(['/path/one', '/path/two', '/path/three']);
    });

    it('should trim whitespace from paths', async () => {
      const { parseCustomNodePaths } = await import('@/scripts/refresh-custom-nodes');

      const result = parseCustomNodePaths('  /path/one  ,  /path/two  ');

      expect(result).toEqual(['/path/one', '/path/two']);
    });

    it('should filter out empty segments', async () => {
      const { parseCustomNodePaths } = await import('@/scripts/refresh-custom-nodes');

      const result = parseCustomNodePaths('/path/one,,/path/two,  ,/path/three');

      expect(result).toEqual(['/path/one', '/path/two', '/path/three']);
    });

    it('should handle wildcard paths', async () => {
      const { parseCustomNodePaths } = await import('@/scripts/refresh-custom-nodes');

      const result = parseCustomNodePaths('/custom-nodes/*,/other-nodes/*');

      expect(result).toEqual(['/custom-nodes/*', '/other-nodes/*']);
    });
  });

  describe('refreshCustomNodes', () => {
    it('should return early when no custom node paths configured', async () => {
      const { refreshCustomNodes } = await import('@/scripts/refresh-custom-nodes');

      const result = await refreshCustomNodes([]);

      expect(result).toEqual({
        deleted: 0,
        loaded: 0,
        errors: [],
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No custom node paths configured')
      );
    });

    it('should use overridePaths when provided', async () => {
      const { existsSync } = await import('fs');
      const { createDatabaseAdapter } = await import('@/database/database-adapter');
      const { NodeRepository } = await import('@/database/node-repository');
      const { N8nNodeLoader } = await import('@/loaders/node-loader');

      // Setup mocks
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(createDatabaseAdapter).mockResolvedValue({
        close: vi.fn(),
        prepare: vi.fn(),
        exec: vi.fn(),
        pragma: vi.fn(),
        transaction: vi.fn(),
        checkFTS5Support: vi.fn(),
        inTransaction: false,
      } as any);

      const mockDeleteCustomNodes = vi.fn().mockReturnValue(5);
      const mockLoadCustomNodes = vi.fn().mockResolvedValue([]);

      vi.mocked(NodeRepository).mockImplementation(() => ({
        deleteCustomNodes: mockDeleteCustomNodes,
        saveNode: vi.fn(),
      } as any));

      vi.mocked(N8nNodeLoader).mockImplementation(() => ({
        loadCustomNodes: mockLoadCustomNodes,
      } as any));

      vi.resetModules();
      const { refreshCustomNodes } = await import('@/scripts/refresh-custom-nodes');

      const result = await refreshCustomNodes(['/custom/path']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('/custom/path')
      );
    });

    it('should delete existing custom nodes first', async () => {
      const { existsSync } = await import('fs');
      const { createDatabaseAdapter } = await import('@/database/database-adapter');
      const { NodeRepository } = await import('@/database/node-repository');
      const { N8nNodeLoader } = await import('@/loaders/node-loader');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(createDatabaseAdapter).mockResolvedValue({
        close: vi.fn(),
        prepare: vi.fn(),
        exec: vi.fn(),
        pragma: vi.fn(),
        transaction: vi.fn(),
        checkFTS5Support: vi.fn(),
        inTransaction: false,
      } as any);

      const mockDeleteCustomNodes = vi.fn().mockReturnValue(10);
      vi.mocked(NodeRepository).mockImplementation(() => ({
        deleteCustomNodes: mockDeleteCustomNodes,
        saveNode: vi.fn(),
      } as any));

      vi.mocked(N8nNodeLoader).mockImplementation(() => ({
        loadCustomNodes: vi.fn().mockResolvedValue([]),
      } as any));

      vi.resetModules();
      const { refreshCustomNodes } = await import('@/scripts/refresh-custom-nodes');

      const result = await refreshCustomNodes(['/test/path']);

      expect(mockDeleteCustomNodes).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Deleting existing custom nodes')
      );
    });

    it('should load and save custom nodes', async () => {
      const { existsSync } = await import('fs');
      const { createDatabaseAdapter } = await import('@/database/database-adapter');
      const { NodeRepository } = await import('@/database/node-repository');
      const { N8nNodeLoader } = await import('@/loaders/node-loader');
      const { NodeParser } = await import('@/parsers/node-parser');
      const { ToolVariantGenerator } = await import('@/services/tool-variant-generator');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(createDatabaseAdapter).mockResolvedValue({
        close: vi.fn(),
        prepare: vi.fn(),
        exec: vi.fn(),
        pragma: vi.fn(),
        transaction: vi.fn(),
        checkFTS5Support: vi.fn(),
        inTransaction: false,
      } as any);

      const mockSaveNode = vi.fn();
      vi.mocked(NodeRepository).mockImplementation(() => ({
        deleteCustomNodes: vi.fn().mockReturnValue(0),
        saveNode: mockSaveNode,
      } as any));

      const mockLoadedNodes = [
        {
          packageName: 'custom-pkg',
          nodeName: 'CustomNode',
          NodeClass: class {},
          sourceType: 'custom' as const,
          sourcePath: '/test/path',
        },
      ];
      vi.mocked(N8nNodeLoader).mockImplementation(() => ({
        loadCustomNodes: vi.fn().mockResolvedValue(mockLoadedNodes),
      } as any));

      const mockParsedNode = {
        nodeType: 'custom-pkg.customNode',
        displayName: 'Custom Node',
        isAITool: false,
        isTrigger: false,
      };
      vi.mocked(NodeParser).mockImplementation(() => ({
        parse: vi.fn().mockReturnValue(mockParsedNode),
      } as any));

      vi.mocked(ToolVariantGenerator).mockImplementation(() => ({
        generateToolVariant: vi.fn().mockReturnValue(null),
      } as any));

      vi.resetModules();
      const { refreshCustomNodes } = await import('@/scripts/refresh-custom-nodes');

      const result = await refreshCustomNodes(['/test/path']);

      expect(result.loaded).toBe(1);
      expect(result.errors).toEqual([]);
    });

    it('should generate tool variants for AI-capable nodes', async () => {
      const { existsSync } = await import('fs');
      const { createDatabaseAdapter } = await import('@/database/database-adapter');
      const { NodeRepository } = await import('@/database/node-repository');
      const { N8nNodeLoader } = await import('@/loaders/node-loader');
      const { NodeParser } = await import('@/parsers/node-parser');
      const { ToolVariantGenerator } = await import('@/services/tool-variant-generator');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(createDatabaseAdapter).mockResolvedValue({
        close: vi.fn(),
        prepare: vi.fn(),
        exec: vi.fn(),
        pragma: vi.fn(),
        transaction: vi.fn(),
        checkFTS5Support: vi.fn(),
        inTransaction: false,
      } as any);

      const mockSaveNode = vi.fn();
      vi.mocked(NodeRepository).mockImplementation(() => ({
        deleteCustomNodes: vi.fn().mockReturnValue(0),
        saveNode: mockSaveNode,
      } as any));

      const mockLoadedNodes = [
        {
          packageName: 'ai-pkg',
          nodeName: 'AINode',
          NodeClass: class {},
          sourceType: 'custom' as const,
          sourcePath: '/test/path',
        },
      ];
      vi.mocked(N8nNodeLoader).mockImplementation(() => ({
        loadCustomNodes: vi.fn().mockResolvedValue(mockLoadedNodes),
      } as any));

      const mockParsedNode = {
        nodeType: 'ai-pkg.aiNode',
        displayName: 'AI Node',
        isAITool: true,
        isTrigger: false,
      };
      vi.mocked(NodeParser).mockImplementation(() => ({
        parse: vi.fn().mockReturnValue(mockParsedNode),
      } as any));

      const mockToolVariant = {
        nodeType: 'ai-pkg.aiNodeTool',
        displayName: 'AI Node Tool',
        isToolVariant: true,
        toolVariantOf: 'ai-pkg.aiNode',
      };
      vi.mocked(ToolVariantGenerator).mockImplementation(() => ({
        generateToolVariant: vi.fn().mockReturnValue(mockToolVariant),
      } as any));

      vi.resetModules();
      const { refreshCustomNodes } = await import('@/scripts/refresh-custom-nodes');

      const result = await refreshCustomNodes(['/test/path']);

      // Should save both the node and its tool variant
      expect(result.loaded).toBe(2);
    });

    it('should track errors for nodes that fail to parse', async () => {
      const { existsSync } = await import('fs');
      const { createDatabaseAdapter } = await import('@/database/database-adapter');
      const { NodeRepository } = await import('@/database/node-repository');
      const { N8nNodeLoader } = await import('@/loaders/node-loader');
      const { NodeParser } = await import('@/parsers/node-parser');
      const { ToolVariantGenerator } = await import('@/services/tool-variant-generator');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(createDatabaseAdapter).mockResolvedValue({
        close: vi.fn(),
        prepare: vi.fn(),
        exec: vi.fn(),
        pragma: vi.fn(),
        transaction: vi.fn(),
        checkFTS5Support: vi.fn(),
        inTransaction: false,
      } as any);

      vi.mocked(NodeRepository).mockImplementation(() => ({
        deleteCustomNodes: vi.fn().mockReturnValue(0),
        saveNode: vi.fn(),
      } as any));

      const mockLoadedNodes = [
        {
          packageName: 'bad-pkg',
          nodeName: 'BadNode',
          NodeClass: class {},
          sourceType: 'custom' as const,
          sourcePath: '/test/path',
        },
      ];
      vi.mocked(N8nNodeLoader).mockImplementation(() => ({
        loadCustomNodes: vi.fn().mockResolvedValue(mockLoadedNodes),
      } as any));

      vi.mocked(NodeParser).mockImplementation(() => ({
        parse: vi.fn().mockImplementation(() => {
          throw new Error('Parse error');
        }),
      } as any));

      vi.mocked(ToolVariantGenerator).mockImplementation(() => ({
        generateToolVariant: vi.fn().mockReturnValue(null),
      } as any));

      vi.resetModules();
      const { refreshCustomNodes } = await import('@/scripts/refresh-custom-nodes');

      const result = await refreshCustomNodes(['/test/path']);

      expect(result.loaded).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('BadNode');
    });

    it('should skip nodes with missing required fields', async () => {
      const { existsSync } = await import('fs');
      const { createDatabaseAdapter } = await import('@/database/database-adapter');
      const { NodeRepository } = await import('@/database/node-repository');
      const { N8nNodeLoader } = await import('@/loaders/node-loader');
      const { NodeParser } = await import('@/parsers/node-parser');
      const { ToolVariantGenerator } = await import('@/services/tool-variant-generator');

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(createDatabaseAdapter).mockResolvedValue({
        close: vi.fn(),
        prepare: vi.fn(),
        exec: vi.fn(),
        pragma: vi.fn(),
        transaction: vi.fn(),
        checkFTS5Support: vi.fn(),
        inTransaction: false,
      } as any);

      vi.mocked(NodeRepository).mockImplementation(() => ({
        deleteCustomNodes: vi.fn().mockReturnValue(0),
        saveNode: vi.fn(),
      } as any));

      const mockLoadedNodes = [
        {
          packageName: 'incomplete-pkg',
          nodeName: 'IncompleteNode',
          NodeClass: class {},
          sourceType: 'custom' as const,
          sourcePath: '/test/path',
        },
      ];
      vi.mocked(N8nNodeLoader).mockImplementation(() => ({
        loadCustomNodes: vi.fn().mockResolvedValue(mockLoadedNodes),
      } as any));

      // Return node with missing required fields
      const mockParsedNode = {
        nodeType: '', // missing
        displayName: '', // missing
      };
      vi.mocked(NodeParser).mockImplementation(() => ({
        parse: vi.fn().mockReturnValue(mockParsedNode),
      } as any));

      vi.mocked(ToolVariantGenerator).mockImplementation(() => ({
        generateToolVariant: vi.fn().mockReturnValue(null),
      } as any));

      vi.resetModules();
      const { refreshCustomNodes } = await import('@/scripts/refresh-custom-nodes');

      const result = await refreshCustomNodes(['/test/path']);

      expect(result.loaded).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required fields');
    });

    it('should close database connection after completion', async () => {
      const { existsSync } = await import('fs');
      const { createDatabaseAdapter } = await import('@/database/database-adapter');
      const { NodeRepository } = await import('@/database/node-repository');
      const { N8nNodeLoader } = await import('@/loaders/node-loader');

      vi.mocked(existsSync).mockReturnValue(true);

      const mockClose = vi.fn();
      vi.mocked(createDatabaseAdapter).mockResolvedValue({
        close: mockClose,
        prepare: vi.fn(),
        exec: vi.fn(),
        pragma: vi.fn(),
        transaction: vi.fn(),
        checkFTS5Support: vi.fn(),
        inTransaction: false,
      } as any);

      vi.mocked(NodeRepository).mockImplementation(() => ({
        deleteCustomNodes: vi.fn().mockReturnValue(0),
        saveNode: vi.fn(),
      } as any));

      vi.mocked(N8nNodeLoader).mockImplementation(() => ({
        loadCustomNodes: vi.fn().mockResolvedValue([]),
      } as any));

      vi.resetModules();
      const { refreshCustomNodes } = await import('@/scripts/refresh-custom-nodes');

      await refreshCustomNodes(['/test/path']);

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Environment variable handling', () => {
    it('should read CUSTOM_NODE_PATHS from environment', async () => {
      process.env.CUSTOM_NODE_PATHS = '/env/path/one,/env/path/two';

      const { parseCustomNodePaths } = await import('@/scripts/refresh-custom-nodes');

      const result = parseCustomNodePaths(process.env.CUSTOM_NODE_PATHS);

      expect(result).toEqual(['/env/path/one', '/env/path/two']);
    });

    it('should support wildcard syntax in environment variable', async () => {
      process.env.CUSTOM_NODE_PATHS = '/nodes/*';

      const { parseCustomNodePaths } = await import('@/scripts/refresh-custom-nodes');

      const result = parseCustomNodePaths(process.env.CUSTOM_NODE_PATHS);

      expect(result).toEqual(['/nodes/*']);
    });
  });
});
