import { Client } from '@notionhq/client';

export async function getPageInfo(pageId: string) {
  const notionToken = process.env.NOTION_TOKEN;

  if (!notionToken) {
    console.error('Error: NOTION_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    const notion = new Client({ auth: notionToken });
    
    const page = await notion.pages.retrieve({
      page_id: pageId
    }) as any;

    console.log('Page Information:\n');
    console.log(`ID: ${page.id}`);
    console.log(`Created: ${new Date(page.created_time).toLocaleString()}`);
    console.log(`Last edited: ${new Date(page.last_edited_time).toLocaleString()}`);
    console.log(`URL: ${page.url}`);
    
    if (page.icon) {
      if (page.icon.type === 'emoji') {
        console.log(`Icon: ${page.icon.emoji}`);
      } else if (page.icon.type === 'external') {
        console.log(`Icon: ${page.icon.external.url}`);
      }
    }

    if (page.cover) {
      if (page.cover.type === 'external') {
        console.log(`Cover: ${page.cover.external.url}`);
      }
    }

    console.log('\nProperties:');
    const properties = (page as any).properties;
    for (const [key, value] of Object.entries(properties)) {
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
      
      console.log(`  ${key}: ${displayValue}`);
    }

  } catch (error) {
    console.error('Error retrieving page info:', error);
    process.exit(1);
  }
}