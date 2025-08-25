// Clean URL Encoder/Decoder Application
class URLProcessor {
    constructor() {
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        this.operationCount = 0;
        this.autoSaveTimer = null;

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadFromStorage();
        this.updateStats();
        this.updateStatus('Ready');
        this.saveInitialState();
    }

    initializeElements() {
        // Main elements
        this.mainTextarea = document.getElementById('main-textarea');
        this.charCount = document.getElementById('char-count');
        this.lineCount = document.getElementById('line-count');
        this.urlCount = document.getElementById('url-count');
        this.operationCountEl = document.getElementById('operation-count');
        this.statusText = document.getElementById('status-text');

        // Operation buttons
        this.urlEncodeBtn = document.getElementById('url-encode');
        this.urlDecodeBtn = document.getElementById('url-decode');
        this.base64EncodeBtn = document.getElementById('base64-encode');
        this.base64DecodeBtn = document.getElementById('base64-decode');
        this.htmlEncodeBtn = document.getElementById('html-encode');
        this.htmlDecodeBtn = document.getElementById('html-decode');

        // Utility buttons
        this.extractUrlsBtn = document.getElementById('extract-urls');
        this.extractEmailsBtn = document.getElementById('extract-emails');
        this.autoDetectBtn = document.getElementById('auto-detect');
        this.clearAllBtn = document.getElementById('clear-all');
        this.copyContentBtn = document.getElementById('copy-content');
        this.uploadFileBtn = document.getElementById('upload-file');

        // Control buttons
        this.undoBtn = document.getElementById('undo');
        this.redoBtn = document.getElementById('redo');
        this.themeToggleBtn = document.getElementById('theme-toggle');

        // File input
        this.fileInput = document.getElementById('file-input');

        // Analysis panel
        this.analysisPanel = document.getElementById('analysis-panel');
        this.urlBreakdown = document.getElementById('url-breakdown');

        // Toast container
        this.toastContainer = document.getElementById('toast-container');
    }

    setupEventListeners() {
        if (!this.mainTextarea) {
            console.error('Main textarea element not found');
            return;
        }

        // Textarea events
        this.mainTextarea.addEventListener('input', () => this.handleInput());
        this.mainTextarea.addEventListener('paste', () => setTimeout(() => this.handleInput(), 10));

        // Operation buttons
        if (this.urlEncodeBtn) this.urlEncodeBtn.addEventListener('click', () => this.performOperationWithFeedback('url-encode', this.urlEncodeBtn));
        if (this.urlDecodeBtn) this.urlDecodeBtn.addEventListener('click', () => this.performOperationWithFeedback('url-decode', this.urlDecodeBtn));
        if (this.base64EncodeBtn) this.base64EncodeBtn.addEventListener('click', () => this.performOperationWithFeedback('base64-encode', this.base64EncodeBtn));
        if (this.base64DecodeBtn) this.base64DecodeBtn.addEventListener('click', () => this.performOperationWithFeedback('base64-decode', this.base64DecodeBtn));
        if (this.htmlEncodeBtn) this.htmlEncodeBtn.addEventListener('click', () => this.performOperationWithFeedback('html-encode', this.htmlEncodeBtn));
        if (this.htmlDecodeBtn) this.htmlDecodeBtn.addEventListener('click', () => this.performOperationWithFeedback('html-decode', this.htmlDecodeBtn));

        // Utility buttons
        if (this.extractUrlsBtn) this.extractUrlsBtn.addEventListener('click', () => this.extractContent('urls'));
        if (this.extractEmailsBtn) this.extractEmailsBtn.addEventListener('click', () => this.extractContent('emails'));
        if (this.autoDetectBtn) this.autoDetectBtn.addEventListener('click', () => this.autoDetectAndFix());
        if (this.clearAllBtn) this.clearAllBtn.addEventListener('click', () => this.clearAll());
        if (this.copyContentBtn) this.copyContentBtn.addEventListener('click', () => this.copyToClipboard());
        if (this.uploadFileBtn && this.fileInput) {
            this.uploadFileBtn.addEventListener('click', () => this.fileInput.click());
            this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Control buttons
        if (this.undoBtn) this.undoBtn.addEventListener('click', () => this.undo());
        if (this.redoBtn) this.redoBtn.addEventListener('click', () => this.redo());
        if (this.themeToggleBtn) this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleInput() {
        this.updateStats();
        this.analyzeContent();
        this.scheduleAutoSave();
    }

    performOperationWithFeedback(operation, button) {
        if (button) {
            button.classList.add('loading');
        }

        // Small delay to show loading state
        setTimeout(() => {
            this.performOperation(operation);
            if (button) {
                button.classList.remove('loading');
            }
        }, 150);
    }

    performOperation(operation) {
        if (!this.mainTextarea) return;

        const content = this.mainTextarea.value;
        if (!content || content.trim().length === 0) {
            this.showToast('No content to process', 'warning');
            this.updateStatus('No content to process');
            return;
        }

        try {
            const startTime = performance.now();
            const result = this.processSingle(content, operation);

            // Save current state to history before changing
            this.saveToHistory();

            // Update the textarea with the result
            this.mainTextarea.value = result;
            this.operationCount++;

            // Update UI - this is important to fix the stats issue
            this.updateStats();
            this.analyzeContent();
            this.updateHistoryButtons();

            const duration = Math.round(performance.now() - startTime);
            const operationName = this.formatOperationName(operation);
            
            this.showToast(`${operationName} completed (${duration}ms)`, 'success');
            this.updateStatus(`${operationName} completed`);

        } catch (error) {
            this.showToast(`Error: ${error.message}`, 'error');
            this.updateStatus(`Error: ${error.message}`);
        }
    }

    processSingle(content, operation) {
        switch (operation) {
            case 'url-encode':
                return encodeURIComponent(content);
            case 'url-decode':
                return decodeURIComponent(content);
            case 'base64-encode':
                return btoa(unescape(encodeURIComponent(content)));
            case 'base64-decode':
                return decodeURIComponent(escape(atob(content)));
            case 'html-encode':
                return this.htmlEncode(content);
            case 'html-decode':
                return this.htmlDecode(content);
            default:
                throw new Error('Unknown operation');
        }
    }

    htmlEncode(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    htmlDecode(text) {
        const div = document.createElement('div');
        div.innerHTML = text;
        return div.textContent || div.innerText || '';
    }

    autoDetectAndFix() {
        if (!this.mainTextarea) return;

        const content = this.mainTextarea.value.trim();
        if (!content) {
            this.showToast('No content to analyze', 'warning');
            return;
        }

        const detection = this.detectEncodingType(content);
        if (!detection) {
            this.showToast('No encoding detected', 'info');
            return;
        }

        let operation;
        switch (detection.type) {
            case 'url-encoded':
                operation = 'url-decode';
                break;
            case 'base64':
                operation = 'base64-decode';
                break;
            case 'html-entities':
                operation = 'html-decode';
                break;
            default:
                this.showToast('No suitable operation found', 'info');
                return;
        }

        this.performOperation(operation);
        this.showToast(`Auto-detected ${detection.type} and applied fix`, 'success');
    }

    detectEncodingType(content) {
        // URL encoding detection
        const urlEncodedPattern = /%[0-9A-Fa-f]{2}/g;
        const urlMatches = content.match(urlEncodedPattern);
        if (urlMatches && urlMatches.length > content.length * 0.1) {
            return { type: 'url-encoded', confidence: 'high' };
        }

        // Base64 detection
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        if (base64Pattern.test(content.replace(/\s/g, '')) && 
            content.length > 4 && 
            content.length % 4 === 0) {
            return { type: 'base64', confidence: 'high' };
        }

        // HTML entities
        const htmlEntityPattern = /&[a-zA-Z]+;|&#[0-9]+;/g;
        const htmlMatches = content.match(htmlEntityPattern);
        if (htmlMatches && htmlMatches.length > 0) {
            return { type: 'html-entities', confidence: 'medium' };
        }

        return null;
    }

    extractContent(type) {
        if (!this.mainTextarea) return;

        const content = this.mainTextarea.value;
        if (!content.trim()) {
            this.showToast(`No content to extract ${type} from`, 'warning');
            return;
        }

        let results = [];
        let pattern;

        switch (type) {
            case 'urls':
                pattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
                results = content.match(pattern) || [];
                break;
            case 'emails':
                pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                results = content.match(pattern) || [];
                break;
        }

        if (results.length === 0) {
            this.showToast(`No ${type} found`, 'info');
            return;
        }

        this.saveToHistory();
        this.mainTextarea.value = results.join('\n');
        this.updateStats();
        this.analyzeContent();

        this.showToast(`Extracted ${results.length} ${type}`, 'success');
    }

    analyzeContent() {
        if (!this.mainTextarea || !this.urlBreakdown) return;

        const content = this.mainTextarea.value.trim();

        if (!content) {
            this.urlBreakdown.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🌐</span>
                    <p>Enter a URL to see component breakdown</p>
                </div>
            `;
            return;
        }

        // Analyze URL if it looks like one
        const urlPattern = /^https?:\/\//;
        if (urlPattern.test(content) && !content.includes('\n')) {
            this.analyzeURL(content);
        } else {
            this.urlBreakdown.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🌐</span>
                    <p>Enter a single URL to see component breakdown</p>
                </div>
            `;
        }
    }

    analyzeURL(url) {
        if (!this.urlBreakdown) return;

        try {
            const parsed = new URL(url);

            this.urlBreakdown.innerHTML = `
                <div class="url-component">
                    <div class="component-label">Protocol</div>
                    <div class="component-value">${parsed.protocol}</div>
                </div>
                <div class="url-component">
                    <div class="component-label">Host</div>
                    <div class="component-value">${parsed.host}</div>
                </div>
                <div class="url-component">
                    <div class="component-label">Path</div>
                    <div class="component-value">${parsed.pathname || '/'}</div>
                </div>
                <div class="url-component">
                    <div class="component-label">Query</div>
                    <div class="component-value">${parsed.search || '(none)'}</div>
                </div>
                <div class="url-component">
                    <div class="component-label">Fragment</div>
                    <div class="component-value">${parsed.hash || '(none)'}</div>
                </div>
            `;
        } catch (error) {
            this.urlBreakdown.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">❌</span>
                    <p>Invalid URL format</p>
                </div>
            `;
        }
    }

    saveToHistory() {
        if (!this.mainTextarea) return;

        const state = {
            content: this.mainTextarea.value,
            timestamp: Date.now()
        };

        // Remove any history after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }

        this.updateHistoryButtons();
        this.saveToStorage();
    }

    saveInitialState() {
        this.history = [{
            content: this.mainTextarea ? this.mainTextarea.value : '',
            timestamp: Date.now()
        }];
        this.historyIndex = 0;
        this.updateHistoryButtons();
    }

    undo() {
        if (!this.mainTextarea || this.historyIndex <= 0) return;

        this.historyIndex--;
        this.mainTextarea.value = this.history[this.historyIndex].content;
        this.updateStats();
        this.analyzeContent();
        this.updateHistoryButtons();
        this.showToast('Action undone', 'info');
    }

    redo() {
        if (!this.mainTextarea || this.historyIndex >= this.history.length - 1) return;

        this.historyIndex++;
        this.mainTextarea.value = this.history[this.historyIndex].content;
        this.updateStats();
        this.analyzeContent();
        this.updateHistoryButtons();
        this.showToast('Action redone', 'info');
    }

    updateHistoryButtons() {
        if (this.undoBtn) {
            this.undoBtn.disabled = this.historyIndex <= 0;
        }
        if (this.redoBtn) {
            this.redoBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
    }

    updateStats() {
        if (!this.mainTextarea) return;

        const content = this.mainTextarea.value;
        const lines = content.split('\n').length;
        const urls = (content.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/g) || []).length;

        if (this.charCount) this.charCount.textContent = content.length.toLocaleString();
        if (this.lineCount) this.lineCount.textContent = lines.toLocaleString();
        if (this.urlCount) this.urlCount.textContent = urls.toLocaleString();
        if (this.operationCountEl) this.operationCountEl.textContent = this.operationCount.toLocaleString();
    }

    clearAll() {
        if (!this.mainTextarea) return;

        if (this.mainTextarea.value.trim()) {
            this.saveToHistory();
        }
        this.mainTextarea.value = '';
        this.updateStats();
        this.analyzeContent();
        this.showToast('Content cleared', 'info');
    }

    async copyToClipboard() {
        if (!this.mainTextarea) return;

        const content = this.mainTextarea.value;
        if (!content.trim()) {
            this.showToast('No content to copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(content);
            this.showToast('Copied to clipboard', 'success');
        } catch (error) {
            // Fallback for older browsers
            this.mainTextarea.select();
            document.execCommand('copy');
            this.showToast('Copied to clipboard', 'success');
        }
    }

    handleFileUpload(event) {
        if (!this.mainTextarea) return;

        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.saveToHistory();
            this.mainTextarea.value = e.target.result;
            this.updateStats();
            this.analyzeContent();
            this.showToast(`File "${file.name}" loaded`, 'success');
        };

        reader.onerror = () => {
            this.showToast('Error reading file', 'error');
        };

        reader.readAsText(file);
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentScheme = html.getAttribute('data-color-scheme') || 
                            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
        
        // Set the new theme
        html.setAttribute('data-color-scheme', newScheme);
        localStorage.setItem('color-scheme', newScheme);
        
        // Update theme icon
        if (this.themeToggleBtn) {
            const icon = this.themeToggleBtn.querySelector('.theme-icon');
            if (icon) {
                icon.textContent = newScheme === 'dark' ? '☀️' : '🌙';
            }
        }
        
        this.showToast(`Switched to ${newScheme} theme`, 'info');
        this.updateStatus(`Switched to ${newScheme} theme`);
    }

    handleKeyboardShortcuts(event) {
        // Don't interfere with normal input unless it's a shortcut
        if (event.target === this.mainTextarea && !event.ctrlKey && !event.metaKey) {
            return;
        }

        const ctrl = event.ctrlKey || event.metaKey;

        if (ctrl) {
            switch (event.key.toLowerCase()) {
                case 'e':
                    event.preventDefault();
                    this.performOperation('url-encode');
                    break;
                case 'd':
                    event.preventDefault();
                    this.performOperation('url-decode');
                    break;
                case 'b':
                    event.preventDefault();
                    if (event.shiftKey) {
                        this.performOperation('base64-decode');
                    } else {
                        this.performOperation('base64-encode');
                    }
                    break;
                case 'u':
                    event.preventDefault();
                    this.extractContent('urls');
                    break;
                case 'z':
                    event.preventDefault();
                    if (event.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    event.preventDefault();
                    this.redo();
                    break;
                case 'l':
                    event.preventDefault();
                    this.clearAll();
                    break;
            }
        }
    }

    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.saveToStorage();
        }, 1000);
    }

    saveToStorage() {
        if (!this.mainTextarea) return;

        try {
            const data = {
                content: this.mainTextarea.value,
                history: this.history,
                historyIndex: this.historyIndex,
                operationCount: this.operationCount
            };
            localStorage.setItem('url-processor-data', JSON.stringify(data));
        } catch (error) {
            console.warn('Could not save to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('url-processor-data');
            if (saved && this.mainTextarea) {
                const data = JSON.parse(saved);
                this.mainTextarea.value = data.content || '';
                this.history = data.history || [];
                this.historyIndex = data.historyIndex || -1;
                this.operationCount = data.operationCount || 0;

                this.updateStats();
                this.analyzeContent();
                this.updateHistoryButtons();
            }

            // Load theme preference and set initial icon
            const savedTheme = localStorage.getItem('color-scheme') ||
                              (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            
            if (savedTheme) {
                document.documentElement.setAttribute('data-color-scheme', savedTheme);
            }
            
            // Set correct theme icon
            if (this.themeToggleBtn) {
                const icon = this.themeToggleBtn.querySelector('.theme-icon');
                if (icon) {
                    icon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
                }
            }
        } catch (error) {
            console.warn('Could not load from localStorage:', error);
        }
    }

    updateStatus(message) {
        if (this.statusText) {
            this.statusText.textContent = message;
            setTimeout(() => {
                if (this.statusText) this.statusText.textContent = 'Ready';
            }, 3000);
        }
    }

    formatOperationName(operation) {
        const names = {
            'url-encode': 'URL Encode',
            'url-decode': 'URL Decode',
            'base64-encode': 'Base64 Encode',
            'base64-decode': 'Base64 Decode',
            'html-encode': 'HTML Encode',
            'html-decode': 'HTML Decode'
        };
        return names[operation] || operation;
    }

    showToast(message, type = 'info', duration = 3000) {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">${this.getToastIcon(type)}</span>
                <span>${message}</span>
            </div>
        `;

        this.toastContainer.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new URLProcessor();
});