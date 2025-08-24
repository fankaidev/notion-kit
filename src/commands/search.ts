import { Client } from '@notionhq/client';

export async function search(query: string) {
  const notionToken = process.env.NOTION_TOKEN;

  if (!notionToken) {
    console.error('Error: NOTION_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    const notion = new Client({ auth: notionToken });
    
    console.log(`Searching for: "${query}"\n`);
    
    const response = await notion.search({
      query,
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time'
      }
    });

    if (response.results.length === 0) {
      console.log('No results found.');
      return;
    }

    console.log(`Found ${response.results.length} results:\n`);

    response.results.forEach((result: any, index) => {
      const type = result.object === 'page' ? 'Page' : 'Database';
      const title = result.properties?.title?.title?.[0]?.plain_text || 
                   result.properties?.Name?.title?.[0]?.plain_text ||
                   result.title?.[0]?.plain_text ||
                   'Untitled';
      const lastEdited = new Date(result.last_edited_time).toLocaleDateString();
      
      console.log(`${index + 1}. [${type}] ${title}`);
      console.log(`   ID: ${result.id}`);
      console.log(`   Last edited: ${lastEdited}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error searching:', error);
    process.exit(1);
  }
}