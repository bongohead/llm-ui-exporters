function exportPrompts() {
    // Helper function to clean HTML and preserve correct line breaks
    function cleanHTML(html) {
        // Replace <p><br></p> and similar constructs with newlines
        let text = html.replace(/<p><br\s*\/?><\/p>/gi, '\n');
        // Replace remaining <p> tags with their content + newline
        text = text.replace(/<p>(.*?)<\/p>/gi, '$1\n');
        // Replace <br> tags with newlines
        text = text.replace(/<br\s*\/?>/gi, '\n');
        // Remove any remaining HTML tags
        text = text.replace(/<[^>]*>/g, '');
        // Decode HTML entities
        text = text.replace(/&nbsp;/g, ' ')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"');
        // Remove extra whitespace while preserving intentional line breaks
        text = text.replace(/\n\s*\n/g, '\n\n').trim();
        return text;
    }

    // Get system prompt
    const systemPromptEditor = document.querySelector('[data-testid="editor"] .ProseMirror');
    const systemPrompt = systemPromptEditor ? cleanHTML(systemPromptEditor.innerHTML) : '';

    // Get all user and assistant messages
    const messages = [];
    const userMessages = document.querySelectorAll('[data-testid^="user-message-"] .ProseMirror');
    const assistantMessages = document.querySelectorAll('[data-testid^="assistant-message-"] .ProseMirror');
    
    // Combine messages in order
    const maxMessages = Math.max(userMessages.length, assistantMessages.length);
    for (let i = 0; i < maxMessages; i++) {
        if (userMessages[i]) {
            messages.push({
                type: 'user',
                content: cleanHTML(userMessages[i].innerHTML)
            });
        }
        if (assistantMessages[i]) {
            messages.push({
                type: 'assistant',
                content: cleanHTML(assistantMessages[i].innerHTML)
            });
        }
    }

    // Get test response from the right panel
    const testResponseContainer = document.querySelector('.overflow-x-visible.overflow-y-auto.mr-1.flex-1.px-3.py-1 .whitespace-pre-wrap');
    const testResponseText = testResponseContainer ? testResponseContainer.textContent : '';

    // Build markdown content
    let markdownContent = '';
    
    // Add system prompt if exists
    if (systemPrompt) {
        markdownContent += '-- system prompt\n' + systemPrompt + '\n';
    }

    // Add messages
    messages.forEach(message => {
        markdownContent += `-- ${message.type} message\n` + message.content + '\n';
    });

    // Add test response if exists
    if (testResponseText) {
        markdownContent += '-- assistant test response\n' + testResponseText + '\n';
    }

    // Create blob and download link
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'prompt_export.md';

    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    // Log content to console for debugging
    console.log('Exported content:', markdownContent);
}

// Run the function
exportPrompts();