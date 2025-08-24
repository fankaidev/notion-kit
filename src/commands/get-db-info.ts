import { Client } from '@notionhq/client';

export async function getDbInfo(databaseId: string, options: { limit?: number } = {}) {
  const notionToken = process.env.NOTION_TOKEN;

  if (!notionToken) {
    console.error('Error: NOTION_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    const notion = new Client({ auth: notionToken });
    
    // Get database info
    const database = await notion.databases.retrieve({
      database_id: databaseId
    }) as any;

    console.log('Database Information:\n');
    console.log(`Title: ${database.title.map((t: any) => t.plain_text).join('')}`);
    console.log(`ID: ${database.id}`);
    console.log(`Created: ${new Date(database.created_time).toLocaleString()}`);
    console.log(`Last edited: ${new Date(database.last_edited_time).toLocaleString()}`);
    console.log(`URL: ${database.url}`);

    console.log('\nProperties:');
    for (const [key, value] of Object.entries(database.properties)) {
      const prop = value as any;
      console.log(`  ${key}: ${prop.type}`);
    }

    // Get database entries
    const queryOptions: any = {};
    if (options.limit) {
      queryOptions.page_size = options.limit;
    }

    const response = await notion.databases.query({
      database_id: databaseId,
      ...queryOptions
    });

    console.log(`\nEntries (showing ${response.results.length}):\n`);

    response.results.forEach((page: any, index) => {
      console.log(`${index + 1}. Entry ID: ${page.id}`);
      
      for (const [key, value] of Object.entries(page.properties)) {
        const prop = value as any;
        let displayValue = '';
        
        switch (prop.type) {
          case 'title':
            displayValue = prop.title.map((t: any) => t.plain_text).join('') || 'Untitled';
            break;
          case 'rich_text':
            displayValue = prop.rich_text.map((t: any) => t.plain_text).join('');
            break;
          case 'number':
            displayValue = prop.number?.toString() || 'null';
            break;
          case 'select':
            displayValue = prop.select?.name || 'null';
            break;
          case 'multi_select':
            displayValue = prop.multi_select.map((s: any) => s.name).join(', ') || 'null';
            break;
          case 'date':
            displayValue = prop.date?.start || 'null';
            break;
          case 'checkbox':
            displayValue = prop.checkbox.toString();
            break;
          case 'url':
            displayValue = prop.url || 'null';
            break;
          case 'email':
            displayValue = prop.email || 'null';
            break;
          case 'phone_number':
            displayValue = prop.phone_number || 'null';
            break;
          default:
            displayValue = `[${prop.type}]`;
        }
        
        if (displayValue && displayValue !== 'null' && displayValue !== '') {
          console.log(`   ${key}: ${displayValue}`);
        }
      }
      console.log('');
    });

    if (response.has_more) {
      console.log('Note: There are more entries available. Use --limit option to see more.');
    }

  } catch (error) {
    console.error('Error retrieving database info:', error);
    process.exit(1);
  }
}