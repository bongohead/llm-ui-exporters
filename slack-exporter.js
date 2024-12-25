/* Make sure you scroll up to load whatever messages you want to export */
/* Doesn't export threads */

(async function exportSlackDMToFile() {
    // Step 1: Ensure all messages are loaded by scrolling to the top
    async function loadAllMessages() {
        const scroller = document.querySelector('.c-scrollbar__hider'); // Slack's scroll container
        if (!scroller) {
            console.error("Unable to find Slack's scroll container.");
            return false;
        }

        let previousScrollTop = -1;
        while (scroller.scrollTop !== 0 && scroller.scrollTop !== previousScrollTop) {
            previousScrollTop = scroller.scrollTop;
            scroller.scrollTop = 0;
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for new messages to load
        }
        return true;
    }

    console.log("Loading all messages...");
    const allMessagesLoaded = await loadAllMessages();
    if (!allMessagesLoaded) {
        console.error("Failed to load all messages.");
        return;
    }

    console.log("All messages loaded.");

    // Step 2: Extract message details
    const messageBlocks = document.querySelectorAll('.c-message_kit__background'); // General container for messages
    if (!messageBlocks.length) {
        console.error("Unable to find message blocks. Please ensure you're on a Slack DM history page.");
        return;
    }

    let lastUser = "Unknown User"; // Tracks the last user's name
    const messages = Array.from(messageBlocks)
        .slice(-100) // Select only the last 100 messages
        .map(block => {
            const userElement = block.querySelector('[data-qa="message_sender_name"]');
            const textElement = block.querySelector('[data-qa="message-text"]');

            // Update the user if a new one is found; otherwise, use the last user
            const user = userElement ? userElement.textContent.trim() : lastUser;
            if (userElement) {
                lastUser = user; // Update the last user
            }

            // Retrieve text content and preserve formatting
            let text = textElement ? textElement.innerHTML : "No content";
            text = text
                .replace(/<br\s*\/?>/g, '\n') // Replace <br> tags with line breaks
                .replace(/<[^>]*>/g, '') // Strip remaining HTML tags
                .replace(/\s*\n\s*/g, '\n') // Clean up extra spaces around newlines
                .trim();

            // Convert emoji tags to their alt text (Slack emoji)
            text = text.replace(/<img[^>]*alt="([^"]*)"[^>]*>/g, ':$1:');

            // Locate timestamp
            let timeElement = block.querySelector('[data-qa="message_time"]');
            if (!timeElement) {
                timeElement = block.querySelector('.c-timestamp__label') ||
                              block.querySelector('[data-ts]');
            }

            let timeText = "Unknown Time";
            if (timeElement) {
                const dataTs = timeElement.getAttribute('data-ts');
                if (dataTs) {
                    // Convert epoch time to human-readable date
                    timeText = new Date(Number(dataTs) * 1000).toLocaleString();
                } else {
                    timeText = timeElement.textContent.trim();
                }
            }

            return {
                user,
                text,
                time: timeText,
            };
        });

    // Step 3: Format messages into Markdown
    const markdownContent = messages
        .map(msg => `**${msg.user}** (${msg.time}):\n> ${msg.text.replace(/\n/g, '\n> ')}`)
        .join("\n\n");

    // Step 4: Export to a Markdown file
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Slack_DM_History.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Markdown file has been exported successfully!");
})();