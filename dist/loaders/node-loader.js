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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nNodeLoader = void 0;
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
class N8nNodeLoader {
    constructor() {
        this.CORE_PACKAGES = [
            { name: 'n8n-nodes-base', path: 'n8n-nodes-base' },
            { name: '@n8n/n8n-nodes-langchain', path: '@n8n/n8n-nodes-langchain' }
        ];
    }
    async loadAllNodes() {
        const results = [];
        for (const pkg of this.CORE_PACKAGES) {
            try {
                console.log(`\n📦 Loading package: ${pkg.name} from ${pkg.path}`);
                const packageJson = require(`${pkg.path}/package.json`);
                console.log(`  Found ${Object.keys(packageJson.n8n?.nodes || {}).length} nodes in package.json`);
                const nodes = await this.loadPackageNodes(pkg.name, pkg.path, packageJson);
                for (const node of nodes) {
                    node.sourceType = 'official';
                }
                results.push(...nodes);
            }
            catch (error) {
                console.error(`Failed to load ${pkg.name}:`, error);
            }
        }
        return results;
    }
    async loadPackageNodes(packageName, packagePath, packageJson) {
        const n8nConfig = packageJson.n8n || {};
        const nodes = [];
        const nodesList = n8nConfig.nodes || [];
        if (Array.isArray(nodesList)) {
            for (const nodePath of nodesList) {
                try {
                    const fullPath = require.resolve(`${packagePath}/${nodePath}`);
                    const nodeModule = require(fullPath);
                    const nodeNameMatch = nodePath.match(/\/([^\/]+)\.node\.(js|ts)$/);
                    const nodeName = nodeNameMatch ? nodeNameMatch[1] : path_1.default.basename(nodePath, '.node.js');
                    const NodeClass = nodeModule.default || nodeModule[nodeName] || Object.values(nodeModule)[0];
                    if (NodeClass) {
                        nodes.push({ packageName, nodeName, NodeClass, sourceType: 'official' });
                        console.log(`  ✓ Loaded ${nodeName} from ${packageName}`);
                    }
                    else {
                        console.warn(`  ⚠ No valid export found for ${nodeName} in ${packageName}`);
                    }
                }
                catch (error) {
                    console.error(`  ✗ Failed to load node from ${packageName}/${nodePath}:`, error.message);
                }
            }
        }
        else {
            for (const [nodeName, nodePath] of Object.entries(nodesList)) {
                try {
                    const fullPath = require.resolve(`${packagePath}/${nodePath}`);
                    const nodeModule = require(fullPath);
                    const NodeClass = nodeModule.default || nodeModule[nodeName] || Object.values(nodeModule)[0];
                    if (NodeClass) {
                        nodes.push({ packageName, nodeName, NodeClass, sourceType: 'official' });
                        console.log(`  ✓ Loaded ${nodeName} from ${packageName}`);
                    }
                    else {
                        console.warn(`  ⚠ No valid export found for ${nodeName} in ${packageName}`);
                    }
                }
                catch (error) {
                    console.error(`  ✗ Failed to load node ${nodeName} from ${packageName}:`, error.message);
                }
            }
        }
        return nodes;
    }
    async loadCustomNodes(paths) {
        const results = [];
        const resolvedSources = this.resolveCustomPaths(paths);
        console.log(`\n📦 Loading custom nodes from ${resolvedSources.length} packages...`);
        for (const source of resolvedSources) {
            try {
                const nodes = await this.loadCustomPackage(source.path);
                for (const node of nodes) {
                    node.sourcePath = source.path;
                }
                results.push(...nodes);
            }
            catch (error) {
                console.error(`  ✗ Failed to load custom package ${source.name}:`, error.message);
            }
        }
        return results;
    }
    resolveCustomPaths(paths) {
        const sources = [];
        for (const inputPath of paths) {
            const trimmedPath = inputPath.trim();
            if (!trimmedPath)
                continue;
            if (trimmedPath.endsWith('/*')) {
                const parentDir = trimmedPath.slice(0, -2);
                if (!fs.existsSync(parentDir)) {
                    console.warn(`  ⚠ Parent directory does not exist: ${parentDir}`);
                    continue;
                }
                try {
                    const entries = fs.readdirSync(parentDir, { withFileTypes: true });
                    for (const entry of entries) {
                        if (entry.isDirectory()) {
                            const fullPath = path_1.default.join(parentDir, entry.name);
                            const packageJsonPath = path_1.default.join(fullPath, 'package.json');
                            if (fs.existsSync(packageJsonPath)) {
                                sources.push({ name: entry.name, path: fullPath });
                            }
                            else {
                                console.warn(`  ⚠ Skipping ${entry.name}: no package.json found`);
                            }
                        }
                    }
                }
                catch (error) {
                    console.error(`  ✗ Failed to scan directory ${parentDir}:`, error.message);
                }
            }
            else {
                if (!fs.existsSync(trimmedPath)) {
                    console.warn(`  ⚠ Path does not exist: ${trimmedPath}`);
                    continue;
                }
                const packageJsonPath = path_1.default.join(trimmedPath, 'package.json');
                if (!fs.existsSync(packageJsonPath)) {
                    console.warn(`  ⚠ No package.json found in: ${trimmedPath}`);
                    continue;
                }
                const name = path_1.default.basename(trimmedPath);
                sources.push({ name, path: trimmedPath });
            }
        }
        return sources;
    }
    async loadCustomPackage(packagePath) {
        const nodes = [];
        this.clearRequireCache(packagePath);
        const packageJsonPath = path_1.default.join(packagePath, 'package.json');
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        const packageName = packageJson.name || path_1.default.basename(packagePath);
        const n8nConfig = packageJson.n8n || {};
        if (!n8nConfig.nodes || !Array.isArray(n8nConfig.nodes) || n8nConfig.nodes.length === 0) {
            console.warn(`  ⚠ No n8n.nodes array found in ${packageName}/package.json`);
            return nodes;
        }
        console.log(`  📦 Loading custom package: ${packageName}`);
        for (const nodePath of n8nConfig.nodes) {
            try {
                const fullPath = path_1.default.resolve(packagePath, nodePath);
                if (!fs.existsSync(fullPath)) {
                    console.warn(`    ⚠ Node file not found: ${fullPath}`);
                    continue;
                }
                delete require.cache[fullPath];
                const nodeModule = require(fullPath);
                const nodeNameMatch = nodePath.match(/\/([^\/]+)\.node\.(js|ts)$/);
                const nodeName = nodeNameMatch ? nodeNameMatch[1] : path_1.default.basename(nodePath, '.node.js');
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
                }
                else {
                    console.warn(`    ⚠ No valid export found for ${nodeName} in ${packageName}`);
                }
            }
            catch (error) {
                console.error(`    ✗ Failed to load custom node from ${nodePath}:`, error.message);
            }
        }
        return nodes;
    }
    clearRequireCache(packagePath) {
        const keysToRemove = Object.keys(require.cache).filter(key => key.startsWith(packagePath));
        for (const key of keysToRemove) {
            delete require.cache[key];
        }
    }
}
exports.N8nNodeLoader = N8nNodeLoader;
//# sourceMappingURL=node-loader.js.map