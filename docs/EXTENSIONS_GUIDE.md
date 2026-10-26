# 🧩 Airtable Custom Extensions SDK Guide

Airtable Blocks / Custom Extensions allow developers to build React applications directly inside Airtable bases.

---

## 1. Prerequisites
- Global CLI installed:
  ```bash
  npm install -g @airtable/blocks-cli
  ```
- React 17 compatibility (`@airtable/blocks` requires React `^16.14.0 || ^17.0.0`).

---

## 2. Setting Up Personal Access Token
Run:
```bash
block set-api-key
```
Paste a PAT with `block:manage` scope.

---

## 3. Local Development Flow
```bash
cd extensions/enterprise-resource-matrix
block run
```
This spins up a local HTTPS development server at `https://localhost:9000`.

In your Airtable Base:
1. Click **Extensions** (top right) -> **Add an extension**.
2. Click **Build a custom extension**.
3. Choose the extension name and keep development server URL at `https://localhost:9000`.
4. Your custom React component will hot-reload directly inside Airtable!

---

## 4. Releasing to Production
Once development is complete:
```bash
block release
```
This bundles and uploads your extension to your Airtable account or workspace.
