function extractChatToMarkdown() {
    function handleFormattedText(element) {
        if (!element) return '';
        
        // Check if this element or any of its parents is an image container
        if (element.matches('.overflow-hidden.rounded-lg') && element.querySelector('img')) {
            const img = element.querySelector('img');
            const alt = img.getAttribute('alt')?.replace('Uploaded ', '') || 'image';
            return `\n[Uploaded ${alt}]\n\n`;
        }
        
        let text = '';
        
        // Process child nodes recursively
        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                switch (node.nodeName.toLowerCase()) {
                    case 'p':
                        const innerText = handleFormattedText(node);
                        text += `${innerText}\n\n`;
                        break;
                    case 'code':
                        if (node.parentElement.nodeName.toLowerCase() === 'pre') {
                            const language = node.className.replace('language-', '');
                            text += `\`\`\`${language}\n${node.textContent}\n\`\`\`\n\n`;
                        } else {
                            text += `\`${node.textContent}\``;
                        }
                        break;
                    case 'strong':
                    case 'b':
                        text += `**${handleFormattedText(node)}**`;
                        break;
                    case 'em':
                    case 'i':
                        text += `*${handleFormattedText(node)}*`;
                        break;
                    case 'a':
                        text += `[${handleFormattedText(node)}](${node.href})`;
                        break;
                    case 'ul':
                        text += '\n';
                        Array.from(node.children).forEach(li => {
                            text += `* ${handleFormattedText(li)}\n`;
                        });
                        text += '\n';
                        break;
                    case 'ol':
                        text += '\n';
                        Array.from(node.children).forEach((li, index) => {
                            text += `${index + 1}. ${handleFormattedText(li)}\n`;
                        });
                        text += '\n';
                        break;
                    case 'blockquote':
                        text += `> ${handleFormattedText(node)}\n\n`;
                        break;
                    case 'h1':
                        text += `# ${handleFormattedText(node)}\n\n`;
                        break;
                    case 'h2':
                        text += `## ${handleFormattedText(node)}\n\n`;
                        break;
                    case 'h3':
                        text += `### ${handleFormattedText(node)}\n\n`;
                        break;
                    case 'h4':
                        text += `#### ${handleFormattedText(node)}\n\n`;
                        break;
                    case 'h5':
                        text += `##### ${handleFormattedText(node)}\n\n`;
                        break;
                    case 'h6':
                        text += `###### ${handleFormattedText(node)}\n\n`;
                        break;
                    case 'br':
                        text += '\n';
                        break;
                    case 'hr':
                        text += '---\n\n';
                        break;
                    case 'table':
                        text += handleTable(node) + '\n\n';
                        break;
                    default:
                        text += handleFormattedText(node);
                }
            }
        });
        
        return text;
    }

    function handleTable(tableElement) {
        let markdown = '';
        const rows = tableElement.querySelectorAll('tr');
        
        // Process header
        const headers = rows[0]?.querySelectorAll('th');
        if (headers.length) {
            markdown += '| ' + Array.from(headers).map(th => handleFormattedText(th).trim()).join(' | ') + ' |\n';
            markdown += '| ' + Array(headers.length).fill('---').join(' | ') + ' |\n';
        }
        
        // Process body
        Array.from(rows).forEach((row, index) => {
            if (index === 0 && headers.length) return;
            const cells = row.querySelectorAll('td');
            if (cells.length) {
                markdown += '| ' + Array.from(cells).map(td => handleFormattedText(td).trim()).join(' | ') + ' |\n';
            }
        });
        
        return markdown;
    }

    // Get all conversation turns
    const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
    let markdown = '';
    
    // Add timestamp header
    const timestamp = new Date().toISOString();
    markdown += `# Chat Export (${timestamp})\n\n---\n\n`;
    
    articles.forEach((article, index) => {
        // Determine if it's user or assistant message
        const isUser = article.querySelector('h5.sr-only') !== null;
        
        // Add message separator
        markdown += `### ${isUser ? '🗣️ Human' : '🤖 Assistant'} (Message ${index + 1})\n\n`;
        
        // Get the main message content
        const messageContent = article.querySelector('.text-message');
        if (!messageContent) return;
        
        // Extract text content with formatting
        let text = handleFormattedText(messageContent);
        
        // Clean up extra newlines and spaces
        text = text.replace(/\n\n\n+/g, '\n\n').trim();
        
        // Add to markdown with proper formatting
        markdown += `${text}\n\n---\n\n`;
    });
    
    // Clean up any remaining multiple newlines
    markdown = markdown.replace(/\n\n\n+/g, '\n\n').trim();
    
    // Create a download link
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `chat-export-${new Date().toISOString().split('T')[0]}.md`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return markdown; // Also return the markdown string for console viewing
}

// Execute and copy to clipboard
extractChatToMarkdown();