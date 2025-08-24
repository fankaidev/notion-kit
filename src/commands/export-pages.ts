import { Client } from '@notionhq/client';
import { NotionConverter } from 'notion-to-md';
import { parseTimeString } from '../utils/time-parser';
import * as fs from 'fs';
import * as path from 'path';

function sanitizeFilename(title: string): string {
  // Remove '#' and everything after it
  const titleWithoutHash = title.split('#')[0];
  
  // Replace invalid filename characters and trim
  return titleWithoutHash
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
    .substring(0, 60); // Limit length to leave room for date prefix and page ID
}

function formatDateForFilename(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

interface PageIndex {
  [pageId: string]: string; // pageId -> filename mapping
}

function loadPageIndex(dateDir: string): PageIndex {
  const indexPath = path.join(dateDir, '.index.json');
  try {
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`Warning: Could not read index file ${indexPath}`);
  }
  return {};
}

function savePageIndex(dateDir: string, index: PageIndex): void {
  const indexPath = path.join(dateDir, '.index.json');
  try {
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
  } catch (error) {
    console.warn(`Warning: Could not save index file ${indexPath}`);
  }
}


function shouldExportPage(filepath: string, pageLastEdited: string): boolean {
  if (!fs.existsSync(filepath)) {
    return true; // File doesn't exist, should export
  }
  
  try {
    const fileStat = fs.statSync(filepath);
    const fileModifiedTime = fileStat.mtime;
    const pageLastEditedDate = new Date(pageLastEdited);
    
    // Export if page was modified after the file's last modification
    return pageLastEditedDate > fileModifiedTime;
    
  } catch (error) {
    // If we can't get file stats, better to export
    return true;
  }
}

function formatPropertyValue(prop: any): any {
  if (!prop) return null;
  
  switch (prop.type) {
    case 'title':
      return prop.title.map((t: any) => t.plain_text).join('');
    case 'rich_text':
      return prop.rich_text.map((t: any) => t.plain_text).join('');
    case 'number':
      return prop.number;
    case 'select':
      return prop.select?.name || null;
    case 'multi_select':
      return prop.multi_select.map((s: any) => s.name);
    case 'date':
      return prop.date?.start || null;
    case 'checkbox':
      return prop.checkbox;
    case 'url':
      return prop.url || null;
    case 'email':
      return prop.email || null;
    case 'phone_number':
      return prop.phone_number || null;
    case 'people':
      return prop.people.map((p: any) => p.name || p.id);
    case 'files':
      return prop.files.map((f: any) => f.name || f.external?.url || f.file?.url);
    case 'created_time':
      return prop.created_time;
    case 'last_edited_time':
      return prop.last_edited_time;
    case 'created_by':
      return prop.created_by?.name || prop.created_by?.id;
    case 'last_edited_by':
      return prop.last_edited_by?.name || prop.last_edited_by?.id;
    default:
      return null;
  }
}

async function exportPage(notion: Client, pageId: string, outputDir: string): Promise<{ exported: boolean; skipped: boolean; title: string }> {
  try {
    // Get page metadata
    const page = await notion.pages.retrieve({
      page_id: pageId
    }) as any;
    
    // Extract title
    let title = 'Untitled';
    const properties = page.properties || {};
    
    for (const [key, value] of Object.entries(properties)) {
      const prop = value as any;
      if (prop.type === 'title') {
        const titleText = prop.title.map((t: any) => t.plain_text).join('');
        if (titleText) {
          title = titleText;
          break;
        }
      }
    }
    
    // Prepare frontmatter
    const frontmatter: any = {
      title,
      notion_id: page.id,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      url: page.url,
    };
    
    // Add icon if exists
    if (page.icon) {
      if (page.icon.type === 'emoji') {
        frontmatter.icon = page.icon.emoji;
      } else if (page.icon.type === 'external') {
        frontmatter.icon_url = page.icon.external.url;
      }
    }
    
    // Add cover if exists
    if (page.cover) {
      if (page.cover.type === 'external') {
        frontmatter.cover_url = page.cover.external.url;
      }
    }
    
    // Add all properties
    const propertiesData: any = {};
    for (const [key, value] of Object.entries(properties)) {
      const formattedValue = formatPropertyValue(value);
      if (formattedValue !== null && formattedValue !== '') {
        propertiesData[key] = formattedValue;
      }
    }
    
    if (Object.keys(propertiesData).length > 0) {
      frontmatter.properties = propertiesData;
    }
    
    // Convert page content to markdown
    process.env.NODE_ENV = 'production';
    const originalDebug = console.debug;
    console.debug = () => { }; // Disable all console.debug output
    
    const n2m = new NotionConverter(notion);
    const result = await n2m.convert(pageId);
    const mdString = result.content;
    
    console.debug = originalDebug; // Restore debug
    
    // Create YAML frontmatter
    const yaml = require('js-yaml');
    const yamlStr = yaml.dump(frontmatter, { 
      skipInvalid: true,
      lineWidth: -1 
    });
    
    // Combine frontmatter and content
    const fullContent = `---\n${yamlStr}---\n\n${mdString}`;
    
    // Write to file
    const datePrefix = formatDateForFilename(page.created_time); // Use created_time
    const pageIdShort = page.id.replace(/-/g, '').substring(0, 8); // Take first 8 chars, remove hyphens
    const sanitizedTitle = sanitizeFilename(title);
    const newFilename = `${pageIdShort}_${sanitizedTitle}.md`;
    
    // Create date directory if it doesn't exist
    const dateDir = path.join(outputDir, datePrefix);
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }
    
    // Load existing index
    const index = loadPageIndex(dateDir);
    const existingFilename = index[pageIdShort];
    
    // Determine final filename and filepath
    let filename = newFilename;
    let filepath = path.join(dateDir, filename);
    
    // If page exists with different filename, remove old file
    if (existingFilename && existingFilename !== newFilename) {
      const oldFilepath = path.join(dateDir, existingFilename);
      if (fs.existsSync(oldFilepath)) {
        fs.unlinkSync(oldFilepath);
        console.log(`🗑 Removed old file: ${existingFilename}`);
      }
    }
    
    // Check if we need to export this page
    if (!shouldExportPage(filepath, page.last_edited_time)) {
      console.log(`⏭ Skipped: ${title} (unchanged)`);
      return { exported: false, skipped: true, title };
    }
    
    fs.writeFileSync(filepath, fullContent, 'utf8');
    
    // Update index
    index[pageIdShort] = filename;
    savePageIndex(dateDir, index);
    
    console.log(`✓ Exported: ${title} → ${datePrefix}/${filename}`);
    return { exported: true, skipped: false, title };
    
  } catch (error: any) {
    console.error(`✗ Failed to export page ${pageId}: ${error.message}`);
    return { exported: false, skipped: false, title: 'Unknown' };
  }
}

export async function exportPages(
  databaseId?: string, 
  options: { 
    since?: string, 
    limit?: string, 
    output?: string 
  } = {}
) {
  const notionToken = process.env.NOTION_TOKEN;

  if (!notionToken) {
    console.error('Error: NOTION_TOKEN environment variable is required');
    process.exit(1);
  }

  // Set default output directory
  const outputDir = options.output || './notion-export';
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}\n`);
  } else {
    console.log(`Using output directory: ${outputDir}\n`);
  }

  try {
    const notion = new Client({ auth: notionToken });
    
    // Parse time filter if provided
    let sinceDate: Date | undefined;
    if (options.since) {
      try {
        sinceDate = parseTimeString(options.since);
        console.log(`Filtering pages modified since: ${sinceDate.toLocaleString()}\n`);
      } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
    }
    
    const limit = options.limit ? parseInt(options.limit) : 100;
    let pages: any[] = [];
    
    if (databaseId) {
      // Export pages from a specific database
      console.log(`Exporting pages from database: ${databaseId}\n`);
      
      const queryParams: any = {
        database_id: databaseId,
        sorts: [
          {
            timestamp: 'last_edited_time',
            direction: 'descending'
          }
        ],
        page_size: Math.min(limit, 100)
      };
      
      // Add time filter if provided
      if (sinceDate) {
        queryParams.filter = {
          timestamp: 'last_edited_time',
          last_edited_time: {
            after: sinceDate.toISOString()
          }
        };
      }
      
      const response = await notion.databases.query(queryParams);
      pages = response.results;
      
      // Filter by date if needed
      if (sinceDate) {
        pages = pages.filter((page: any) => 
          new Date(page.last_edited_time) >= sinceDate
        );
      }
      
    } else {
      // Export all accessible pages
      console.log('Searching for pages to export...\n');
      
      const response = await notion.search({
        filter: {
          property: 'object',
          value: 'page'
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        }
      });
      
      pages = response.results;
      
      // Filter by date if provided
      if (sinceDate) {
        pages = pages.filter((page: any) => 
          new Date(page.last_edited_time) >= sinceDate
        );
      }
    }
    
    // Apply limit
    pages = pages.slice(0, limit);

    if (pages.length === 0) {
      if (options.since) {
        console.log(`No pages found modified since ${sinceDate!.toLocaleString()}.`);
      } else {
        console.log('No pages found to export.');
      }
      return;
    }

    console.log(`Starting export of ${pages.length} pages...\n`);
    
    // Export each page
    let exportedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    for (const page of pages) {
      const result = await exportPage(notion, page.id, outputDir);
      if (result.exported) {
        exportedCount++;
      } else if (result.skipped) {
        skippedCount++;
      } else {
        failedCount++;
      }
    }
    
    console.log(`\n✅ Export complete:`);
    console.log(`   ${exportedCount} pages exported`);
    if (skippedCount > 0) {
      console.log(`   ${skippedCount} pages skipped (unchanged)`);
    }
    if (failedCount > 0) {
      console.log(`   ${failedCount} pages failed`);
    }
    console.log(`   Output directory: ${outputDir}`);
    
  } catch (error) {
    console.error('Error exporting pages:', error);
    process.exit(1);
  }
}