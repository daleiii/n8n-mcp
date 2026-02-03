# MCP Tools Reference

Complete documentation for all available MCP tools in n8n-MCP.

## Core Tools (7 tools)

### tools_documentation
Get documentation for any MCP tool. **START HERE!**

### search_nodes
Full-text search across all nodes.
- `source: 'community'|'verified'` for community nodes
- `includeExamples: true` for configs

### get_node
Unified node information tool with multiple modes (v2.26.0):
- **Info mode** (default): `detail: 'minimal'|'standard'|'full'`, `includeExamples: true`
- **Docs mode**: `mode: 'docs'` - Human-readable markdown documentation
- **Property search**: `mode: 'search_properties'`, `propertyQuery: 'auth'`
- **Versions**: `mode: 'versions'|'compare'|'breaking'|'migrations'`

### validate_node
Unified node validation (v2.26.0):
- `mode: 'minimal'` - Quick required fields check (<100ms)
- `mode: 'full'` - Comprehensive validation with profiles (minimal, runtime, ai-friendly, strict)

### validate_workflow
Complete workflow validation including AI Agent validation.

### search_templates
Unified template search (v2.26.0):
- `searchMode: 'keyword'` (default) - Text search with `query` parameter
- `searchMode: 'by_nodes'` - Find templates using specific `nodeTypes`
- `searchMode: 'by_task'` - Curated templates for common `task` types
- `searchMode: 'by_metadata'` - Filter by `complexity`, `requiredService`, `targetAudience`

### get_template
Get complete workflow JSON (modes: nodes_only, structure, full).

---

## n8n Management Tools (18 tools)

**Requires** `N8N_API_URL` and `N8N_API_KEY` in your configuration.

### Workflow Management

| Tool | Description |
|------|-------------|
| `n8n_create_workflow` | Create new workflows with nodes and connections |
| `n8n_get_workflow` | Unified workflow retrieval with modes: full, details, structure, minimal |
| `n8n_update_full_workflow` | Update entire workflow (complete replacement) |
| `n8n_update_partial_workflow` | Update workflow using diff operations |
| `n8n_delete_workflow` | Delete workflows permanently |
| `n8n_list_workflows` | List workflows with filtering and pagination |
| `n8n_validate_workflow` | Validate workflows in n8n by ID |
| `n8n_autofix_workflow` | Automatically fix common workflow errors |
| `n8n_workflow_versions` | Manage version history and rollback |
| `n8n_deploy_template` | Deploy templates from n8n.io directly with auto-fix |

### Execution Management

| Tool | Description |
|------|-------------|
| `n8n_test_workflow` | Test/trigger workflow execution. Auto-detects trigger type (webhook, form, chat) |
| `n8n_executions` | Unified execution management: list, get, delete |

### Credential Management

| Tool | Description |
|------|-------------|
| `n8n_list_credentials` | List credentials (metadata only, never sensitive data) |
| `n8n_get_credential` | Get credential metadata by ID |
| `n8n_create_credential` | Create new credential with name, type, and data |
| `n8n_update_credential` | Update credential (rotate keys, rename) |
| `n8n_delete_credential` | Delete credential permanently |

### System Tools

| Tool | Description |
|------|-------------|
| `n8n_health_check` | Check n8n API connectivity and features |
| `n8n_refresh_custom_nodes` | Reload custom nodes without full rebuild |

---

## Example Usage

### Get node info with different detail levels

```typescript
get_node({
  nodeType: "nodes-base.httpRequest",
  detail: "standard",        // Default: Essential properties
  includeExamples: true      // Include real-world examples from templates
})
```

### Get documentation

```typescript
get_node({
  nodeType: "nodes-base.slack",
  mode: "docs"               // Human-readable markdown documentation
})
```

### Search for specific properties

```typescript
get_node({
  nodeType: "nodes-base.httpRequest",
  mode: "search_properties",
  propertyQuery: "authentication"
})
```

### Version history and breaking changes

```typescript
get_node({
  nodeType: "nodes-base.httpRequest",
  mode: "versions"            // View all versions with summary
})
```

### Search nodes with configuration examples

```typescript
search_nodes({
  query: "send email gmail",
  includeExamples: true       // Returns top 2 configs per node
})
```

### Search community nodes only

```typescript
search_nodes({
  query: "scraping",
  source: "community"         // Options: all, core, community, verified
})
```

### Search verified community nodes

```typescript
search_nodes({
  query: "pdf",
  source: "verified"          // Only verified community integrations
})
```

### Validate node configuration

```typescript
validate_node({
  nodeType: "nodes-base.httpRequest",
  config: { method: "POST", url: "..." },
  mode: "full",
  profile: "runtime"          // or "minimal", "ai-friendly", "strict"
})
```

### Quick required field check

```typescript
validate_node({
  nodeType: "nodes-base.slack",
  config: { resource: "message", operation: "send" },
  mode: "minimal"
})
```

### Search templates by task

```typescript
search_templates({
  searchMode: "by_task",
  task: "webhook_processing"
})
```
