import path from 'path';
import * as fs from 'fs';

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

export class N8nNodeLoader {
  private readonly CORE_PACKAGES = [
    { name: 'n8n-nodes-base', path: 'n8n-nodes-base' },
    { name: '@n8n/n8n-nodes-langchain', path: '@n8n/n8n-nodes-langchain' }
  ];

  async loadAllNodes(): Promise<LoadedNode[]> {
    const results: LoadedNode[] = [];

    for (const pkg of this.CORE_PACKAGES) {
      try {
        console.log(`\n📦 Loading package: ${pkg.name} from ${pkg.path}`);
        // Use the path property to locate the package
        const packageJson = require(`${pkg.path}/package.json`);
        console.log(`  Found ${Object.keys(packageJson.n8n?.nodes || {}).length} nodes in package.json`);
        const nodes = await this.loadPackageNodes(pkg.name, pkg.path, packageJson);
        // Mark all nodes from core packages as 'official'
        for (const node of nodes) {
          node.sourceType = 'official';
        }
        results.push(...nodes);
      } catch (error) {
        console.error(`Failed to load ${pkg.name}:`, error);
      }
    }

    return results;
  }

  private async loadPackageNodes(packageName: string, packagePath: string, packageJson: any): Promise<LoadedNode[]> {
    const n8nConfig = packageJson.n8n || {};
    const nodes: LoadedNode[] = [];

    // Check if nodes is an array or object
    const nodesList = n8nConfig.nodes || [];

    if (Array.isArray(nodesList)) {
      // Handle array format (n8n-nodes-base uses this)
      for (const nodePath of nodesList) {
        try {
          const fullPath = require.resolve(`${packagePath}/${nodePath}`);
          const nodeModule = require(fullPath);

          // Extract node name from path (e.g., "dist/nodes/Slack/Slack.node.js" -> "Slack")
          const nodeNameMatch = nodePath.match(/\/([^\/]+)\.node\.(js|ts)$/);
          const nodeName = nodeNameMatch ? nodeNameMatch[1] : path.basename(nodePath, '.node.js');

          // Handle default export and various export patterns
          const NodeClass = nodeModule.default || nodeModule[nodeName] || Object.values(nodeModule)[0];
          if (NodeClass) {
            nodes.push({ packageName, nodeName, NodeClass, sourceType: 'official' });
            console.log(`  ✓ Loaded ${nodeName} from ${packageName}`);
          } else {
            console.warn(`  ⚠ No valid export found for ${nodeName} in ${packageName}`);
          }
        } catch (error) {
          console.error(`  ✗ Failed to load node from ${packageName}/${nodePath}:`, (error as Error).message);
        }
      }
    } else {
      // Handle object format (for other packages)
      for (const [nodeName, nodePath] of Object.entries(nodesList)) {
        try {
          const fullPath = require.resolve(`${packagePath}/${nodePath as string}`);
          const nodeModule = require(fullPath);

          // Handle default export and various export patterns
          const NodeClass = nodeModule.default || nodeModule[nodeName] || Object.values(nodeModule)[0];
          if (NodeClass) {
            nodes.push({ packageName, nodeName, NodeClass, sourceType: 'official' });
            console.log(`  ✓ Loaded ${nodeName} from ${packageName}`);
          } else {
            console.warn(`  ⚠ No valid export found for ${nodeName} in ${packageName}`);
          }
        } catch (error) {
          console.error(`  ✗ Failed to load node ${nodeName} from ${packageName}:`, (error as Error).message);
        }
      }
    }

    return nodes;
  }

  // ========================================
  // Custom Node Loading Methods (v2.34.0)
  // ========================================

  /**
   * Load custom nodes from filesystem paths
   * Supports individual package directories or parent directories with wildcards
   */
  async loadCustomNodes(paths: string[]): Promise<LoadedNode[]> {
    const results: LoadedNode[] = [];
    const resolvedSources = this.resolveCustomPaths(paths);

    console.log(`\n📦 Loading custom nodes from ${resolvedSources.length} packages...`);

    for (const source of resolvedSources) {
      try {
        const nodes = await this.loadCustomPackage(source.path);
        for (const node of nodes) {
          node.sourcePath = source.path;
        }
        results.push(...nodes);
      } catch (error) {
        console.error(`  ✗ Failed to load custom package ${source.name}:`, (error as Error).message);
      }
    }

    return results;
  }

  /**
   * Resolve custom paths, handling wildcards and validating existence
   */
  private resolveCustomPaths(paths: string[]): CustomNodeSource[] {
    const sources: CustomNodeSource[] = [];

    for (const inputPath of paths) {
      const trimmedPath = inputPath.trim();
      if (!trimmedPath) continue;

      if (trimmedPath.endsWith('/*')) {
        // Wildcard: scan parent directory for packages
        const parentDir = trimmedPath.slice(0, -2);

        if (!fs.existsSync(parentDir)) {
          console.warn(`  ⚠ Parent directory does not exist: ${parentDir}`);
          continue;
        }

        try {
          const entries = fs.readdirSync(parentDir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const fullPath = path.join(parentDir, entry.name);
              const packageJsonPath = path.join(fullPath, 'package.json');

              if (fs.existsSync(packageJsonPath)) {
                sources.push({ name: entry.name, path: fullPath });
              } else {
                console.warn(`  ⚠ Skipping ${entry.name}: no package.json found`);
              }
            }
          }
        } catch (error) {
          console.error(`  ✗ Failed to scan directory ${parentDir}:`, (error as Error).message);
        }
      } else {
        // Direct path to a package
        if (!fs.existsSync(trimmedPath)) {
          console.warn(`  ⚠ Path does not exist: ${trimmedPath}`);
          continue;
        }

        const packageJsonPath = path.join(trimmedPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
          console.warn(`  ⚠ No package.json found in: ${trimmedPath}`);
          continue;
        }

        const name = path.basename(trimmedPath);
        sources.push({ name, path: trimmedPath });
      }
    }

    return sources;
  }

  /**
   * Load a single custom package from an absolute path
   */
  private async loadCustomPackage(packagePath: string): Promise<LoadedNode[]> {
    const nodes: LoadedNode[] = [];

    // Clear require cache for this package to support hot-reload
    this.clearRequireCache(packagePath);

    // Read package.json
    const packageJsonPath = path.join(packagePath, 'package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    const packageName = packageJson.name || path.basename(packagePath);
    const n8nConfig = packageJson.n8n || {};

    if (!n8nConfig.nodes || !Array.isArray(n8nConfig.nodes) || n8nConfig.nodes.length === 0) {
      console.warn(`  ⚠ No n8n.nodes array found in ${packageName}/package.json`);
      return nodes;
    }

    console.log(`  📦 Loading custom package: ${packageName}`);

    for (const nodePath of n8nConfig.nodes) {
      try {
        // Use absolute path instead of require.resolve
        const fullPath = path.resolve(packagePath, nodePath);

        if (!fs.existsSync(fullPath)) {
          console.warn(`    ⚠ Node file not found: ${fullPath}`);
          continue;
        }

        // Clear cache for this specific file
        delete require.cache[fullPath];

        const nodeModule = require(fullPath);

        // Extract node name from path
        const nodeNameMatch = nodePath.match(/\/([^\/]+)\.node\.(js|ts)$/);
        const nodeName = nodeNameMatch ? nodeNameMatch[1] : path.basename(nodePath, '.node.js');

        // Handle default export and various export patterns
        const NodeClass = nodeModule.default || nodeModule[nodeName] || Object.values(nodeModule)[0];

        if (NodeClass) {
          nodes.push({
            packageName,
            nodeName,
            NodeClass,
            sourceType: 'custom',
            sourcePath: packagePath
          });
          console.log(`    ✓ Loaded custom node: ${nodeName}`);
        } else {
          console.warn(`    ⚠ No valid export found for ${nodeName} in ${packageName}`);
        }
      } catch (error) {
        console.error(`    ✗ Failed to load custom node from ${nodePath}:`, (error as Error).message);
      }
    }

    return nodes;
  }

  /**
   * Clear require cache for all files in a directory (for hot-reload support)
   */
  clearRequireCache(packagePath: string): void {
    const keysToRemove = Object.keys(require.cache).filter(key =>
      key.startsWith(packagePath)
    );
    for (const key of keysToRemove) {
      delete require.cache[key];
    }
  }
}