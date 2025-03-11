// Toast notification function
function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    if (\!toast) return;
    
    toast.textContent = message;
    
    if (isError) {
        toast.classList.add("error");
    } else {
        toast.classList.remove("error");
    }
    
    toast.classList.add("show");
    
    // After 3 seconds, remove the show class
    setTimeout(function() { 
        toast.classList.remove("show");
    }, 3000);
}

// Selected instances array for multi-selection
let selectedInstances = [];

// View mode (table or card)
let viewMode = 'table'; // Default view mode

// Document ready event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize any components that need it
    console.log('Claude Task Manager dashboard initialized');
    
    // Initialize card expansion listeners
    initializeCardListeners();
    
    // Initialize card selection
    initializeCardSelection();
});

// Manual refresh function
function manualRefresh() {
    // Show loading indicator
    const refreshBtn = document.querySelector('.header-actions .btn-blue');
    if (refreshBtn) {
        const originalHtml = refreshBtn.innerHTML;
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<svg class="animate-spin" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Refreshing...';
        
        // Reload the page
        window.location.reload();
    } else {
        window.location.reload();
    }
}
