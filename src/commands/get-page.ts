import { Client } from '@notionhq/client';
import { NotionConverter } from 'notion-to-md';
import { DefaultExporter } from 'notion-to-md/plugins/exporter';

export async function getPage(pageId: string) {
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