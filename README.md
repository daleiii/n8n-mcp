# n8n-MCP (Fork)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-ghcr.io%2Fdaleiii%2Fn8n--mcp-blue)](https://github.com/daleiii/n8n-mcp/pkgs/container/n8n-mcp)
[![Upstream](https://img.shields.io/badge/upstream-czlonkowski%2Fn8n--mcp-lightgrey)](https://github.com/czlonkowski/n8n-mcp)

A Model Context Protocol (MCP) server that provides AI assistants with comprehensive access to n8n node documentation, properties, and operations. This fork adds credential management, custom node support, and fork-aware version checking.

## Fork Enhancements

This fork ([daleiii/n8n-mcp](https://github.com/daleiii/n8n-mcp)) adds:

### Credential Management
Tools for managing n8n credentials via the API:
- `n8n_get_credential_schema` - Get schema for a credential type (required fields, etc.)
- `n8n_create_credential` - Create new credentials
- `n8n_update_credential` - Update existing credentials
- `n8n_delete_credential` - Delete credentials

> **Note:** The n8n public API does not support listing or retrieving credentials by ID for security reasons.

### Custom Node Support
Load and index custom nodes from local paths:
- Set `CUSTOM_NODE_PATHS` environment variable (comma-separated paths)
- Nodes are indexed with `CUSTOM.{nodeName}` format (matching n8n's registration)
- Use `n8n_refresh_custom_nodes` tool to hot-reload without restart
- Package name preserved in metadata for reference

### Fork Version Checking
The health check shows both fork and upstream version status:
- Detects fork versions via `-fork` suffix (e.g., `2.33.5-fork.1`)
- Checks GitHub releases for fork updates
- Checks npm registry for upstream updates
- Shows when sync with upstream is recommended

## Quick Start

### Option 1: npx (Recommended)

```bash
npx n8n-mcp
```

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true"
      }
    }
  }
}
```

**With n8n management tools** (optional):
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true",
        "N8N_API_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Option 2: Docker (This Fork)

```bash
docker pull ghcr.io/daleiii/n8n-mcp:latest
```

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "-e", "MCP_MODE=stdio",
        "-e", "LOG_LEVEL=error",
        "-e", "DISABLE_CONSOLE_OUTPUT=true",
        "ghcr.io/daleiii/n8n-mcp:latest"
      ]
    }
  }
}
```

### Option 3: Local Development

```bash
git clone https://github.com/daleiii/n8n-mcp.git
cd n8n-mcp
npm install && npm run build && npm run rebuild
npm start
```

**Restart Claude Desktop after updating configuration.**

## Features

- **1,084 n8n nodes** - 537 core + 547 community (301 verified)
- **2,709 workflow templates** with smart filtering
- **2,646 real-world examples** from popular templates
- **Config validation** before deployment
- **AI workflow validation** for LangChain agents
- **~12ms average response time**

## Available Tools

**Core Tools (7):** `tools_documentation`, `search_nodes`, `get_node`, `validate_node`, `validate_workflow`, `search_templates`, `get_template`

**Management Tools (17):** Workflow CRUD, execution management, health checks

**Credential Tools (4):** `n8n_get_credential_schema`, `n8n_create_credential`, `n8n_update_credential`, `n8n_delete_credential`

**Custom Node Tools (1):** `n8n_refresh_custom_nodes`

## Development

```bash
npm run build          # Build TypeScript
npm run rebuild        # Rebuild node database
npm test               # Run tests (3,336 tests)
npm run typecheck      # Type checking
```

## Syncing with Upstream

```bash
git fetch upstream
git merge upstream/main
npm run build && npm run typecheck && npm test
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [n8n](https://n8n.io) team for the workflow automation platform
- [Anthropic](https://anthropic.com) for the Model Context Protocol
- Original project: [czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp)
- All template contributors from the n8n community

---

<div align="center">
  <strong>Built with ❤️ for the n8n community</strong>
</div>
