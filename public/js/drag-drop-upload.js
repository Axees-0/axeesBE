/**
 * Drag & Drop File Upload Component
 * Modern file upload interface with progress tracking and validation
 */

class DragDropUpload {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      maxFiles: 10,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'video/mp4', 'video/webm'
      ],
      showPreview: true,
      enableProgress: true,
      chunkedUpload: false,
      category: 'document',
      onUploadStart: null,
      onUploadProgress: null,
      onUploadComplete: null,
      onUploadError: null,
      ...options
    };

    this.files = [];
    this.uploading = false;
    this.uploadProgress = new Map();

    this.initialize();
  }

  /**
   * Initialize the upload component
   */
  initialize() {
    this.createUploadInterface();
    this.bindEvents();
  }

  /**
   * Create the upload interface HTML
   */
  createUploadInterface() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }

    container.innerHTML = `
      <div class="drag-drop-upload">
        <input type="file" id="${this.containerId}-file-input" multiple 
               accept="${this.getAcceptString()}" style="display: none;">
        
        <div class="upload-zone" id="${this.containerId}-upload-zone">
          <div class="upload-zone-content">
            <div class="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <h3 class="upload-title">Drop files here or click to upload</h3>
            <p class="upload-subtitle">
              Support for ${this.getFileTypeText()}. Max ${this.formatFileSize(this.options.maxFileSize)} per file.
            </p>
            <button class="btn btn-primary upload-browse-btn" type="button">
              Browse Files
            </button>
          </div>
        </div>

        <div class="upload-files-list" id="${this.containerId}-files-list"></div>

        ${this.options.enableProgress ? `
          <div class="upload-progress-container" id="${this.containerId}-progress" style="display: none;">
            <div class="upload-progress-bar">
              <div class="upload-progress-fill" id="${this.containerId}-progress-fill"></div>
            </div>
            <div class="upload-progress-text" id="${this.containerId}-progress-text">0%</div>
          </div>
        ` : ''}

        <div class="upload-actions" id="${this.containerId}-actions" style="display: none;">
          <button class="btn btn-secondary upload-clear-btn" onclick="dragDropUpload_${this.containerId}.clearFiles()">
            Clear All
          </button>
          <button class="btn btn-primary upload-submit-btn" onclick="dragDropUpload_${this.containerId}.uploadFiles()">
            Upload Files
          </button>
        </div>
      </div>
    `;

    this.injectStyles();
    
    // Store reference globally for onclick handlers
    window[`dragDropUpload_${this.containerId}`] = this;
  }

  /**
   * Inject component styles
   */
  injectStyles() {
    if (document.getElementById('drag-drop-upload-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'drag-drop-upload-styles';
    styles.textContent = `
      .drag-drop-upload {
        width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .upload-zone {
        border: 2px dashed #d1d5db;
        border-radius: 12px;
        padding: 48px 24px;
        text-align: center;
        background: #fafbfc;
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      }

      .upload-zone:hover {
        border-color: #6366f1;
        background: #f8faff;
      }

      .upload-zone.drag-over {
        border-color: #6366f1;
        background: #eef2ff;
        transform: scale(1.02);
      }

      .upload-zone.uploading {
        pointer-events: none;
        opacity: 0.7;
      }

      .upload-zone-content {
        position: relative;
        z-index: 2;
      }

      .upload-icon {
        color: #9ca3af;
        margin-bottom: 16px;
      }

      .upload-zone:hover .upload-icon {
        color: #6366f1;
      }

      .upload-title {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: #374151;
      }

      .upload-subtitle {
        margin: 0 0 20px 0;
        font-size: 14px;
        color: #6b7280;
        line-height: 1.5;
      }

      .upload-browse-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        background: #6366f1;
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .upload-browse-btn:hover {
        background: #4f46e5;
        transform: translateY(-1px);
      }

      .upload-files-list {
        margin-top: 20px;
        display: none;
      }

      .upload-files-list.has-files {
        display: block;
      }

      .upload-file-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 8px;
        transition: all 0.2s;
      }

      .upload-file-item:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .file-preview {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        flex-shrink: 0;
        overflow: hidden;
      }

      .file-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 6px;
      }

      .file-preview-icon {
        font-size: 18px;
        color: #6b7280;
      }

      .file-info {
        flex: 1;
        min-width: 0;
      }

      .file-name {
        font-weight: 500;
        color: #374151;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-details {
        font-size: 12px;
        color: #6b7280;
      }

      .file-actions {
        display: flex;
        gap: 8px;
        margin-left: 12px;
      }

      .file-action-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: #f3f4f6;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 12px;
      }

      .file-action-btn:hover {
        background: #e5e7eb;
      }

      .file-action-btn.remove:hover {
        background: #fee2e2;
        color: #dc2626;
      }

      .upload-progress-container {
        margin-top: 16px;
        padding: 16px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .upload-progress-bar {
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .upload-progress-fill {
        height: 100%;
        background: linear-gradient(to right, #6366f1, #8b5cf6);
        border-radius: 3px;
        transition: width 0.3s ease;
        width: 0%;
      }

      .upload-progress-text {
        text-align: center;
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .upload-actions {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .btn-primary {
        background: #6366f1;
        color: white;
      }

      .btn-primary:hover {
        background: #4f46e5;
      }

      .btn-secondary {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
      }

      .btn-secondary:hover {
        background: #e5e7eb;
      }

      .upload-error {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 12px;
        border-radius: 6px;
        margin-top: 12px;
        font-size: 14px;
      }

      .upload-success {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #16a34a;
        padding: 12px;
        border-radius: 6px;
        margin-top: 12px;
        font-size: 14px;
      }

      /* File type specific icons */
      .file-icon-pdf { color: #dc2626; }
      .file-icon-doc { color: #2563eb; }
      .file-icon-image { color: #059669; }
      .file-icon-video { color: #7c3aed; }
      .file-icon-default { color: #6b7280; }

      @media (max-width: 640px) {
        .upload-zone {
          padding: 32px 16px;
        }
        
        .upload-actions {
          flex-direction: column;
        }
        
        .upload-file-item {
          padding: 8px 12px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const uploadZone = document.getElementById(`${this.containerId}-upload-zone`);
    const fileInput = document.getElementById(`${this.containerId}-file-input`);
    const browseBtn = uploadZone.querySelector('.upload-browse-btn');

    // Drag and drop events
    uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
    uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    uploadZone.addEventListener('drop', this.handleDrop.bind(this));

    // Click to browse
    browseBtn.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('click', (e) => {
      if (e.target === uploadZone || e.target.closest('.upload-zone-content')) {
        fileInput.click();
      }
    });

    // File input change
    fileInput.addEventListener('change', this.handleFileSelect.bind(this));
  }

  /**
   * Handle drag over
   */
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const uploadZone = document.getElementById(`${this.containerId}-upload-zone`);
    uploadZone.classList.add('drag-over');
  }

  /**
   * Handle drag leave
   */
  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const uploadZone = document.getElementById(`${this.containerId}-upload-zone`);
    uploadZone.classList.remove('drag-over');
  }

  /**
   * Handle file drop
   */
  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const uploadZone = document.getElementById(`${this.containerId}-upload-zone`);
    uploadZone.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    this.addFiles(files);
  }

  /**
   * Handle file selection from input
   */
  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    this.addFiles(files);
  }

  /**
   * Add files to the upload queue
   */
  addFiles(newFiles) {
    const validFiles = [];
    const errors = [];

    newFiles.forEach(file => {
      // Check file count limit
      if (this.files.length + validFiles.length >= this.options.maxFiles) {
        errors.push(`Maximum ${this.options.maxFiles} files allowed`);
        return;
      }

      // Check file size
      if (file.size > this.options.maxFileSize) {
        errors.push(`${file.name}: File too large (max ${this.formatFileSize(this.options.maxFileSize)})`);
        return;
      }

      // Check file type
      if (!this.options.allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: File type not supported`);
        return;
      }

      // Check for duplicates
      if (this.files.some(f => f.name === file.name && f.size === file.size)) {
        errors.push(`${file.name}: File already added`);
        return;
      }

      validFiles.push(file);
    });

    // Add valid files
    this.files.push(...validFiles);

    // Show errors if any
    if (errors.length > 0) {
      this.showError(errors.join('\n'));
    }

    // Update UI
    this.updateFilesList();
    this.updateActions();
  }

  /**
   * Remove file from queue
   */
  removeFile(index) {
    this.files.splice(index, 1);
    this.updateFilesList();
    this.updateActions();
  }

  /**
   * Clear all files
   */
  clearFiles() {
    this.files = [];
    this.updateFilesList();
    this.updateActions();
    this.hideMessage();
  }

  /**
   * Update files list display
   */
  updateFilesList() {
    const filesList = document.getElementById(`${this.containerId}-files-list`);
    
    if (this.files.length === 0) {
      filesList.classList.remove('has-files');
      filesList.innerHTML = '';
      return;
    }

    filesList.classList.add('has-files');
    filesList.innerHTML = this.files.map((file, index) => `
      <div class="upload-file-item">
        ${this.options.showPreview ? this.createFilePreview(file) : ''}
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-details">
            ${this.formatFileSize(file.size)} • ${this.getFileTypeLabel(file.type)}
          </div>
        </div>
        <div class="file-actions">
          <button class="file-action-btn remove" onclick="dragDropUpload_${this.containerId}.removeFile(${index})" title="Remove">
            ×
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Create file preview
   */
  createFilePreview(file) {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      return `<div class="file-preview"><img src="${url}" alt="${file.name}"></div>`;
    }

    const iconClass = this.getFileIconClass(file.type);
    const icon = this.getFileIcon(file.type);
    
    return `<div class="file-preview"><div class="file-preview-icon ${iconClass}">${icon}</div></div>`;
  }

  /**
   * Get file icon
   */
  getFileIcon(type) {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('text')) return '📄';
    return '📎';
  }

  /**
   * Get file icon CSS class
   */
  getFileIconClass(type) {
    if (type.includes('pdf')) return 'file-icon-pdf';
    if (type.includes('word') || type.includes('document')) return 'file-icon-doc';
    if (type.includes('image')) return 'file-icon-image';
    if (type.includes('video')) return 'file-icon-video';
    return 'file-icon-default';
  }

  /**
   * Update actions visibility
   */
  updateActions() {
    const actions = document.getElementById(`${this.containerId}-actions`);
    
    if (this.files.length > 0 && !this.uploading) {
      actions.style.display = 'flex';
    } else {
      actions.style.display = 'none';
    }
  }

  /**
   * Upload files
   */
  async uploadFiles() {
    if (this.files.length === 0 || this.uploading) return;

    this.uploading = true;
    this.updateActions();
    
    const uploadZone = document.getElementById(`${this.containerId}-upload-zone`);
    uploadZone.classList.add('uploading');

    try {
      if (this.options.onUploadStart) {
        this.options.onUploadStart(this.files);
      }

      let uploadedFiles = [];

      if (this.options.chunkedUpload) {
        uploadedFiles = await this.uploadFilesChunked();
      } else {
        uploadedFiles = await this.uploadFilesStandard();
      }

      this.showSuccess(`Successfully uploaded ${uploadedFiles.length} file(s)`);
      
      if (this.options.onUploadComplete) {
        this.options.onUploadComplete(uploadedFiles);
      }

      // Clear files after successful upload
      this.clearFiles();

    } catch (error) {
      console.error('Upload failed:', error);
      this.showError('Upload failed: ' + error.message);
      
      if (this.options.onUploadError) {
        this.options.onUploadError(error);
      }
    } finally {
      this.uploading = false;
      uploadZone.classList.remove('uploading');
      this.hideProgress();
      this.updateActions();
    }
  }

  /**
   * Standard file upload
   */
  async uploadFilesStandard() {
    const formData = new FormData();
    
    this.files.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('category', this.options.category);

    const response = await fetch('/api/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${window.axeesAPI?.token || localStorage.getItem('axees_token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Upload failed');
    }

    return result.files;
  }

  /**
   * Chunked file upload (for large files)
   */
  async uploadFilesChunked() {
    const uploadedFiles = [];

    for (const file of this.files) {
      const uploadedFile = await this.uploadFileChunked(file);
      uploadedFiles.push(uploadedFile);
    }

    return uploadedFiles;
  }

  /**
   * Upload single file in chunks
   */
  async uploadFileChunked(file) {
    // Initialize chunked upload
    const initResponse = await window.axeesAPI.request('/uploads/chunked/init', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        fileSize: file.size,
        mimetype: file.type
      })
    });

    if (!initResponse.success) {
      throw new Error('Failed to initialize chunked upload');
    }

    const { uploadId, chunkSize } = initResponse;
    const totalChunks = Math.ceil(file.size / chunkSize);

    // Upload chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', i);

      const chunkResponse = await fetch('/api/uploads/chunked/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.axeesAPI?.token || localStorage.getItem('axees_token')}`
        },
        body: formData
      });

      if (!chunkResponse.ok) {
        throw new Error('Chunk upload failed');
      }

      const progress = ((i + 1) / totalChunks) * 100;
      this.updateProgress(progress);
      
      if (this.options.onUploadProgress) {
        this.options.onUploadProgress(progress, file);
      }
    }

    // Complete upload
    const completeResponse = await window.axeesAPI.request('/uploads/chunked/complete', {
      method: 'POST',
      body: JSON.stringify({ uploadId })
    });

    if (!completeResponse.success) {
      throw new Error('Failed to complete chunked upload');
    }

    return completeResponse.file;
  }

  /**
   * Update progress display
   */
  updateProgress(percentage) {
    if (!this.options.enableProgress) return;

    const progressContainer = document.getElementById(`${this.containerId}-progress`);
    const progressFill = document.getElementById(`${this.containerId}-progress-fill`);
    const progressText = document.getElementById(`${this.containerId}-progress-text`);

    progressContainer.style.display = 'block';
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${Math.round(percentage)}%`;
  }

  /**
   * Hide progress display
   */
  hideProgress() {
    if (!this.options.enableProgress) return;

    const progressContainer = document.getElementById(`${this.containerId}-progress`);
    progressContainer.style.display = 'none';
  }

  /**
   * Show error message
   */
  showError(message) {
    this.hideMessage();
    
    const container = document.getElementById(this.containerId);
    const errorEl = document.createElement('div');
    errorEl.className = 'upload-error';
    errorEl.textContent = message;
    
    container.appendChild(errorEl);
    
    // Auto-hide after 5 seconds
    setTimeout(() => errorEl.remove(), 5000);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.hideMessage();
    
    const container = document.getElementById(this.containerId);
    const successEl = document.createElement('div');
    successEl.className = 'upload-success';
    successEl.textContent = message;
    
    container.appendChild(successEl);
    
    // Auto-hide after 3 seconds
    setTimeout(() => successEl.remove(), 3000);
  }

  /**
   * Hide all messages
   */
  hideMessage() {
    const container = document.getElementById(this.containerId);
    const messages = container.querySelectorAll('.upload-error, .upload-success');
    messages.forEach(msg => msg.remove());
  }

  /**
   * Get accept string for file input
   */
  getAcceptString() {
    return this.options.allowedTypes.join(',');
  }

  /**
   * Get file type text for display
   */
  getFileTypeText() {
    const types = [];
    if (this.options.allowedTypes.some(t => t.includes('image'))) types.push('images');
    if (this.options.allowedTypes.some(t => t.includes('pdf'))) types.push('PDFs');
    if (this.options.allowedTypes.some(t => t.includes('document'))) types.push('documents');
    if (this.options.allowedTypes.some(t => t.includes('video'))) types.push('videos');
    
    return types.length > 0 ? types.join(', ') : 'various file types';
  }

  /**
   * Get file type label
   */
  getFileTypeLabel(type) {
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('word')) return 'Word';
    if (type.includes('excel')) return 'Excel';
    if (type.includes('powerpoint')) return 'PowerPoint';
    if (type.includes('image')) return 'Image';
    if (type.includes('video')) return 'Video';
    if (type.includes('text')) return 'Text';
    return 'File';
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Destroy component
   */
  destroy() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
    }
    
    // Clean up global reference
    delete window[`dragDropUpload_${this.containerId}`];
  }
}

// Export for global use
window.DragDropUpload = DragDropUpload;