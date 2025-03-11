// Global variables
let refreshInterval = null;
let refreshIntervalTime = 10; // Default refresh interval in seconds
let selectedInstances = [];
let sortDirection = {};
let viewMode = 'table'; // Default view mode: 'table' or 'card'

// Toast notification function
function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    
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

// Document ready event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    console.log('Claude Task Manager dashboard initialized');
    
    // Initialize instance selection
    initializeInstanceSelection();
    
    // Initialize card view functionality
    initializeCardView();
    
    // Initialize sorting
    initializeTableSorting();
    
    // Initialize filtering
    initializeFiltering();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load view mode preference
    loadViewMode();
});

// Initialize instance selection
function initializeInstanceSelection() {
    // Get all instance rows
    const instanceRows = document.querySelectorAll('#instance-list tr');
    
    // Add click event listeners to rows
    instanceRows.forEach(row => {
        row.addEventListener('click', function(e) {
            // Check if Ctrl/Cmd key is pressed for multi-select
            if (e.ctrlKey || e.metaKey) {
                // Toggle selection
                if (this.classList.contains('selected')) {
                    // Remove from selection
                    this.classList.remove('selected');
                    const instanceId = this.getAttribute('data-id');
                    selectedInstances = selectedInstances.filter(id => id !== instanceId);
                } else {
                    // Add to selection
                    this.classList.add('selected');
                    const instanceId = this.getAttribute('data-id');
                    selectedInstances.push(instanceId);
                }
            } else {
                // Clear previous selection
                instanceRows.forEach(r => r.classList.remove('selected'));
                selectedInstances = [];
                
                // Select this row
                this.classList.add('selected');
                const instanceId = this.getAttribute('data-id');
                selectedInstances.push(instanceId);
            }
            
            // Update UI based on selection
            updateActionButtons();
        });
    });
    
    // Handle clicking outside to clear selection
    document.addEventListener('click', function(e) {
        if (e.target.closest('#instance-table') === null && 
            e.target.closest('.action-buttons') === null) {
            // Clear selection
            instanceRows.forEach(r => r.classList.remove('selected'));
            selectedInstances = [];
            updateActionButtons();
        }
    });
}

// Initialize table sorting
function initializeTableSorting() {
    // Get all sortable column headers
    const sortableHeaders = document.querySelectorAll('.sortable');
    
    // Add click event listeners to headers
    sortableHeaders.forEach(header => {
        const sortKey = header.getAttribute('data-sort');
        sortDirection[sortKey] = 'asc';
        
        header.addEventListener('click', function() {
            // Toggle sort direction
            sortDirection[sortKey] = sortDirection[sortKey] === 'asc' ? 'desc' : 'asc';
            
            // Sort the table
            sortTable(sortKey, sortDirection[sortKey]);
            
            // Update UI to show sort direction
            updateSortIndicators(sortKey, sortDirection[sortKey]);
        });
    });
}

// Sort table by column
function sortTable(sortKey, direction) {
    try {
        const table = document.getElementById('instance-table');
        const tbody = document.getElementById('instance-list');
        if (!table || !tbody) {
            console.error('Table or tbody not found');
            return;
        }
        
        const rows = Array.from(tbody.querySelectorAll('tr'));
        if (rows.length === 0) {
            console.log('No rows to sort');
            return;
        }
        
        // Get the column index for the selected sort key
        const headers = Array.from(table.querySelectorAll('th'));
        const columnIndex = headers.findIndex(h => h.getAttribute('data-sort') === sortKey);
        
        if (columnIndex === -1) {
            console.error(`Column with sort key ${sortKey} not found`);
            return;
        }
        
        // Sort rows based on the column values
        rows.sort((a, b) => {
            // Ensure cells exist before trying to access them
            if (!a.cells[columnIndex] || !b.cells[columnIndex]) {
                console.warn('Missing cells for row during sort');
                return 0;
            }
            
            let valueA = a.cells[columnIndex].textContent.trim();
            let valueB = b.cells[columnIndex].textContent.trim();
            
            // Handle special cases for different column types
            if (sortKey === 'status') {
                // Status: ready > running > stopped > error
                const statusOrder = { 'ready': 0, 'running': 1, 'stopped': 2, 'error': 3 };
                valueA = statusOrder[valueA.toLowerCase()] || 0;
                valueB = statusOrder[valueB.toLowerCase()] || 0;
            } else if (sortKey === 'active_time') {
                // Time: convert to seconds
                valueA = convertTimeToSeconds(valueA);
                valueB = convertTimeToSeconds(valueB);
            } else if (sortKey === 'yes_count') {
                // Count: convert to number
                valueA = parseInt(valueA) || 0;
                valueB = parseInt(valueB) || 0;
            }
            
            // Compare values based on type
            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return direction === 'asc' ? valueA - valueB : valueB - valueA;
            } else {
                // String comparison
                return direction === 'asc' ? 
                    valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
            }
        });
        
        // Reorder rows in the table
        rows.forEach(row => tbody.appendChild(row));
        
        console.log(`Successfully sorted by ${sortKey} in ${direction} order`);
    } catch (error) {
        console.error(`Error during sorting: ${error.message}`);
    }
}

// Update sort indicators in table headers
function updateSortIndicators(sortKey, direction) {
    const headers = document.querySelectorAll('.sortable');
    
    headers.forEach(header => {
        const key = header.getAttribute('data-sort');
        const indicator = direction === 'asc' ? '↑' : '↓';
        
        // Update header text with direction indicator
        if (key === sortKey) {
            // Remove existing arrow and append new one
            header.textContent = header.textContent.replace(/[↑↓]/, '').trim() + ' ' + indicator;
        } else {
            // Reset other headers to default (↕)
            header.textContent = header.textContent.replace(/[↑↓]/, '↕').trim();
        }
    });
}

// Convert time string to seconds
function convertTimeToSeconds(timeStr) {
    if (!timeStr || timeStr === '0s') return 0;
    
    // Extract minutes and seconds
    const match = timeStr.match(/(\d+)m\s*(\d+)s|(\d+)s/);
    if (!match) return 0;
    
    if (match[3]) {
        // Only seconds format: "10s"
        return parseInt(match[3]);
    } else {
        // Minutes and seconds format: "2m 30s"
        return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
}

// Initialize filtering
function initializeFiltering() {
    // Set up event listeners for filter inputs
    const searchBox = document.getElementById('instance-search');
    const statusFilter = document.getElementById('status-filter');
    const runtimeFilter = document.getElementById('runtime-filter');
    
    // Attach filter event handlers
    if (searchBox) searchBox.addEventListener('input', filterInstances);
    if (statusFilter) statusFilter.addEventListener('change', filterInstances);
    if (runtimeFilter) runtimeFilter.addEventListener('change', filterInstances);
}

// Filter instances based on search and filter criteria
function filterInstances() {
    const searchBox = document.getElementById('instance-search');
    const statusFilter = document.getElementById('status-filter');
    const runtimeFilter = document.getElementById('runtime-filter');
    
    const searchTerm = searchBox ? searchBox.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : 'all';
    const runtimeValue = runtimeFilter ? runtimeFilter.value : 'all';
    
    // Filter based on current view mode
    if (viewMode === 'table') {
        // Get all instance rows
        const instanceRows = document.querySelectorAll('#instance-list tr');
        
        // Filter rows based on criteria
        instanceRows.forEach(row => {
            let matchesSearch = true;
            let matchesStatus = true;
            let matchesRuntime = true;
            
            // Check search term
            if (searchTerm) {
                try {
                    // Get the right cell indices based on the hidden ID column
                    const projectDir = row.cells[4] ? row.cells[4].textContent.toLowerCase() : '';
                    const promptPath = row.cells[5] ? row.cells[5].textContent.toLowerCase() : '';
                    const response = row.cells[6] ? row.cells[6].textContent.toLowerCase() : '';
                    
                    matchesSearch = projectDir.includes(searchTerm) || 
                                   promptPath.includes(searchTerm) || 
                                   response.includes(searchTerm);
                } catch (error) {
                    console.error('Error during search filtering:', error);
                    matchesSearch = true; // Default to showing the row on error
                }
            }
            
            // Check status filter
            if (statusValue !== 'all') {
                const statusElement = row.querySelector('.status-badge');
                const status = statusElement ? statusElement.textContent.trim().toLowerCase() : '';
                matchesStatus = status === statusValue;
            }
            
            // Check runtime filter
            if (runtimeValue !== 'all') {
                const runtime = row.getAttribute('data-runtime') || '';
                matchesRuntime = runtime.toLowerCase() === runtimeValue.toLowerCase();
            }
            
            // Show or hide row based on filter results
            if (matchesSearch && matchesStatus && matchesRuntime) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    } else if (viewMode === 'card') {
        // Get all instance cards
        const cards = document.querySelectorAll('.instance-card');
        
        // Filter cards based on criteria
        cards.forEach(card => {
            let matchesSearch = true;
            let matchesStatus = true;
            let matchesRuntime = true;
            
            // Check search term
            if (searchTerm) {
                try {
                    // Get content from card elements
                    const projectEl = card.querySelector('.card-project');
                    const promptEl = card.querySelector('.card-prompt');
                    const responseEl = card.querySelector('.card-response');
                    
                    const projectDir = projectEl ? projectEl.textContent.toLowerCase() : '';
                    const promptPath = promptEl ? promptEl.textContent.toLowerCase() : '';
                    const response = responseEl ? responseEl.textContent.toLowerCase() : '';
                    
                    matchesSearch = projectDir.includes(searchTerm) || 
                                  promptPath.includes(searchTerm) || 
                                  response.includes(searchTerm);
                } catch (error) {
                    console.error('Error during card search filtering:', error);
                    matchesSearch = true; // Default to showing the card on error
                }
            }
            
            // Check status filter
            if (statusValue !== 'all') {
                const statusElement = card.querySelector('.status-badge');
                const status = statusElement ? statusElement.textContent.trim().toLowerCase() : '';
                matchesStatus = status === statusValue;
            }
            
            // Check runtime filter
            if (runtimeValue !== 'all') {
                const runtime = card.getAttribute('data-runtime') || '';
                matchesRuntime = runtime.toLowerCase() === runtimeValue.toLowerCase();
            }
            
            // Show or hide card based on filter results
            if (matchesSearch && matchesStatus && matchesRuntime) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// Start auto-refresh
function startAutoRefresh() {
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Set up new interval
    refreshInterval = setInterval(function() {
        // Always refresh to ensure UI is up to date with backend
        // We'll check in refreshInstanceData if we should skip based on interaction
        refreshInstanceData();
    }, refreshIntervalTime * 1000);
    
    // Initial refresh to get data right away
    setTimeout(refreshInstanceData, 500);
}

// Refresh instance data
function refreshInstanceData() {
    // We don't want to refresh if user is interacting with the UI
    if (document.activeElement) {
        const activeId = document.activeElement.id;
        const skipRefreshElements = ['quick-prompt-path', 'quick-project-dir', 'prompt-text'];
        
        if (skipRefreshElements.includes(activeId)) {
            console.log(`Skipping refresh - user is typing in ${activeId}`);
            return;
        }
        
        // Also skip if a modal is open
        const modals = document.querySelectorAll('.modal');
        for (const modal of modals) {
            if (modal.style.display === 'block') {
                console.log('Skipping refresh - modal is open');
                return;
            }
        }
    }
    
    // Track start time for performance monitoring
    const startTime = performance.now();
    
    // Fetch updated instance data with timeout
    const timeout = 15000; // 15 seconds
    
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), timeout);
    });
    
    // Create the fetch promise
    const fetchPromise = fetch('/api/instances');
    
    // Race the fetch against the timeout
    Promise.race([fetchPromise, timeoutPromise])
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Log performance
            const endTime = performance.now();
            console.log(`Refreshed data: ${data.length} instances (took ${(endTime - startTime).toFixed(0)}ms)`);
            
            // Update the UI with new data
            updateInstanceTable(data);
        })
        .catch(error => {
            console.error('Error refreshing instance data:', error);
            
            // Only show toast if it's not a routine refresh
            if (error.message !== 'Request timed out') {
                showToast('Error refreshing data. Will try again later.', true);
            }
            
            // Don't redirect on auto-refresh errors to avoid disrupting the user
            // Only redirect if manually triggered
            if (error.message === 'Request timed out') {
                console.log('Refresh timed out, will try again on next cycle');
            }
        });
}

// Update instance table with new data
function updateInstanceTable(instances) {
    try {
        // Update table view
        const tbody = document.getElementById('instance-list');
        if (!tbody) {
            console.error('Could not find instance-list tbody');
            return;
        }
        
        // Save the current sort state
        const sortHeaderEl = document.querySelector('.sortable[data-sort]');
        if (!sortHeaderEl) {
            console.error('Could not find sortable header');
            return;
        }
        
        const sortedColumn = sortHeaderEl.getAttribute('data-sort');
        const direction = sortDirection[sortedColumn] || 'asc';
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        // Add new rows to table
        instances.forEach(instance => {
            try {
                const row = document.createElement('tr');
                row.setAttribute('data-id', instance.id);
                row.setAttribute('data-runtime', instance.runtime_type_display || 'unknown');
                
                // Create cells for each column
                const idCell = document.createElement('td');
                idCell.style.display = 'none';
                idCell.textContent = instance.id;
                
                const statusCell = document.createElement('td');
                statusCell.style.width = '120px';
                statusCell.innerHTML = `
                    <span class="status-badge ${instance.status}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                            <circle cx="12" cy="12" r="12" />
                        </svg>
                        ${instance.status}
                    </span>
                `;
                
                const timeCell = document.createElement('td');
                timeCell.style.width = '90px';
                if (instance.detailed_status === 'running' && instance.generation_time) {
                    timeCell.innerHTML = `<span style="color: #EAB308; font-size: 1.1rem; font-weight: 600;">${instance.generation_time}</span>`;
                } else {
                    timeCell.innerHTML = `<span style="color: var(--text-primary); font-size: 1.1rem;">0s</span>`;
                }
                
                const countCell = document.createElement('td');
                countCell.style.width = '80px';
                countCell.innerHTML = `<span style="font-size: 1.1rem; font-weight: 500;">${instance.yes_count || 0}</span>`;
                
                const projectCell = document.createElement('td');
                projectCell.style.width = '25%';
                projectCell.textContent = instance.project_dir || '';
                
                const promptCell = document.createElement('td');
                promptCell.style.width = '25%';
                promptCell.textContent = instance.prompt_path || '';
                
                const responseCell = document.createElement('td');
                responseCell.style.width = '30%';
                responseCell.innerHTML = `<span style="font-style: italic; color: var(--text-secondary);">${instance.response || 'No response available'}</span>`;
                
                // Add cells to row
                row.appendChild(idCell);
                row.appendChild(statusCell);
                row.appendChild(timeCell);
                row.appendChild(countCell);
                row.appendChild(projectCell);
                row.appendChild(promptCell);
                row.appendChild(responseCell);
                
                // Add row to table
                tbody.appendChild(row);
            } catch (error) {
                console.error(`Error adding instance ${instance.id} to table:`, error);
            }
        });
        
        // Update card view
        const cardContainer = document.getElementById('instance-cards');
        if (cardContainer) {
            // Clear existing cards
            cardContainer.innerHTML = '';
            
            // Add new cards
            instances.forEach(instance => {
                try {
                    const card = document.createElement('div');
                    card.className = 'instance-card';
                    card.setAttribute('data-id', instance.id);
                    card.setAttribute('data-runtime', instance.runtime_type_display || 'unknown');
                    
                    card.innerHTML = `
                        <input type="checkbox" class="card-select" aria-label="Select instance">
                        
                        <div class="card-header">
                            <span class="status-badge ${instance.status}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                                    <circle cx="12" cy="12" r="12" />
                                </svg>
                                ${instance.status}
                            </span>
                            ${instance.detailed_status === 'running' && instance.generation_time 
                                ? `<span style="color: var(--status-running-text); font-size: 1.1rem; font-weight: 600;">${instance.generation_time}</span>`
                                : `<span style="color: var(--text-primary); font-size: 1.1rem;">0s</span>`}
                        </div>
                        
                        <div class="card-info">
                            <div class="card-info-section">
                                <span class="card-info-label">Project</span>
                                <span class="card-info-value card-project">${instance.project_dir || ''}</span>
                            </div>
                            <div class="card-info-section">
                                <span class="card-info-label">Prompt</span>
                                <span class="card-info-value card-prompt">${instance.prompt_path || ''}</span>
                            </div>
                            <div class="card-info-section">
                                <span class="card-info-label">Type</span>
                                <span class="card-info-value">${instance.runtime_type_display || ''}</span>
                            </div>
                            <div class="card-info-section">
                                <span class="card-info-label">Count</span>
                                <span class="card-info-value">${instance.yes_count || 0}</span>
                            </div>
                        </div>
                        
                        <button class="card-expand" aria-label="Expand card" title="Show details">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        
                        <div class="card-details">
                            <div class="card-response">
                                ${instance.response || 'No response available'}
                            </div>
                            <div class="card-actions">
                                <button class="btn btn-blue card-action" onclick="viewInstance('${instance.id}')">View</button>
                                <button class="btn btn-purple card-action" onclick="sendPromptToInstance('${instance.id}')">Send Prompt</button>
                                <button class="btn btn-warning card-action" onclick="stopInstance('${instance.id}')">Stop</button>
                                <button class="btn btn-danger card-action" onclick="deleteInstance('${instance.id}')">Delete</button>
                            </div>
                        </div>
                    `;
                    
                    // Add card to container
                    cardContainer.appendChild(card);
                } catch (error) {
                    console.error(`Error adding instance ${instance.id} to card view:`, error);
                }
            });
        }
        
        // Restore selection
        restoreInstanceSelection();
        
        // Re-apply filtering
        filterInstances();
        
        // Re-apply sorting
        sortTable(sortedColumn, direction);
        
        // Re-initialize event listeners
        initializeInstanceSelection();
        initializeCardView();
        
        console.log(`Successfully updated with ${instances.length} instances`);
    } catch (error) {
        console.error('Error updating instances:', error);
        // In case of critical error, try reload as fallback
        showToast('Error updating data, please refresh manually', true);
    }
}

// Restore instance selection after refresh
function restoreInstanceSelection() {
    if (selectedInstances.length === 0) return;
    
    // Restore selection in table view
    const rows = document.querySelectorAll('#instance-list tr');
    rows.forEach(row => {
        const instanceId = row.getAttribute('data-id');
        if (selectedInstances.includes(instanceId)) {
            row.classList.add('selected');
            console.log(`Restored selection for row ${instanceId}`);
        }
    });
    
    // Restore selection in card view
    const cards = document.querySelectorAll('.instance-card');
    cards.forEach(card => {
        const instanceId = card.getAttribute('data-id');
        if (selectedInstances.includes(instanceId)) {
            card.classList.add('selected');
            const checkbox = card.querySelector('.card-select');
            if (checkbox) {
                checkbox.checked = true;
            }
            console.log(`Restored selection for card ${instanceId}`);
        }
    });
    
    // Check if any previously selected instances no longer exist
    const currentIds = new Set();
    rows.forEach(row => {
        currentIds.add(row.getAttribute('data-id'));
    });
    
    // Filter out selected instances that no longer exist
    selectedInstances = selectedInstances.filter(id => currentIds.has(id));
    
    // Update action buttons based on new selection state
    updateActionButtons();
}

// Update action buttons based on selection
function updateActionButtons() {
    // Show/hide action buttons based on selection
    const actionButtons = document.querySelector('.action-buttons');
    if (!actionButtons) return;
    
    if (selectedInstances.length > 0) {
        actionButtons.style.display = 'flex';
    } else {
        actionButtons.style.display = 'none';
    }
    
    // Update button text to show count
    const instanceCountSpan = document.querySelector('.selected-count');
    if (instanceCountSpan) {
        instanceCountSpan.textContent = selectedInstances.length;
    }
}

// Create new instance
function createInstance() {
    let projectDir = document.getElementById('quick-project-dir').value;
    const promptPath = document.getElementById('quick-prompt-path').value;
    const useTmux = document.getElementById('quick-use-tmux').checked;
    const openWindow = document.getElementById('quick-open-window').checked;
    
    if (!projectDir || !promptPath) {
        showToast('Please provide both project directory and prompt path/text', true);
        return;
    }
    
    // Disable the submit button
    const submitButton = document.querySelector('#quick-add-form button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<svg class="animate-spin" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating...';
    
    // Check if the input is just an ID (only contains digits)
    if (/^\d+$/.test(projectDir.trim())) {
        // It's an ID, so let's look up the project directory
        fetch(`/api/project_dir/${projectDir}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Project directory not found for this ID');
                }
                return response.json();
            })
            .then(data => {
                if (data.project_dir) {
                    // Found the directory, now continue with creating the instance
                    projectDir = data.project_dir;
                    showToast(`Found project directory: ${projectDir}`);
                    createInstanceWithDirectory(projectDir, promptPath, useTmux, openWindow, submitButton, originalButtonText);
                } else {
                    throw new Error('Project directory not found for this ID');
                }
            })
            .catch(error => {
                showToast(`Error: ${error.message}`, true);
                // Re-enable the submit button
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            });
    } else {
        // It's already a directory path, continue with creating the instance
        createInstanceWithDirectory(projectDir, promptPath, useTmux, openWindow, submitButton, originalButtonText);
    }
}

// Helper function to create an instance with a full directory path
function createInstanceWithDirectory(projectDir, promptPath, useTmux, openWindow, submitButton, originalButtonText) {
    // Prepare form data
    const formData = new FormData();
    formData.append('project_dir', projectDir);
    
    // Check if prompt is a file path or direct text
    if (promptPath.match(/\.(txt|md)$/i) && promptPath.includes('/')) {
        formData.append('prompt_path', promptPath);
    } else {
        formData.append('prompt_text', promptPath);
    }
    
    formData.append('runtime_type', useTmux ? 'tmux' : 'terminal');
    formData.append('open_window', openWindow ? 'on' : 'off');
    
    // Send API request
    fetch('/api/instances', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(`Instance created successfully with ID: ${data.instance_id}`);
            
            // Reset form
            document.getElementById('quick-add-form').reset();
            
            // Refresh the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showToast(`Error creating instance: ${data.error}`, true);
        }
    })
    .catch(error => {
        showToast(`Error creating instance: ${error}`, true);
    })
    .finally(() => {
        // Re-enable the submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    });
}

// Manual refresh function
function manualRefresh() {
    // Show loading indicator
    const refreshBtn = document.querySelector('.header-actions .btn-blue');
    if (refreshBtn) {
        const originalHtml = refreshBtn.innerHTML;
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<svg class="animate-spin" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Refreshing...';
        
        // Request a refresh via API
        fetch('/api/sync', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            // Reload the instance data
            refreshInstanceData();
            
            // Show success message
            if (data.updated) {
                showToast(`Refreshed successfully, updated ${data.count} instances`);
            } else {
                showToast('Refreshed successfully, no changes detected');
            }
        })
        .catch(error => {
            console.error('Error refreshing:', error);
            showToast('Error refreshing instances', true);
            
            // Reload the page as fallback
            window.location.reload();
        })
        .finally(() => {
            // Restore the refresh button
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = originalHtml;
        });
    } else {
        // Fallback to page reload
        window.location.reload();
    }
}

// Show settings modal
function showSettingsModal() {
    // Check if modal already exists
    let modal = document.getElementById('settings-modal');
    
    if (!modal) {
        // Create the modal
        modal = document.createElement('div');
        modal.id = 'settings-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Dashboard Settings</h2>
                    <button class="close-button" onclick="closeModal('settings-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="refresh-interval">Auto-refresh interval (seconds)</label>
                        <input type="number" id="refresh-interval" class="input-field" value="${refreshIntervalTime}" min="5" max="300">
                    </div>
                    <div class="form-group">
                        <label for="theme-select">Theme</label>
                        <select id="theme-select" class="input-field">
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-cancel" onclick="closeModal('settings-modal')">Cancel</button>
                    <button class="btn btn-save" onclick="saveSettings()">Save</button>
                </div>
            </div>
        `;
        
        // Add the modal to the body
        document.body.appendChild(modal);
    }
    
    // Show the modal
    modal.style.display = 'block';
}

// Close a modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Save settings
function saveSettings() {
    // Get settings values
    const refreshInterval = document.getElementById('refresh-interval').value;
    const theme = document.getElementById('theme-select').value;
    
    // Validate and save refresh interval
    const newInterval = parseInt(refreshInterval);
    if (!isNaN(newInterval) && newInterval >= 5 && newInterval <= 300) {
        refreshIntervalTime = newInterval;
        startAutoRefresh(); // Restart with new interval
    } else {
        showToast('Invalid refresh interval (must be between 5-300 seconds)', true);
        return;
    }
    
    // Apply theme
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
    
    // Save settings to localStorage
    localStorage.setItem('dashboard_settings', JSON.stringify({
        refreshInterval: refreshIntervalTime,
        theme: theme
    }));
    
    // Close the modal
    closeModal('settings-modal');
    
    // Show success message
    showToast('Settings saved successfully');
}

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('dashboard_settings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Apply refresh interval
        if (settings.refreshInterval) {
            refreshIntervalTime = parseInt(settings.refreshInterval);
        }
        
        // Apply theme
        if (settings.theme === 'light') {
            document.body.classList.add('light-theme');
        }
    }
}

// Initialize card view functionality
function initializeCardView() {
    // Add event listeners to card expansion buttons
    document.querySelectorAll('.card-expand').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.instance-card');
            const details = card.querySelector('.card-details');
            
            // Toggle expanded class on details element
            details.classList.toggle('expanded');
            
            // Toggle expanded class on button for rotation animation
            this.classList.toggle('expanded');
        });
    });
    
    // Add event listeners to card selection checkboxes
    document.querySelectorAll('.card-select').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const card = this.closest('.instance-card');
            const instanceId = card.getAttribute('data-id');
            
            if (this.checked) {
                // Add to selection
                card.classList.add('selected');
                if (!selectedInstances.includes(instanceId)) {
                    selectedInstances.push(instanceId);
                }
            } else {
                // Remove from selection
                card.classList.remove('selected');
                selectedInstances = selectedInstances.filter(id => id !== instanceId);
            }
            
            // Update action buttons based on selection
            updateActionButtons();
        });
    });
}

// Toggle between table and card view modes
function toggleViewMode() {
    const tableContainer = document.getElementById('instance-table');
    const cardContainer = document.getElementById('instance-cards');
    const toggleButton = document.getElementById('view-toggle');
    
    if (viewMode === 'table') {
        // Switch to card view
        tableContainer.style.display = 'none';
        cardContainer.style.display = 'grid';
        viewMode = 'card';
        
        // Update toggle button text
        toggleButton.querySelector('span').textContent = 'Table View';
        
        // Update icon to table icon
        toggleButton.querySelector('svg').innerHTML = `
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="3" y1="15" x2="21" y2="15"></line>
        `;
    } else {
        // Switch to table view
        tableContainer.style.display = 'table';
        cardContainer.style.display = 'none';
        viewMode = 'table';
        
        // Update toggle button text
        toggleButton.querySelector('span').textContent = 'Card View';
        
        // Update icon to grid icon
        toggleButton.querySelector('svg').innerHTML = `
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
        `;
    }
    
    // Save view mode preference
    localStorage.setItem('viewMode', viewMode);
    
    // Reapply filtering for the new view
    filterInstances();
}

// Load view mode preference from localStorage
function loadViewMode() {
    const savedViewMode = localStorage.getItem('viewMode');
    if (savedViewMode && savedViewMode !== viewMode) {
        // If saved view mode is different from default, toggle to match it
        toggleViewMode();
    }
}

// View instance details
function viewInstance(instanceId) {
    console.log(`Viewing instance ${instanceId}`);
    fetch(`/api/instances/${instanceId}/view`, {
        method: 'POST'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast(`Opened terminal for instance ${instanceId}`);
        } else {
            showToast(`Error opening terminal: ${data.error}`, true);
        }
    })
    .catch(error => {
        console.error(`Error viewing instance ${instanceId}:`, error);
        showToast(`Error viewing instance: ${error.message}`, true);
    });
}

// Stop instance
function stopInstance(instanceId) {
    if (!confirm(`Are you sure you want to stop instance ${instanceId}?`)) {
        return;
    }
    
    fetch(`/api/instances/${instanceId}/stop`, {
        method: 'POST'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast(`Stopped instance ${instanceId}`);
            setTimeout(() => refreshInstanceData(), 1000);
        } else {
            showToast(`Error stopping instance: ${data.error}`, true);
        }
    })
    .catch(error => {
        console.error(`Error stopping instance ${instanceId}:`, error);
        showToast(`Error stopping instance: ${error.message}`, true);
    });
}

// Delete instance
function deleteInstance(instanceId) {
    if (!confirm(`Are you sure you want to delete instance ${instanceId}?`)) {
        return;
    }
    
    fetch(`/api/instances/${instanceId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast(`Deleted instance ${instanceId}`);
            setTimeout(() => refreshInstanceData(), 1000);
        } else {
            showToast(`Error deleting instance: ${data.error}`, true);
        }
    })
    .catch(error => {
        console.error(`Error deleting instance ${instanceId}:`, error);
        showToast(`Error deleting instance: ${error.message}`, true);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Listen for batch operations
    document.addEventListener('keydown', function(e) {
        // Delete key for batch delete
        if (e.key === 'Delete' && selectedInstances.length > 0) {
            deleteSelectedInstances();
        }
        
        // Ctrl+K for command palette (to be implemented)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            // TODO: Implement command palette
            showToast('Command palette coming soon!', false);
        }
    });
    
    // Load settings from localStorage
    loadSettings();
}

// Delete selected instances
function deleteSelectedInstances() {
    if (selectedInstances.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedInstances.length} instance(s)?`)) {
        return;
    }
    
    // Disable action buttons during operation
    const actionButtons = document.querySelectorAll('.action-buttons button');
    actionButtons.forEach(button => button.disabled = true);
    
    // Show loading toast
    showToast(`Deleting ${selectedInstances.length} instance(s)...`);
    
    // Send API request to delete instances
    fetch('/api/instances/batch/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ instances: selectedInstances })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast(`Deleted ${data.deleted_ids ? data.deleted_ids.length : 0} instance(s) successfully`);
            
            // Clear selection
            selectedInstances = [];
            
            // Refresh the page after a short delay
            setTimeout(() => {
                refreshInstanceData();
            }, 1000);
        } else {
            const errorMessage = data.errors && data.errors.length 
                ? data.errors.join(', ') 
                : 'Unknown error';
            showToast(`Error deleting instances: ${errorMessage}`, true);
        }
    })
    .catch(error => {
        console.error('Error deleting instances:', error);
        showToast(`Error deleting instances: ${error.message || error}`, true);
    })
    .finally(() => {
        // Re-enable action buttons
        actionButtons.forEach(button => button.disabled = false);
    });
}

// Send prompt to instance
function sendPromptToInstance(instanceId, promptText) {
    return fetch(`/api/instances/${instanceId}/prompt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: promptText, submit: true })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error(`Error sending prompt to instance ${instanceId}:`, error);
        showToast(`Failed to send prompt: ${error.message}`, true);
        throw error; // Rethrow to be handled by caller
    });
}