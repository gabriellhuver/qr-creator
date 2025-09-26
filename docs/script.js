class QRCodeGenerator {
    constructor() {
        this.codes = [];
        this.zip = null;
        this.isGenerating = false;
        this.isCancelled = false;
        this.generatedCount = 0;
        this.totalCount = 0;
        this.qrPreviews = [];
        this.showPreview = false;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Input elements
        this.textInput = document.getElementById('textInput');
        this.fileInput = document.getElementById('fileInput');
        this.fileInfo = document.getElementById('fileInfo');
        
        // Tab elements
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Option elements
        this.sizeInput = document.getElementById('size');
        this.marginInput = document.getElementById('margin');
        this.eccSelect = document.getElementById('ecc');
        this.filenamePatternSelect = document.getElementById('filenamePattern');
        
        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.progressText = document.getElementById('progressText');
        this.progressPercent = document.getElementById('progressPercent');
        this.progressFill = document.getElementById('progressFill');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsInfo = document.getElementById('resultsInfo');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Action elements
        this.generateBtn = document.getElementById('generateBtn');
        
        // Preview elements
        this.previewSection = document.getElementById('previewSection');
        this.togglePreviewBtn = document.getElementById('togglePreviewBtn');
        this.previewInfo = document.getElementById('previewInfo');
        this.qrPreviewGrid = document.getElementById('qrPreviewGrid');
        
        // Modal elements
        this.qrModal = document.getElementById('qrModal');
        this.qrModalTitle = document.getElementById('qrModalTitle');
        this.qrModalImage = document.getElementById('qrModalImage');
        this.qrModalCode = document.getElementById('qrModalCode');
        this.qrModalFilename = document.getElementById('qrModalFilename');
        this.closeModal = document.getElementById('closeModal');
        
        // Canvas
        this.canvas = document.getElementById('hiddenCanvas');
    }

    bindEvents() {
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // File input
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Generate button
        this.generateBtn.addEventListener('click', () => this.generateQRCodes());

        // Cancel button
        this.cancelBtn.addEventListener('click', () => this.cancelGeneration());

        // Download button
        this.downloadBtn.addEventListener('click', () => this.downloadZip());

        // Clear button
        this.clearBtn.addEventListener('click', () => this.clearAll());

        // Toggle preview button
        this.togglePreviewBtn.addEventListener('click', () => this.togglePreview());

        // Modal events
        this.closeModal.addEventListener('click', () => this.closeQRModal());
        this.qrModal.addEventListener('click', (e) => {
            if (e.target === this.qrModal) {
                this.closeQRModal();
            }
        });

        // Close modal with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.qrModal.style.display === 'flex') {
                this.closeQRModal();
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab contents
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.fileInfo.innerHTML = `
            <strong>Arquivo selecionado:</strong> ${file.name}<br>
            <strong>Tamanho:</strong> ${this.formatFileSize(file.size)}<br>
            <strong>Tipo:</strong> ${file.type || 'text/plain'}
        `;

        try {
            const text = await this.readFileAsText(file);
            const codes = this.parseFileContent(text, file.name);
            
            // Switch to textarea tab and populate it
            this.switchTab('textarea');
            this.textInput.value = codes.join('\n');
            
            this.showMessage(`Arquivo carregado com sucesso! ${codes.length} códigos encontrados.`, 'success');
        } catch (error) {
            this.showMessage(`Erro ao ler arquivo: ${error.message}`, 'error');
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    parseFileContent(content, filename) {
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        if (filename.toLowerCase().endsWith('.csv')) {
            return this.parseCSV(lines);
        } else {
            return lines;
        }
    }

    parseCSV(lines) {
        const codes = [];
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Look for 'code' column or use first column
        let codeColumnIndex = headers.findIndex(h => h.includes('code'));
        if (codeColumnIndex === -1) {
            codeColumnIndex = 0; // Use first column
        }

        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split(',').map(c => c.trim());
            if (columns[codeColumnIndex]) {
                codes.push(columns[codeColumnIndex]);
            }
        }

        return codes;
    }

    getCodesFromInput() {
        const text = this.textInput.value.trim();
        if (!text) {
            throw new Error('Por favor, insira códigos na área de texto ou carregue um arquivo.');
        }

        const codes = text.split('\n')
            .map(line => line.trim())
            .filter(line => line);

        if (codes.length === 0) {
            throw new Error('Nenhum código válido encontrado.');
        }

        return codes;
    }

    async generateQRCodes() {
        try {
            this.codes = this.getCodesFromInput();
            this.totalCount = this.codes.length;
            this.generatedCount = 0;
            this.isGenerating = true;
            this.isCancelled = false;
            this.qrPreviews = [];
            this.showPreview = false;

            // Show progress section
            this.progressSection.style.display = 'block';
            this.resultsSection.style.display = 'none';
            this.generateBtn.disabled = true;

            // Initialize ZIP
            this.zip = new JSZip();

            // Get options
            const options = this.getGenerationOptions();

            // Process all codes at once
            await this.processAllCodes(options);

            if (!this.isCancelled) {
                this.showResults();
            }

        } catch (error) {
            this.showMessage(`Erro: ${error.message}`, 'error');
            this.resetGeneration();
        }
    }

    getGenerationOptions() {
        const options = {
            width: parseInt(this.sizeInput.value),
            margin: parseInt(this.marginInput.value),
            errorCorrectionLevel: this.eccSelect.value,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        };
        console.log('Generation options:', options);
        return options;
    }

    async processAllCodes(options) {
        const promises = this.codes.map((code, index) => 
            this.generateQRCode(code, options, index)
        );

        await Promise.all(promises);
    }

    async generateQRCode(code, options, index) {
        if (this.isCancelled) return;

        try {
            // Map ECC levels - use string values directly
            const eccLevel = options.errorCorrectionLevel || 'M';
            
            // Create QR code instance
            const qr = qrcode(0, eccLevel);
            qr.addData(code);
            qr.make();
            
            // Generate canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = options.width;
            const margin = options.margin;
            const moduleSize = Math.floor((size - 2 * margin) / qr.getModuleCount());
            
            canvas.width = size;
            canvas.height = size;
            
            // Fill background
            ctx.fillStyle = options.color.light;
            ctx.fillRect(0, 0, size, size);
            
            // Draw QR code
            ctx.fillStyle = options.color.dark;
            for (let row = 0; row < qr.getModuleCount(); row++) {
                for (let col = 0; col < qr.getModuleCount(); col++) {
                    if (qr.isDark(row, col)) {
                        const x = margin + col * moduleSize;
                        const y = margin + row * moduleSize;
                        ctx.fillRect(x, y, moduleSize, moduleSize);
                    }
                }
            }
            
            // Convert to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });
            
            // Generate filename
            const filename = this.generateFilename(code, index);
            
            // Add to ZIP
            this.zip.file(filename, blob);
            
            // Store preview data
            this.qrPreviews.push({
                code: code,
                filename: filename,
                dataURL: canvas.toDataURL('image/png')
            });
            
            this.generatedCount++;
            this.updateProgress();

        } catch (error) {
            console.error(`Erro ao gerar QR code para "${code}":`, error);
        }
    }


    generateFilename(code, index) {
        // Clean the code to make it a valid filename
        const cleanCode = code
            .replace(/[^a-zA-Z0-9\-_]/g, '_')  // Replace invalid chars with underscore
            .substring(0, 50)  // Limit length
            .replace(/_+/g, '_')  // Replace multiple underscores with single
            .replace(/^_|_$/g, '');  // Remove leading/trailing underscores
        
        const pattern = this.filenamePatternSelect.value;
        
        if (pattern === 'hash') {
            const hash = this.simpleHash(code);
            return `${cleanCode}_${hash}.png`;
        } else {
            return `${cleanCode}_${String(index + 1).padStart(4, '0')}.png`;
        }
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).substring(0, 8);
    }

    updateProgress() {
        const percent = Math.round((this.generatedCount / this.totalCount) * 100);
        
        this.progressText.textContent = `${this.generatedCount} / ${this.totalCount}`;
        this.progressPercent.textContent = `${percent}%`;
        this.progressFill.style.width = `${percent}%`;
    }

    showResults() {
        const duplicates = this.findDuplicates(this.codes);
        const emptyLines = this.codes.filter(code => !code.trim()).length;
        
        let resultsText = `
            <strong>✅ Geração concluída!</strong><br>
            <strong>Total de QR codes gerados:</strong> ${this.generatedCount}<br>
            <strong>Total de códigos processados:</strong> ${this.totalCount}
        `;

        if (duplicates.length > 0) {
            resultsText += `<br><strong>⚠️ Códigos duplicados encontrados:</strong> ${duplicates.length}`;
        }

        if (emptyLines > 0) {
            resultsText += `<br><strong>⚠️ Linhas vazias ignoradas:</strong> ${emptyLines}`;
        }

        this.resultsInfo.innerHTML = resultsText;
        this.resultsSection.style.display = 'block';
        this.previewSection.style.display = 'block';
        this.progressSection.style.display = 'none';
        this.resetGeneration();
        
        // Update preview info
        this.previewInfo.textContent = `${this.generatedCount} QR codes gerados`;
    }

    findDuplicates(codes) {
        const seen = new Set();
        const duplicates = [];
        
        codes.forEach(code => {
            if (seen.has(code)) {
                duplicates.push(code);
            } else {
                seen.add(code);
            }
        });
        
        return duplicates;
    }

    async downloadZip() {
        if (!this.zip) {
            this.showMessage('Nenhum arquivo ZIP disponível para download.', 'error');
            return;
        }

        try {
            this.downloadBtn.disabled = true;
            this.downloadBtn.textContent = '⏳ Gerando ZIP...';

            const blob = await this.zip.generateAsync({ type: 'blob' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qr_codes_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showMessage('Download iniciado com sucesso!', 'success');

        } catch (error) {
            this.showMessage(`Erro ao gerar ZIP: ${error.message}`, 'error');
        } finally {
            this.downloadBtn.disabled = false;
            this.downloadBtn.textContent = '📥 Baixar ZIP';
        }
    }

    cancelGeneration() {
        this.isCancelled = true;
        this.showMessage('Geração cancelada pelo usuário.', 'error');
        this.resetGeneration();
    }

    resetGeneration() {
        this.isGenerating = false;
        this.generateBtn.disabled = false;
        this.progressSection.style.display = 'none';
    }

    clearAll() {
        this.textInput.value = '';
        this.fileInput.value = '';
        this.fileInfo.innerHTML = '';
        this.codes = [];
        this.zip = null;
        this.generatedCount = 0;
        this.totalCount = 0;
        this.qrPreviews = [];
        this.showPreview = false;
        
        this.progressSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.previewSection.style.display = 'none';
        this.qrPreviewGrid.innerHTML = '';
        
        this.showMessage('Dados limpos com sucesso!', 'success');
    }

    togglePreview() {
        this.showPreview = !this.showPreview;
        
        if (this.showPreview) {
            this.togglePreviewBtn.textContent = '🙈 Ocultar Preview';
            this.renderPreview();
        } else {
            this.togglePreviewBtn.textContent = '🔍 Mostrar Preview';
            this.qrPreviewGrid.innerHTML = '';
        }
    }

    renderPreview() {
        this.qrPreviewGrid.innerHTML = '';
        
        this.qrPreviews.forEach((qr, index) => {
            const item = document.createElement('div');
            item.className = 'qr-preview-item';
            item.style.cursor = 'pointer';
            
            const img = document.createElement('img');
            img.src = qr.dataURL;
            img.className = 'qr-preview-image';
            img.alt = qr.code;
            
            const label = document.createElement('div');
            label.className = 'qr-preview-label';
            label.textContent = qr.code.length > 15 ? qr.code.substring(0, 15) + '...' : qr.code;
            label.title = qr.code; // Tooltip com texto completo
            
            // Add click event to open modal
            item.addEventListener('click', () => this.openQRModal(qr));
            
            item.appendChild(img);
            item.appendChild(label);
            this.qrPreviewGrid.appendChild(item);
        });
    }

    openQRModal(qr) {
        this.qrModalTitle.textContent = 'QR Code - Escanear';
        this.qrModalImage.src = qr.dataURL;
        this.qrModalCode.textContent = qr.code;
        this.qrModalFilename.textContent = qr.filename;
        this.qrModal.style.display = 'flex';
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }

    closeQRModal() {
        this.qrModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'message';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 10px;
                color: white;
                font-weight: 600;
                z-index: 1000;
                max-width: 400px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
            `;
            document.body.appendChild(messageEl);
        }

        // Set message content and style
        messageEl.textContent = message;
        
        if (type === 'error') {
            messageEl.style.background = 'linear-gradient(135deg, #fc8181, #e53e3e)';
        } else if (type === 'success') {
            messageEl.style.background = 'linear-gradient(135deg, #68d391, #38a169)';
        } else {
            messageEl.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageEl) {
                messageEl.style.opacity = '0';
                setTimeout(() => {
                    if (messageEl && messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 300);
            }
        }, 5000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QRCodeGenerator();
});
