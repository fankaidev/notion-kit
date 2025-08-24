import { Client } from '@notionhq/client';
import { parseTimeString } from '../utils/time-parser';

export async function listPages(databaseId?: string, options: { since?: string, limit?: string } = {}) {
  const notionToken = process.env.NOTION_TOKEN;

  if (!notionToken) {
    console.error('Error: NOTION_TOKEN environment variable is required');
    process.exit(1);
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
    
    if (databaseId) {
      // List pages from a specific database
      console.log(`Listing pages from database: ${databaseId}\n`);
      
      const queryParams: any = {
        database_id: databaseId,
        sorts: [
          {
            timestamp: 'last_edited_time',
            direction: 'descending'
          }
        ],
        page_size: Math.min(limit, 100) // Notion API max is 100 per request
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

      let results = response.results;
      
      // Filter by date if needed (in case API filtering didn't work as expected)
      if (sinceDate) {
        results = results.filter((page: any) => 
          new Date(page.last_edited_time) >= sinceDate
        );
      }
      
      // Apply limit
      results = results.slice(0, limit);

      if (results.length === 0) {
        if (options.since) {
          console.log(`No pages found in this database modified since ${sinceDate!.toLocaleString()}.`);
        } else {
          console.log('No pages found in this database. Make sure your integration has access to the database.');
        }
        return;
      }

      console.log(`Found ${results.length} pages in database:\n`);

      results.forEach((page: any, index) => {
        const title = page.properties?.title?.title?.[0]?.plain_text || 
                     page.properties?.Name?.title?.[0]?.plain_text ||
                     (Object.values(page.properties).find((prop: any) => prop.type === 'title') as any)?.title?.[0]?.plain_text ||
                     'Untitled';
        const lastEdited = new Date(page.last_edited_time);
        const lastEditedStr = `${lastEdited.toLocaleDateString()} ${lastEdited.toLocaleTimeString()}`;
        
        console.log(`${index + 1}. ${title}`);
        console.log(`   ID: ${page.id}`);
        console.log(`   Last edited: ${lastEditedStr}`);
        console.log('');
      });
    } else {
      // List all accessible pages
      console.log('Searching for pages...\n');
      
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

      let results = response.results;
      
      // Filter by date if provided
      if (sinceDate) {
        results = results.filter((page: any) => 
          new Date(page.last_edited_time) >= sinceDate
        );
      }
      
      // Apply limit
      results = results.slice(0, limit);

      if (results.length === 0) {
        if (options.since) {
          console.log(`No pages found modified since ${sinceDate!.toLocaleString()}.`);
        } else {
          console.log('No pages found. Make sure your integration has access to pages.');
        }
        return;
      }

      console.log(`Found ${results.length} pages:\n`);

      results.forEach((page: any, index) => {
        const title = page.properties?.title?.title?.[0]?.plain_text || 
                     page.properties?.Name?.title?.[0]?.plain_text ||
                     'Untitled';
        const lastEdited = new Date(page.last_edited_time);
        const lastEditedStr = `${lastEdited.toLocaleDateString()} ${lastEdited.toLocaleTimeString()}`;
        
        console.log(`${index + 1}. ${title}`);
        console.log(`   ID: ${page.id}`);
        console.log(`   Last edited: ${lastEditedStr}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error listing pages:', error);
    process.exit(1);
  }
}