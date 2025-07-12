// scanner.js — upgraded with MutationObserver support

function runScan(textSource = document.body.innerText) {
    const commandRegex = /start_execute_on_os_command[\s\S]*?end_execute_on_os_command/g;
    const matches = textSource.match(commandRegex);

    if (matches && matches.length > 0) {
        // Only process the first found command for now
        const firstCommand = matches[0];
        console.log('✅ Command found on page:', firstCommand);
        chrome.runtime.sendMessage({ type: 'COMMAND_FOUND', command: firstCommand });

        // OPTIONAL: stop observing once found if you want single-trigger behavior
        if (observer) observer.disconnect();
    }
}

// Run once when page is fully loaded
if (document.readyState === "complete") {
    runScan();
} else {
    window.addEventListener('load', () => runScan());
}

// Dynamically watch for new content on the page
let observer = new MutationObserver((mutationsList) => {
    let newText = "";

    for (let mutation of mutationsList) {
        if (mutation.type === "childList") {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                    newText += node.textContent + "\n";
                }
            });
        }
    }

    if (newText.trim()) {
        runScan(newText);
    }
});

// Start observing changes in content!
observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
});
