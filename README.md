# Notion Kit

A CLI tool to convert Notion pages to Markdown using TypeScript, powered by notion-to-md v4.

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

## About notion-to-md v4

This project uses `notion-to-md@4.0.0-alpha.7`, which provides powerful conversion capabilities:

### Key Features
- **Plugin-based Architecture**: Extensible with custom renderer and exporter plugins
- **Flexible Media Handling**: Multiple strategies for handling media files and downloads
- **Page Reference Support**: Built-in support for Notion page references and links
- **Performance Optimizations**: Efficient conversion of large Notion pages
- **Robust Error Handling**: Comprehensive error handling throughout the conversion pipeline

### Core Concepts

#### Renderer Plugins
- **Context & Variables**: Template-based rendering with variable substitution
- **Block Transformers**: Custom transformation logic for Notion blocks
- **Annotation Transformers**: Handle text formatting and annotations
- **Database Property Transformers**: Convert Notion database properties
- **Frontmatter Transformers**: Generate YAML frontmatter from page metadata

#### Exporter Plugins
- **File Export**: Save converted content to files
- **Console Output (stdout)**: Direct output to terminal (used in this CLI)
- **In-memory Buffer**: Process content in memory for further manipulation

#### Media Handling Strategies
- Configurable download and transformation of embedded media
- Support for images, files, and other media types
- Flexible file naming and organization options

### Advanced Usage

The current implementation uses the `DefaultExporter` with stdout output:

```typescript
const exporter = new DefaultExporter({
  outputType: 'stdout',
});
const n2m = new NotionConverter(notion).withExporter(exporter);
await n2m.convert(pageId);
```

For more advanced usage patterns, see the [notion-to-md v4 documentation](https://notionconvert.com/docs/v4/).

### Conversion Result Structure
The conversion process provides:
- **Markdown content**: Standard Markdown output
- **Raw Notion blocks**: Access to original Notion block data
- **Page properties**: Notion page metadata and properties
- **Additional metadata**: Conversion timestamps and processing information