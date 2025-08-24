# Notion Kit

A comprehensive CLI tool for interacting with Notion - convert pages to markdown, search, list pages, and manage databases.

## Installation

```bash
npm install -g .
```

## Setup

Set your Notion integration token as an environment variable:
```bash
export NOTION_TOKEN=your_notion_integration_token
```

## Commands

### `get-page <page-id>`
Convert a Notion page to Markdown format.

```bash
# Convert a specific page to markdown
notion-kit get-page 12345678-1234-1234-1234-123456789abc
```

### `list-pages [database-id]`
List all accessible Notion pages with their IDs and metadata. Optionally specify a database ID to list pages from that specific database.

**Options:**
- `-s, --since <time>` - Filter pages modified since a specific time
- `-l, --limit <number>` - Limit number of pages to display (default: 100)

**Time Filter Formats:**
- **Relative time**: `24h`, `7d`, `1w`, `1m` (hours/days/weeks/months)
- **Natural language**: `today`, `yesterday`, `this-week`, `last-week`, `this-month`, `last-month`
- **ISO date**: `2024-01-01`

```bash
# List all pages you have access to
notion-kit list-pages

# List pages from a specific database
notion-kit list-pages 12345678-1234-1234-1234-123456789abc

# List pages modified in the last 24 hours
notion-kit list-pages --since 24h

# List pages from a database modified in the last week
notion-kit list-pages abc123... --since 7d

# List pages modified since yesterday
notion-kit list-pages --since yesterday

# List pages modified since a specific date
notion-kit list-pages --since 2024-01-01

# Combine filters: last 7 days, max 20 results
notion-kit list-pages --since 7d --limit 20
```

### `search <query>`
Search for pages and databases across your Notion workspace.

```bash
# Search for pages containing "project"
notion-kit search "project"

# Search for databases
notion-kit search "database name"
```

### `get-page-info <page-id>`
Get detailed information about a specific Notion page including properties, metadata, and timestamps.

```bash
# Get detailed info about a page
notion-kit get-page-info 12345678-1234-1234-1234-123456789abc
```

### `get-db-info <database-id>`
Retrieve database information and entries with their properties.

```bash
# Get database info and first 10 entries
notion-kit get-db-info 12345678-1234-1234-1234-123456789abc

# Get database info and first 50 entries
notion-kit get-db-info 12345678-1234-1234-1234-123456789abc --limit 50
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev <command> [args...]

# Example: Test the get-page command
npm run dev get-page 12345678-1234-1234-1234-123456789abc
```

## Requirements

- Node.js (v16 or higher recommended)
- A Notion integration token with appropriate permissions
- Access to Notion pages/databases you want to interact with

## Getting Your Notion Integration Token

1. Go to [Notion Integrations](https://www.notion.com/my-integrations)
2. Click "New integration"
3. Give it a name and select your workspace
4. Copy the "Internal Integration Token"
5. Share your Notion pages/databases with your integration

## Supported Notion Features

### Pages
- Convert to Markdown using notion-to-md v4
- Retrieve page metadata and properties  
- List and search pages
- Support for all Notion block types

### Databases
- View database schema and properties
- List database entries with their values
- Support for all property types (text, number, select, date, etc.)

### Property Types
- Title, Rich Text, Number
- Select, Multi-select 
- Date, Checkbox
- URL, Email, Phone
- And more...

## About notion-to-md v4

The `get-page` command is powered by `notion-to-md@4.0.0-alpha.7`, which provides:

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

## Examples

```bash
# Get help for all commands
notion-kit --help

# Get help for a specific command
notion-kit get-page --help

# List all your pages
notion-kit list-pages

# List pages modified in the last 24 hours
notion-kit list-pages --since 24h

# List pages from a specific database
notion-kit list-pages abc123...

# Search for pages about "API documentation"
notion-kit search "API documentation"

# Get detailed info about a page
notion-kit get-page-info abc123...

# Convert page to markdown and save to file
notion-kit get-page abc123... > my-page.md

# View database structure and entries
notion-kit get-db-info def456... --limit 20
```

## Error Handling

The tool provides helpful error messages for common issues:
- Missing or invalid NOTION_TOKEN
- Invalid page/database IDs
- Permission errors (page not shared with integration)
- Network connectivity issues
- API rate limiting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC