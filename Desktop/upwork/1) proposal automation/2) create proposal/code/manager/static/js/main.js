// Global variables
let refreshInterval = null;
let refreshIntervalTime = 10; // Default refresh interval in seconds
let selectedInstances = [];
let sortDirection = {};

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
    
    // Initialize sorting
    initializeTableSorting();
    
    // Initialize filtering
    initializeFiltering();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Set up event listeners
    setupEventListeners();
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
        
        // Add new rows
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
        
        // Restore selection
        restoreInstanceSelection();
        
        // Re-apply filtering
        filterInstances();
        
        // Re-apply sorting
        sortTable(sortedColumn, direction);
        
        // Re-initialize event listeners
        initializeInstanceSelection();
        
        console.log(`Successfully updated table with ${instances.length} instances`);
    } catch (error) {
        console.error('Error updating instance table:', error);
        // In case of critical error, try reload as fallback
        showToast('Error updating table, please refresh manually', true);
    }
}

// Restore instance selection after refresh
function restoreInstanceSelection() {
    if (selectedInstances.length === 0) return;
    
    const rows = document.querySelectorAll('#instance-list tr');
    rows.forEach(row => {
        const instanceId = row.getAttribute('data-id');
        if (selectedInstances.includes(instanceId)) {
            row.classList.add('selected');
            console.log(`Restored selection for row ${instanceId}`);
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

// Set up event listeners
function setupEventListeners() {
    // Listen for batch operations
    document.addEventListener('keydown', function(e) {
        // Delete key for batch delete
        if (e.key === 'Delete' && selectedInstances.length > 0) {
            deleteSelectedInstances();
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