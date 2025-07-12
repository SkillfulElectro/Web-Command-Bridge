// service-worker.js (FINAL, DATA URL-FIXED, WORKING VERSION)

console.log("Web Command Bridge Service Worker Started.");

// This is a Data URL for a 1x1 transparent pixel. It's a "trick" to satisfy
// the mandatory iconUrl requirement without needing to fetch a real image.
const INVISIBLE_ICON_URL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

async function showConfirmationDialog(commandText, dialogUrl, cssUrl) {
    try {
        const oldDialog = document.getElementById('my-command-dialog-container');
        if (oldDialog) { oldDialog.remove(); }
        const response = await fetch(dialogUrl);
        if (!response.ok) { return; }
        const dialogHtml = await response.text();
        const container = document.createElement('div');
        container.id = 'my-command-dialog-container';
        container.innerHTML = dialogHtml;
        document.body.appendChild(container);
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = cssUrl;
        document.head.appendChild(link);
        document.getElementById('command-text-block').textContent = commandText;
        const executeBtn = document.getElementById('execute-btn');
        const cancelBtn = document.getElementById('cancel-btn');
        executeBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'EXECUTE_CONFIRMED', command: commandText });
            container.remove();
        });
        cancelBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'EXECUTE_CANCELED' });
            container.remove();
        });
    } catch (error) {}
}

function executeCommand(commandText, tabId) {
    const hostName = "com.my_app.native_host";

    chrome.runtime.sendNativeMessage(hostName, { command_text: commandText }, (response) => {
        // *** THE CRITICAL FIX IS HERE ***
        // We are now providing the mandatory iconUrl with our invisible pixel.
        if (chrome.runtime.lastError) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: INVISIBLE_ICON_URL,
                title: 'Execution Error',
                message: `Failed to connect to native host: ${chrome.runtime.lastError.message}`
            });
        } else {
            const resultMessage = `Status: ${response.status}\nOutput: ${response.stdout}\nErrors: ${response.stderr}`;
            chrome.notifications.create({
                type: 'basic',
                iconUrl: INVISIBLE_ICON_URL,
                title: 'Command Execution Result',
                message: resultMessage
            });
        }
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'COMMAND_FOUND') {
        const { command } = message;
        const tabId = sender.tab.id;
        chrome.storage.local.get('askForEachCommand', (result) => {
            const ask = typeof result.askForEachCommand === 'undefined' ? true : result.askForEachCommand;
            if (ask) {
                const dialogHtmlUrl = chrome.runtime.getURL('dialog/dialog.html');
                const dialogCssUrl = chrome.runtime.getURL('dialog/dialog.css');
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: showConfirmationDialog,
                    args: [command, dialogHtmlUrl, dialogCssUrl]
                });
            } else {
                executeCommand(command, tabId);
            }
        });
    } else if (message.type === 'EXECUTE_CONFIRMED') {
        executeCommand(message.command, sender.tab.id);
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const isRunnableUrl = tab.url && (tab.url.startsWith('http') || tab.url.startsWith('file'));
    if (changeInfo.status === 'complete' && isRunnableUrl) {
        chrome.storage.local.get('isActive', (result) => {
            const active = typeof result.isActive === 'undefined' ? true : result.isActive;
            if (active) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['scanner.js']
                }).catch(err => {});
            }
        });
    }
});
