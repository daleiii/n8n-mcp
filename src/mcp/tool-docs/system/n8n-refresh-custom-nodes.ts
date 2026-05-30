import { ToolDocumentation } from '../types';

export const n8nRefreshCustomNodesDoc: ToolDocumentation = {
  name: 'n8n_refresh_custom_nodes',
  category: 'system',
  essentials: {
    description: 'Reload custom nodes from configured filesystem paths without full database rebuild',
    keyParameters: ['paths'],
    example: 'n8n_refresh_custom_nodes({})',
    performance: 'Moderate - scans filesystem and updates database (~1-10s depending on node count)',
    tips: [
      'Use after modifying custom node code to reload changes',
      'Set CUSTOM_NODE_PATHS env var for automatic path detection',
      'Supports wildcards: /path/to/custom-nodes/*',
      'Clears require cache for hot-reload support'
    ]
  },
  full: {
    description: `Reloads custom n8n nodes from filesystem paths without requiring a full database rebuild.

This tool is designed for:
- Loading custom/private n8n node packages not available via npm
- Hot-reloading custom nodes during development
- Adding nodes from local directories or self-hosted registries

The refresh process:
1. Deletes existing custom nodes from the database
2. Clears the Node.js require cache for affected modules
3. Scans configured paths for valid n8n node packages
4. Parses and saves nodes to the database
5. Returns a summary of changes

Custom node packages must have:
- A package.json with n8n.nodes array pointing to compiled .node.js files
- Compiled JavaScript files in dist/ directory
- Valid node class exports with description property`,
    parameters: {
      paths: {
        type: 'array',
        required: false,
        description: 'Array of filesystem paths to load custom nodes from. If not provided, uses CUSTOM_NODE_PATHS environment variable.',
        examples: [
          '["/root/docker/n8n/custom-nodes/*"]',
          '["/path/to/n8n-nodes-foo", "/path/to/n8n-nodes-bar"]'
        ]
      }
    },
    returns: `Result object containing:
- success: Boolean indicating if refresh completed without errors
- message: Human-readable summary of the operation
- deleted: Number of custom nodes removed from database
- loaded: Number of custom nodes added to database
- paths: Array of paths that were scanned
- errors: Array of error messages (if any)`,
    examples: [
      '// Refresh using environment variable paths\nn8n_refresh_custom_nodes({})',
      '// Refresh specific paths\nn8n_refresh_custom_nodes({paths: ["/home/user/my-custom-nodes/*"]})',
      '// Refresh after updating custom node code\nawait n8n_refresh_custom_nodes({});\nconsole.log("Custom nodes reloaded");'
    ],
    useCases: [
      'Loading private/internal n8n node packages',
      'Hot-reloading during custom node development',
      'Adding unverified community nodes from local copies',
      'Supporting air-gapped environments with local node packages',
      'Testing custom nodes before publishing to npm'
    ],
    performance: `Moderate performance:
- Filesystem scan: ~10-100ms per package
- Node parsing: ~50-200ms per node
- Database operations: ~5-10ms per node
- Total: typically 1-10 seconds for 10-50 custom nodes
- Faster than full rebuild which processes 500+ core nodes`,
    bestPractices: [
      'Use wildcards (/path/*) to auto-discover packages in a directory',
      'Ensure custom nodes are compiled (npm run build) before refresh',
      'Set CUSTOM_NODE_PATHS in .env for consistent configuration',
      'Run refresh after git pull or package updates',
      'Check the errors array in response for failed loads'
    ],
    pitfalls: [
      'Paths must be absolute, not relative',
      'Custom packages must have valid package.json with n8n.nodes array',
      'Node files must be compiled JavaScript (.node.js), not TypeScript',
      'Missing dist/ directory will cause nodes to be skipped',
      'Duplicate node types will override existing nodes (last wins)'
    ],
    relatedTools: ['search_nodes', 'get_node', 'n8n_health_check']
  }
};
