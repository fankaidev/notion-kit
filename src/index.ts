#!/usr/bin/env node

import { Client } from '@notionhq/client';
import { Command } from 'commander';
import { NotionConverter } from 'notion-to-md';
import { DefaultExporter } from 'notion-to-md/plugins/exporter';

const program = new Command();

async function convertPageToMarkdown(pageId: string) {
  const notionToken = process.env.NOTION_TOKEN;

  if (!notionToken) {
    console.error('Error: NOTION_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    const notion = new Client({ auth: notionToken });
    const exporter = new DefaultExporter({
      outputType: 'stdout',
    });
    process.env.NODE_ENV = 'production';
    const originalDebug = console.debug;
    console.debug = () => { }; // Disable all console.debug output
    const n2m = new NotionConverter(notion).withExporter(exporter);
    await n2m.convert(pageId);
    console.debug = originalDebug; // Restore debug
  } catch (error) {
    console.error('Error converting page to markdown:', error);
    process.exit(1);
  }
}

program
  .name('notion-kit')
  .description('Convert Notion pages to Markdown')
  .version('1.0.0')
  .argument('<page-id>', 'Notion page ID to convert')
  .action(async (pageId: string) => {
    await convertPageToMarkdown(pageId);
  });

program.parse();