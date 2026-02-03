# n8n-MCP

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/n8n-mcp.svg)](https://www.npmjs.com/package/n8n-mcp)
[![n8n version](https://img.shields.io/badge/n8n-2.4.4-orange.svg)](https://github.com/n8n-io/n8n)

A Model Context Protocol (MCP) server that provides AI assistants with comprehensive access to n8n node documentation, properties, and operations. Gives Claude and other AI assistants deep knowledge about n8n's 1,084 workflow automation nodes (537 core + 547 community).

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

### Option 2: Docker

```bash
docker pull ghcr.io/czlonkowski/n8n-mcp:latest
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
        "ghcr.io/czlonkowski/n8n-mcp:latest"
      ]
    }
  }
}
```

### Option 3: Local Development

```bash
git clone https://github.com/czlonkowski/n8n-mcp.git
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

## Fork-Specific Additions

This fork ([daleiii/n8n-mcp](https://github.com/daleiii/n8n-mcp)) adds:
- **Credential Management** - Full CRUD for n8n credentials
- **Custom Node Support** - Load nodes from local paths
- **Hot Reload** - Refresh custom nodes without restart
- **Telemetry Disabled** - No usage data collected

## Available Tools

**Core Tools (7):** `tools_documentation`, `search_nodes`, `get_node`, `validate_node`, `validate_workflow`, `search_templates`, `get_template`

**Management Tools (18):** Workflow CRUD, execution management, credential management, health checks

See [MCP Tools Reference](./docs/MCP_TOOLS_REFERENCE.md) for complete documentation.

## Documentation

| Guide | Description |
|-------|-------------|
| [Installation](./docs/INSTALLATION.md) | Comprehensive setup instructions |
| [Claude Desktop Setup](./docs/README_CLAUDE_SETUP.md) | Detailed Claude configuration |
| [Docker Guide](./docs/DOCKER_README.md) | Advanced Docker deployment |
| [Railway Deployment](./docs/RAILWAY_DEPLOYMENT.md) | One-click cloud deployment |
| [Claude Project Instructions](./docs/CLAUDE_PROJECT_INSTRUCTIONS.md) | Optimized system prompts for Claude |
| [MCP Tools Reference](./docs/MCP_TOOLS_REFERENCE.md) | Complete tool documentation |

### IDE Setup

| IDE | Guide |
|-----|-------|
| Claude Code | [Setup](./docs/CLAUDE_CODE_SETUP.md) |
| VS Code | [Setup](./docs/VS_CODE_PROJECT_SETUP.md) |
| Cursor | [Setup](./docs/CURSOR_SETUP.md) |
| Windsurf | [Setup](./docs/WINDSURF_SETUP.md) |
| Codex | [Setup](./docs/CODEX_SETUP.md) |
| Antigravity | [Setup](./docs/ANTIGRAVITY_SETUP.md) |

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
