# Airtable Model Context Protocol (MCP) Integration

This directory provides native **Model Context Protocol (MCP)** integration for Airtable.
With this configuration, AI agents (Antigravity, Claude Desktop, Cursor) can directly inspect your base schema, query records, write updates, and trigger automations in real time.

## Installed MCP Server
The globally installed package is `airtable-mcp-server`:
```bash
npm install -g airtable-mcp-server
```

## Quickstart

### 1. Configure Personal Access Token (PAT)
Obtain a token with `data.records:read`, `data.records:write`, and `schema.bases:read` from:
https://airtable.com/create/tokens

### 2. Antigravity IDE Integration
Add the configuration from `antigravity_mcp_config.json` into your local agent settings.

### 3. Claude Desktop Integration
Add the configuration from `claude_desktop_config.json` to:
`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

### 4. Available Agent Capabilities
Once connected, LLMs can autonomously:
- `describe_tables`: Inspect schema, field types, and linked relationships
- `list_records`: Query records with formula filters (`filterByFormula`)
- `create_records`: Insert new records
- `update_records`: Mutate existing records
