// dialog/dialog.js (FINAL VERSION)

(async function() {
    // This immediately-invoked function expression (IIFE) prevents polluting the global scope.
    // We receive three arguments from the service worker, which we defined in service-worker.js
    const commandText = arguments[0];
    const dialogUrl = arguments[1]; // The correct, full URL for dialog.html
    const cssUrl = arguments[2];    // The correct, full URL for dialog.css

    // Clean up any old dialogs first to prevent duplicates
    const oldDialog = document.getElementById('my-command-dialog-container');
    if (oldDialog) {
        oldDialog.remove();
    }

    // Fetch the dialog HTML using the URL we received as an argument
    const response = await fetch(dialogUrl);
    const dialogHtml = await response.text();

    // Create a container and inject the HTML into the page's body
    const container = document.createElement('div');
    container.id = 'my-command-dialog-container';
    container.innerHTML = dialogHtml;
    document.body.appendChild(container);

    // Inject the CSS into the page's head
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = cssUrl;
    document.head.appendChild(link);

    // Now that the dialog is in the DOM, we can populate the command text
    document.getElementById('command-text-block').textContent = commandText;

    // Get references to our buttons and container
    const executeBtn = document.getElementById('execute-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const dialogContainer = document.getElementById('my-command-dialog-container');

    // Add event listener for the "Execute" button
    executeBtn.addEventListener('click', () => {
        // Send a message back to the service worker to confirm execution
        chrome.runtime.sendMessage({ type: 'EXECUTE_CONFIRMED', command: commandText });
        // Remove the dialog from the page
        dialogContainer.remove();
    });

    // Add event listener for the "Cancel" button
    cancelBtn.addEventListener('click', () => {
        // Send a message that we canceled (optional, but good practice)
        chrome.runtime.sendMessage({ type: 'EXECUTE_CANCELED' });
        // Remove the dialog from the page
        dialogContainer.remove();
    });
})();
