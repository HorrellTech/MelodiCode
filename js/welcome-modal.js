// Utility to show/hide modals
function showModal(id) {
    // Only hide currently open modals, not all .modal elements
    document.querySelectorAll('.modal').forEach(m => {
        if (m.id !== id) m.style.display = 'none';
    });
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'block';
}
function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

// Load documentation (from code-interpreter.js or static string)
async function loadWelcomeDocs() {
    const docs = await fetch('documentation.md')
        .then(r => r.text())
        .catch(() => 'Documentation not found.');
    document.getElementById('welcomeDocsContent').innerHTML =
        marked.parse(docs);
}

// Show welcome modal on startup if enabled
window.addEventListener('DOMContentLoaded', async () => {
    const showWelcome = localStorage.getItem('showWelcomeOnStartup');
    if (showWelcome === null || showWelcome === 'true') {
        await loadWelcomeDocs();
        showModal('welcomeModal');
        document.getElementById('showWelcomeOnStartup').checked = true;
    }
});

// Handle checkbox state
document.addEventListener('change', e => {
    if (e.target.id === 'showWelcomeOnStartup') {
        localStorage.setItem('showWelcomeOnStartup', e.target.checked);
    }
});

// Close button
document.getElementById('closeWelcome').onclick = () => hideModal('welcomeModal');

// Button in Docs modal to open Welcome
document.getElementById('openWelcomeFromDocs').onclick = async () => {
    hideModal('docsModal');
    await loadWelcomeDocs();
    showModal('welcomeModal');
};

// Button in Welcome modal to open Docs
document.getElementById('openDocsFromWelcome').onclick = () => {
    hideModal('welcomeModal');
    showModal('docsModal');
};

// Optional: When opening Welcome, reload docs (in case of updates)
document.getElementById('welcomeModal').addEventListener('show', loadWelcomeDocs);