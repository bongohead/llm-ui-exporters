/**
Open up the webpage for a conversation on Claude, and paste this into the console (F12), then type saveChatAsMarkdown()

This function will export that conversation to Markdown format.
**/
function saveChatAsMarkdown() {
    // Get all message containers
    const messages = document.querySelectorAll('[data-testid="user-message"], .font-claude-message');
    let markdown = '';
    
    function processNode(node) {
        // If it's a text node, return its content
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }
        
        // Handle different element types
        switch (node.nodeName.toLowerCase()) {
            case 'pre':
                // Handle code blocks
                const code = node.querySelector('code');
                if (code) {
                    const language = code.className.replace('language-', '').split(' ')[0] || '';
                    return `\n\`\`\`${language}\n${code.textContent.trim()}\n\`\`\`\n`;
                }
                return node.textContent;
                
            case 'code':
                // Handle inline code (only if not inside pre)
                if (!node.closest('pre')) {
                    return `\`${node.textContent}\``;
                }
                return '';
                
            case 'ol':
                // Handle ordered lists
                return '\n' + Array.from(node.children).map((li, index) => 
                    `${index + 1}. ${processNode(li)}`
                ).join('\n') + '\n';
                
            case 'ul':
                // Handle unordered lists
                return '\n' + Array.from(node.children).map(li => 
                    `* ${processNode(li)}`
                ).join('\n') + '\n';
                
            case 'li':
                // Handle list items (when processed directly)
                return processNode(node.firstChild);
                
            case 'p':
                // Handle paragraphs
                return '\n' + Array.from(node.childNodes).map(processNode).join('') + '\n';
                
            case 'strong':
            case 'b':
                // Handle bold text
                return `**${Array.from(node.childNodes).map(processNode).join('')}**`;
                
            case 'em':
            case 'i':
                // Handle italic text
                return `*${Array.from(node.childNodes).map(processNode).join('')}*`;
                
            case 'a':
                // Handle links
                return `[${node.textContent}](${node.href})`;
                
            case 'blockquote':
                // Handle blockquotes
                return '\n> ' + Array.from(node.childNodes).map(processNode).join('').split('\n').join('\n> ') + '\n';
                
            default:
                // For other elements, process their children
                return Array.from(node.childNodes).map(processNode).join('');
        }
    }
    
    messages.forEach(message => {
        const isUserMessage = message.hasAttribute('data-testid') && message.getAttribute('data-testid') === 'user-message';
        
        // Add speaker prefix
        markdown += isUserMessage ? '**Human**: ' : '**Claude**: ';
        
        // Process the message content
        let messageContent = Array.from(message.childNodes).map(processNode).join('');
        
        // Clean up extra newlines and spaces
        messageContent = messageContent
            .replace(/\n{3,}/g, '\n\n')  // Replace multiple newlines with double newlines
            .trim();
        
        // Add message content and spacing
        markdown += messageContent + '\n\n';
    });
    
    // Create and trigger download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'claude-chat.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}