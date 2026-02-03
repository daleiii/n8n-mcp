#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshCustomNodes = refreshCustomNodes;
exports.parseCustomNodePaths = parseCustomNodePaths;
const database_adapter_1 = require("../database/database-adapter");
const node_loader_1 = require("../loaders/node-loader");
const node_parser_1 = require("../parsers/node-parser");
const node_repository_1 = require("../database/node-repository");
const tool_variant_generator_1 = require("../services/tool-variant-generator");
const fs_1 = require("fs");
const path = __importStar(require("path"));
function parseCustomNodePaths(envValue) {
    if (!envValue || envValue.trim() === '') {
        return [];
    }
    return envValue
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);
}
function findDatabasePath() {
    const envDbPath = process.env.NODE_DB_PATH;
    if (envDbPath && (0, fs_1.existsSync)(envDbPath)) {
        return envDbPath;
    }
    const possiblePaths = [
        path.join(process.cwd(), 'data', 'nodes.db'),
        path.join(__dirname, '../../data', 'nodes.db'),
        './data/nodes.db'
    ];
    for (const p of possiblePaths) {
        if ((0, fs_1.existsSync)(p)) {
            return p;
        }
    }
    throw new Error('Database nodes.db not found. Please run npm run rebuild first.');
}
async function refreshCustomNodes(overridePaths) {
    console.log('🔄 Refreshing custom nodes...\n');
    const errors = [];
    const customNodePaths = overridePaths || parseCustomNodePaths(process.env.CUSTOM_NODE_PATHS);
    if (customNodePaths.length === 0) {
        console.log('⚠️  No custom node paths configured.');
        console.log('   Set CUSTOM_NODE_PATHS environment variable to enable custom nodes.');
        console.log('   Example: CUSTOM_NODE_PATHS=/path/to/custom-nodes/*\n');
        return { deleted: 0, loaded: 0, errors: [] };
    }
    console.log(`📁 Custom node paths: ${customNodePaths.join(', ')}\n`);
    const dbPath = findDatabasePath();
    console.log(`📂 Using database: ${dbPath}\n`);
    const db = await (0, database_adapter_1.createDatabaseAdapter)(dbPath);
    const repository = new node_repository_1.NodeRepository(db);
    const loader = new node_loader_1.N8nNodeLoader();
    const parser = new node_parser_1.NodeParser();
    const toolVariantGenerator = new tool_variant_generator_1.ToolVariantGenerator();
    console.log('🗑️  Deleting existing custom nodes...');
    const deletedCount = repository.deleteCustomNodes();
    console.log(`   Deleted ${deletedCount} custom nodes\n`);
    console.log('📦 Loading custom nodes...');
    const loadedNodes = await loader.loadCustomNodes(customNodePaths);
    console.log(`   Found ${loadedNodes.length} custom nodes\n`);
    if (loadedNodes.length === 0) {
        console.log('⚠️  No custom nodes found in the specified paths.\n');
        db.close();
        return { deleted: deletedCount, loaded: 0, errors };
    }
    console.log('💾 Parsing and saving custom nodes...');
    let savedCount = 0;
    for (const { packageName, nodeName, NodeClass, sourceType, sourcePath } of loadedNodes) {
        try {
            const parsed = parser.parse(NodeClass, packageName);
            if (!parsed.nodeType || !parsed.displayName) {
                errors.push(`Missing required fields for ${nodeName}`);
                continue;
            }
            parsed.sourceType = sourceType;
            parsed.sourcePath = sourcePath;
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
                    }
                    catch (error) {
                        errors.push(`Failed to save Tool variant for ${nodeName}: ${error.message}`);
                    }
                }
            }
            repository.saveNode(parsed);
            savedCount++;
            console.log(`   ✅ ${parsed.nodeType}`);
        }
        catch (error) {
            errors.push(`Failed to process ${nodeName}: ${error.message}`);
            console.error(`   ❌ ${nodeName}: ${error.message}`);
        }
    }
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
if (require.main === module) {
    refreshCustomNodes().catch(error => {
        console.error('❌ Refresh failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=refresh-custom-nodes.js.map