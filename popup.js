document.addEventListener('DOMContentLoaded', () => {
    const activeCheckbox = document.getElementById('active-checkbox');
    const askCheckbox = document.getElementById('ask-checkbox');

    // Load saved settings and set the checkbox states
    chrome.storage.local.get(['isActive', 'askForEachCommand'], (result) => {
        // Default to true if not set
        activeCheckbox.checked = typeof result.isActive === 'undefined' ? true : result.isActive;
        askCheckbox.checked = typeof result.askForEachCommand === 'undefined' ? true : result.askForEachCommand;
    });

    // Save settings when they are changed
    activeCheckbox.addEventListener('change', () => {
        chrome.storage.local.set({ isActive: activeCheckbox.checked });
    });

    askCheckbox.addEventListener('change', () => {
        if (!askCheckbox.checked) {
            const confirmed = confirm(
                "SECURITY WARNING:\n\n" +
                "You are about to allow websites to execute commands on your computer automatically, without your confirmation.\n\n" +
                "This is a potential security risk. Only disable this if you fully understand the risks.\n\n" +
                "Do you want to proceed?"
            );
            if (!confirmed) {
                askCheckbox.checked = true; // Revert if user cancels
                return;
            }
        }
        chrome.storage.local.set({ askForEachCommand: askCheckbox.checked });
    });
});
