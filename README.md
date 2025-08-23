# Notion Kit

A CLI tool to convert Notion pages to Markdown using TypeScript.

## Installation

```bash
npm install -g .
```

## Usage

1. Set your Notion integration token as an environment variable:
```bash
export NOTION_TOKEN=your_notion_integration_token
```

2. Run the CLI with a page ID:
```bash
notion-kit <page-id>
```

## Development

```bash
npm install
npm run build
npm run dev <page-id>
```

## Requirements

- Node.js
- A Notion integration token with access to the page you want to convert