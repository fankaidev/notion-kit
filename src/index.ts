#!/usr/bin/env node

import { Command } from 'commander';
import { 
  getPage, 
  listPages, 
  search, 
  getPageInfo, 
  getDbInfo 
} from './commands';

const program = new Command();

program
  .name('notion-kit')
  .description('A comprehensive CLI tool for interacting with Notion')
  .version('1.0.0');

// Get page as markdown
program
  .command('get-page')
  .description('Convert a Notion page to Markdown')
  .argument('<page-id>', 'Notion page ID to convert')
  .action(async (pageId: string) => {
    await getPage(pageId);
  });

// List accessible pages
program
  .command('list-pages')
  .description('List all accessible Notion pages')
  .argument('[database-id]', 'Optional: Database ID to list pages from a specific database')
  .option('-s, --since <time>', 'Filter pages modified since (e.g., 24h, 7d, 2024-01-01, yesterday)')
  .option('-l, --limit <number>', 'Limit number of pages to display', '100')
  .action(async (databaseId: string | undefined, options: { since?: string, limit?: string }) => {
    await listPages(databaseId, options);
  });

// Search pages and databases
program
  .command('search')
  .description('Search Notion pages and databases')
  .argument('<query>', 'Search query')
  .action(async (query: string) => {
    await search(query);
  });

// Get page information
program
  .command('get-page-info')
  .description('Get detailed information about a Notion page')
  .argument('<page-id>', 'Notion page ID')
  .action(async (pageId: string) => {
    await getPageInfo(pageId);
  });

// Get database information and entries
program
  .command('get-db-info')
  .description('Get Notion database information and entries')
  .argument('<database-id>', 'Notion database ID')
  .option('-l, --limit <number>', 'Limit number of entries to display', '10')
  .action(async (databaseId: string, options: { limit?: string }) => {
    const limit = options.limit ? parseInt(options.limit) : undefined;
    await getDbInfo(databaseId, { limit });
  });

program.parse();