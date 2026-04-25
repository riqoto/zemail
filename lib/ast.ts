import { EmailBlock, EmailAST, ASTBlock } from "./types"

export function encodeToAST(eventId: string, templateName: string, blocks: EmailBlock[]): EmailAST {
  return {
    id: `${eventId}_${templateName.replace(/\s+/g, '_')}`,
    block: blocks.map((b) => {
      // Encode content to base64 safely (handles unicode)
      const b64Content = typeof window !== 'undefined' 
        ? window.btoa(unescape(encodeURIComponent(b.content || '')))
        : Buffer.from(b.content || '').toString('base64');
      
      const astBlock: ASTBlock = {
        id: `${b.type}_${b64Content}`,
        style: {
          color: b.styles?.color,
          size: b.styles?.fontSize,
          textAlign: b.styles?.textAlign
        }
      }
      if (b.url) {
        astBlock.url = b.url;
      }
      return astBlock;
    })
  }
}

export function decodeFromAST(ast: EmailAST): EmailBlock[] {
  return ast.block.map((b, index) => {
    // Parse ID: type_base64content
    const separatorIdx = b.id.indexOf('_');
    const type = b.id.slice(0, separatorIdx) as any;
    const b64Content = b.id.slice(separatorIdx + 1);
    
    let content = '';
    try {
      content = typeof window !== 'undefined'
        ? decodeURIComponent(escape(window.atob(b64Content)))
        : Buffer.from(b64Content, 'base64').toString('utf8');
    } catch (e) {
      console.error("Failed to decode base64 block content", e);
    }

    return {
      id: String(Date.now() + index),
      type,
      content,
      styles: {
        color: b.style.color,
        fontSize: b.style.size,
        textAlign: b.style.textAlign
      },
      url: b.url
    }
  })
}

export function renderEmailHtml(blocks: EmailBlock[], vars: Record<string, string> = {}): string {
  const renderedBlocks = blocks.map((block) => {
    let content = block.content || '';
    
    // Replace dynamic variables based on context
    content = content.replace(/{{name}}/g, vars.name || '')
                     .replace(/{{surname}}/g, vars.surname || '')
                     .replace(/{{event_name}}/g, vars.event_name || '')
                     .replace(/{{ticket_link}}/g, vars.ticket_link || '');

    const styleStr = block.styles ? 
      `font-size: ${block.styles.fontSize || 16}px; color: ${block.styles.color || '#000000'}; text-align: ${block.styles.textAlign || 'left'};` : 
      '';

    switch (block.type) {
      case "header":
        return `<h1 style="font-weight: bold; margin-bottom: 16px; ${styleStr}">${content}</h1>`
      case "text":
        return `<p style="line-height: 1.6; margin-bottom: 16px; ${styleStr}">${content}</p>`
      case "button":
        const textAlign = block.styles?.textAlign || 'left';
        return `<div style="text-align: ${textAlign}; margin: 16px 0;"><a href="${block.url || '#'}" style="display: inline-block; background-color: ${block.styles?.color || '#4f46e5'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: ${block.styles?.fontSize || 16}px;">${content}</a></div>`
      case "image":
        const imgAlign = block.styles?.textAlign || 'left';
        return `<div style="text-align: ${imgAlign}; margin: 16px 0;"><img src="${block.url || content}" alt="Email image" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>`
      case "footer":
        return `<footer style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; ${styleStr}">${content}</footer>`
      default:
        return `<p style="${styleStr}">${content}</p>`
    }
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${renderedBlocks.join("\n")}
        </div>
      </body>
    </html>
  `
}
