#!/usr/bin/env node
/**
 * Refresh custom nodes without full database rebuild.
 * Usage: npm run refresh:custom
 *
 * This script:
 * 1. Deletes existing custom nodes from the database
 * 2. Clears require cache for custom node modules
 * 3. Re-scans and loads custom nodes from CUSTOM_NODE_PATHS
 * 4. Parses and saves them to the database
 * 5. Reports results
 *
 * Copyright (c) 2024 AiAdvisors Romuald Czlonkowski
 * Licensed under the Sustainable Use License v1.0
 */
import { createDatabaseAdapter } from '../database/database-adapter';
import { N8nNodeLoader } from '../loaders/node-loader';
import { NodeParser, ParsedNode } from '../parsers/node-parser';
import { NodeRepository } from '../database/node-repository';
import { ToolVariantGenerator } from '../services/tool-variant-generator';
import { existsSync } from 'fs';
import * as path from 'path';

/**
 * Parse CUSTOM_NODE_PATHS environment variable into an array of paths.
 */
function parseCustomNodePaths(envValue: string | undefined): string[] {
  if (!envValue || envValue.trim() === '') {
    return [];
  }

  return envValue
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Find the database path
 */
function findDatabasePath(): string {
  const envDbPath = process.env.NODE_DB_PATH;

  if (envDbPath && existsSync(envDbPath)) {
    return envDbPath;
  }

  const possiblePaths = [
    path.join(process.cwd(), 'data', 'nodes.db'),
    path.join(__dirname, '../../data', 'nodes.db'),
    './data/nodes.db'
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return p;
    }
  }

  throw new Error('Database nodes.db not found. Please run npm run rebuild first.');
}

async function refreshCustomNodes(overridePaths?: string[]): Promise<{
  deleted: number;
  loaded: number;
  errors: string[];
}> {
  console.log('🔄 Refreshing custom nodes...\n');

  const errors: string[] = [];

  // Parse custom node paths from environment or override
  const customNodePaths = overridePaths || parseCustomNodePaths(process.env.CUSTOM_NODE_PATHS);

  if (customNodePaths.length === 0) {
    console.log('⚠️  No custom node paths configured.');
    console.log('   Set CUSTOM_NODE_PATHS environment variable to enable custom nodes.');
    console.log('   Example: CUSTOM_NODE_PATHS=/path/to/custom-nodes/*\n');
    return { deleted: 0, loaded: 0, errors: [] };
  }

  console.log(`📁 Custom node paths: ${customNodePaths.join(', ')}\n`);

  // Initialize database
  const dbPath = findDatabasePath();
  console.log(`📂 Using database: ${dbPath}\n`);

  const db = await createDatabaseAdapter(dbPath);
  const repository = new NodeRepository(db);
  const loader = new N8nNodeLoader();
  const parser = new NodeParser();
  const toolVariantGenerator = new ToolVariantGenerator();

  // Step 1: Delete existing custom nodes
  console.log('🗑️  Deleting existing custom nodes...');
  const deletedCount = repository.deleteCustomNodes();
  console.log(`   Deleted ${deletedCount} custom nodes\n`);

  // Step 2: Load custom nodes from paths
  console.log('📦 Loading custom nodes...');
  const loadedNodes = await loader.loadCustomNodes(customNodePaths);
  console.log(`   Found ${loadedNodes.length} custom nodes\n`);

  if (loadedNodes.length === 0) {
    console.log('⚠️  No custom nodes found in the specified paths.\n');
    db.close();
    return { deleted: deletedCount, loaded: 0, errors };
  }

  // Step 3: Parse and save nodes
  console.log('💾 Parsing and saving custom nodes...');
  let savedCount = 0;

  for (const { packageName, nodeName, NodeClass, sourceType, sourcePath } of loadedNodes) {
    try {
      // Parse node
      const parsed = parser.parse(NodeClass, packageName);

      // Validate parsed data
      if (!parsed.nodeType || !parsed.displayName) {
        errors.push(`Missing required fields for ${nodeName}`);
        continue;
      }

      // Set source type and path
      parsed.sourceType = sourceType;
      parsed.sourcePath = sourcePath;

      // Generate Tool variant for AI-capable nodes
      if (parsed.isAITool && !parsed.isTrigger) {
        const toolVariant = toolVariantGenerator.generateToolVariant(parsed);
        if (toolVariant) {
          parsed.hasToolVariant = true;
          toolVariant.sourceType = 'custom';
          toolVariant.sourcePath = sourcePath;

          try {
            repository.saveNode(toolVariant);
            savedCount++;
            console.log(`   ✅ ${toolVariant.nodeType} (Tool variant)`);
          } catch (error) {
            errors.push(`Failed to save Tool variant for ${nodeName}: ${(error as Error).message}`);
          }
        }
      }

      // Save the node
      repository.saveNode(parsed);
      savedCount++;
      console.log(`   ✅ ${parsed.nodeType}`);
    } catch (error) {
      errors.push(`Failed to process ${nodeName}: ${(error as Error).message}`);
      console.error(`   ❌ ${nodeName}: ${(error as Error).message}`);
    }
  }

  // Step 4: Report results
  console.log('\n📊 Summary:');
  console.log(`   Deleted: ${deletedCount} nodes`);
  console.log(`   Loaded: ${savedCount} nodes`);
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.length}`);
    for (const error of errors) {
      console.log(`      - ${error}`);
    }
  }

  console.log('\n✨ Custom node refresh complete!');

  db.close();

  return { deleted: deletedCount, loaded: savedCount, errors };
}

// Export for use by MCP tool
export { refreshCustomNodes, parseCustomNodePaths };

// Run if called directly
if (require.main === module) {
  refreshCustomNodes().catch(error => {
    console.error('❌ Refresh failed:', error);
    process.exit(1);
  });
}
