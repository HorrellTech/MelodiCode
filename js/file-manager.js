class FileManager {
    constructor() {
        this.projectData = {
            name: 'Untitled Project',
            code: '',
            samples: new Map(),
            settings: {},
            created: new Date(),
            modified: new Date()
        };
        this.autoSaveInterval = null;
        this.setupAutoSave();
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, 30000);
    }

    autoSave() {
        try {
            const code = window.editor ? window.editor.getValue() : '';
            if (code !== this.projectData.code) {
                this.projectData.code = code;
                this.projectData.modified = new Date();
                localStorage.setItem('melodicode-autosave', JSON.stringify(this.projectData));
                console.log('Project auto-saved');
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    loadAutoSave() {
        try {
            const saved = localStorage.getItem('melodicode-autosave');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.code && data.code.trim()) {
                    return data;
                }
            }
        } catch (error) {
            console.error('Failed to load auto-save:', error);
        }
        return null;
    }

    newProject() {
        this.projectData = {
            name: 'Untitled Project',
            code: '',
            samples: new Map(),
            settings: {},
            created: new Date(),
            modified: new Date()
        };
        if (window.editor) window.editor.setValue(this.getTemplateCode());
        this.updateProjectInfo();
        return this.projectData;
    }

    getTemplateCode() {
        return `// MelodiCode Project
// A powerful code-based music generator

[main]
    // Set the tempo
    bpm 120
    
    // Play a kick drum
    sample kick 1 1 0.8
    wait 0.5
    
    // Play a snare
    sample snare 1 1 0.7
    wait 0.5
    
    // Generate a tone
    tone C4 0.25 0.5
    wait 0.25
    tone E4 0.25 0.5
    wait 0.25
[end]

[bass]
    tone C2 0.5 0.8
    wait 0.5
    tone G2 0.5 0.8
    wait 0.5
[end]

// Play blocks together
play main bass volume=0.9`;
    }

    async saveProject(filename = null) {
        try {
            const code = window.editor ? window.editor.getValue() : '';
            
            this.projectData.code = code;
            this.projectData.modified = new Date();
            
            if (!filename) {
                filename = this.projectData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            }

            const projectJson = JSON.stringify(this.projectData, null, 2);
            
            // Save as .mcode file
            const blob = new Blob([projectJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename + '.mcode';
            a.click();
            
            URL.revokeObjectURL(url);
            
            // Also save to localStorage as backup
            localStorage.setItem('melodicode-project', projectJson);
            
            return { success: true, message: 'Project saved successfully' };
        } catch (error) {
            return { success: false, message: 'Failed to save project: ' + error.message };
        }
    }

    async loadProject(file) {
        try {
            let projectData;
            
            if (file instanceof File) {
                const text = await file.text();
                
                // Check if it's a JSON project file or plain code
                try {
                    projectData = JSON.parse(text);
                } catch {
                    // Treat as plain code file
                    projectData = {
                        name: file.name.replace(/\.[^/.]+$/, ""),
                        code: text,
                        samples: new Map(),
                        settings: {},
                        created: new Date(),
                        modified: new Date()
                    };
                }
            } else {
                // Loading from localStorage or string
                projectData = typeof file === 'string' ? JSON.parse(file) : file;
            }

            this.projectData = projectData;
            if (window.editor) window.editor.setValue(projectData.code);
            
            // Load project samples if any
            if (projectData.samples && projectData.samples.size > 0) {
                await this.loadProjectSamples(projectData.samples);
            }
            
            this.updateProjectInfo();
            
            return { success: true, message: 'Project loaded successfully' };
        } catch (error) {
            return { success: false, message: 'Failed to load project: ' + error.message };
        }
    }

    async loadProjectSamples(samples) {
        // This would load any embedded samples from the project
        // For now, we'll just log that samples were referenced
        for (const [name, data] of samples) {
            console.log(`Referenced sample: ${name}`);
        }
    }

    async importAudioFiles(files) {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.importAudioFile(file);
                results.push(result);
            } catch (error) {
                results.push({
                    success: false,
                    filename: file.name,
                    message: error.message
                });
            }
        }
        
        return results;
    }

    async importAudioFile(file) {
        try {
            // Validate file type
            if (!file.type.startsWith('audio/')) {
                throw new Error('File is not an audio file');
            }

            // Check file size (limit to 50MB)
            if (file.size > 50 * 1024 * 1024) {
                throw new Error('File too large (max 50MB)');
            }

            // Load into audio engine
            const sampleName = await window.audioEngine.loadAudioFile(file);
            
            // Store reference in project
            this.projectData.samples.set(sampleName, {
                filename: file.name,
                size: file.size,
                type: file.type,
                imported: new Date()
            });

            this.updateProjectInfo();

            return {
                success: true,
                filename: file.name,
                sampleName: sampleName,
                message: 'File imported successfully'
            };
        } catch (error) {
            throw new Error(`Failed to import ${file.name}: ${error.message}`);
        }
    }

    exportCode() {
        const code = window.editor ? window.editor.getValue() : '';
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = this.projectData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.txt';
        a.click();

        URL.revokeObjectURL(url);
    }

    async exportAudio(format = 'wav', duration = null) {
        try {
            let audioBlob;
            // Always estimate duration using the code interpreter
            if (window.codeInterpreter) {
                // Estimate main block duration in seconds
                duration = window.codeInterpreter.estimateDuration('main');
                // Add a small buffer for reverb/tails
                duration = Math.ceil(duration + 1);
                if (duration < 2) duration = 10; // fallback minimum
            } else {
                duration = 10; // fallback if interpreter missing
            }
            switch (format.toLowerCase()) {
                case 'wav':
                    audioBlob = await window.audioEngine.exportWAV(duration);
                    break;
                default:
                    throw new Error('Unsupported audio format');
            }

            const url = URL.createObjectURL(audioBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.projectData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.' + format;
            a.click();

            URL.revokeObjectURL(url);

            return { success: true, message: `${format.toUpperCase()} exported successfully` };
        } catch (error) {
            return { success: false, message: 'Export failed: ' + error.message };
        }
    }

    async exportStems() {
        try {
            this.updateStatus('Exporting stems...');
            
            const code = window.editor ? window.editor.getValue() : '';
            if (!code.trim()) {
                throw new Error('No code to export');
            }

            // Parse the code to get blocks
            const parseResult = window.codeInterpreter.parse(code);
            if (!parseResult.success) {
                throw new Error('Invalid code: ' + parseResult.message);
            }

            // Get all blocks
            const blocks = Array.from(window.codeInterpreter.blocks.keys());
            if (blocks.length === 0) {
                throw new Error('No blocks found to export');
            }

            // Estimate total duration for consistency across all stems
            let totalDuration = 10; // fallback
            try {
                totalDuration = window.codeInterpreter.estimateDuration('main');
                if (!totalDuration || isNaN(totalDuration) || totalDuration < 1) {
                    totalDuration = 10;
                }
                totalDuration = Math.ceil(totalDuration + 5); // Add buffer for reverb tails
            } catch (e) {
                totalDuration = 10;
            }

            // Load JSZip library if not already loaded
            if (typeof JSZip === 'undefined') {
                await this.loadJSZip();
            }

            const zip = new JSZip();
            const projectName = this.projectData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

            // Export each block as a separate stem
            for (let i = 0; i < blocks.length; i++) {
                const blockName = blocks[i];
                this.updateStatus(`Exporting stem ${i + 1}/${blocks.length}: ${blockName}`);

                try {
                    // Create isolated code that only plays this block
                    const isolatedCode = this.createIsolatedBlockCode(blockName, code);
                    
                    // Export this block as WAV
                    const audioBlob = await this.exportBlockAsWAV(isolatedCode, totalDuration);
                    
                    // Add to zip
                    const fileName = `${projectName}_${blockName}.wav`;
                    zip.file(fileName, audioBlob);
                    
                } catch (blockError) {
                    console.warn(`Failed to export block ${blockName}:`, blockError);
                    // Continue with other blocks
                }
            }

            // Generate and download the zip file
            this.updateStatus('Creating ZIP file...');
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectName}_stems.zip`;
            a.click();
            URL.revokeObjectURL(url);

            return { success: true, message: `Stems exported successfully (${blocks.length} files)` };

        } catch (error) {
            return { success: false, message: 'Stems export failed: ' + error.message };
        }
    }

    async loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    createIsolatedBlockCode(blockName, originalCode) {
        // Parse the original code to extract global settings and the specific block
        const lines = originalCode.split('\n');
        let isolatedCode = '';
        let inTargetBlock = false;
        let currentBlock = null;
        let blockDepth = 0;

        // First pass: collect global settings (BPM, etc.)
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip comments and empty lines
            if (!trimmedLine || trimmedLine.startsWith('//')) continue;
            
            // Capture global BPM settings
            if (trimmedLine.startsWith('bpm ') && !inTargetBlock && !currentBlock) {
                isolatedCode += trimmedLine + '\n';
                continue;
            }
            
            // Track block boundaries
            if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']') && !trimmedLine.includes('end')) {
                currentBlock = trimmedLine.slice(1, -1);
                if (currentBlock === blockName) {
                    inTargetBlock = true;
                    isolatedCode += trimmedLine + '\n';
                }
                blockDepth++;
            } else if (trimmedLine === '[end]') {
                if (inTargetBlock) {
                    isolatedCode += trimmedLine + '\n';
                    inTargetBlock = false;
                }
                currentBlock = null;
                blockDepth--;
            } else if (inTargetBlock) {
                isolatedCode += trimmedLine + '\n';
            }
        }

        // Add play command for the isolated block
        isolatedCode += `\nplay ${blockName}`;

        return isolatedCode;
    }

    async exportBlockAsWAV(code, duration) {
        // Temporarily store the current editor content
        const originalCode = window.editor.getValue();
        
        try {
            // Set the isolated code
            window.editor.setValue(code);
            
            // Use the existing export WAV functionality
            const audioBlob = await window.audioEngine.exportWAV(duration);
            
            return audioBlob;
        } finally {
            // Restore the original code
            window.editor.setValue(originalCode);
        }
    }

    updateStatus(message) {
        if (window.uiManager) {
            window.uiManager.updateStatus(message);
        }
    }

    createProjectBackup() {
        const backup = {
            ...this.projectData,
            backupDate: new Date(),
            version: '1.0'
        };
        
        const backupKey = `melodicode-backup-${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        
        // Keep only last 5 backups
        this.cleanupBackups();
        
        return backup;
    }

    cleanupBackups() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('melodicode-backup-'));
        
        if (keys.length > 5) {
            keys.sort();
            for (let i = 0; i < keys.length - 5; i++) {
                localStorage.removeItem(keys[i]);
            }
        }
    }

    getBackups() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('melodicode-backup-'));
        const backups = [];
        
        for (const key of keys) {
            try {
                const backup = JSON.parse(localStorage.getItem(key));
                backups.push({
                    key: key,
                    name: backup.name,
                    date: new Date(backup.backupDate),
                    size: localStorage.getItem(key).length
                });
            } catch (error) {
                console.error('Invalid backup:', key);
            }
        }
        
        return backups.sort((a, b) => b.date - a.date);
    }

    async restoreBackup(backupKey) {
        try {
            const backup = localStorage.getItem(backupKey);
            if (!backup) {
                throw new Error('Backup not found');
            }
            
            const result = await this.loadProject(backup);
            if (result.success) {
                this.updateProjectInfo();
            }
            
            return result;
        } catch (error) {
            return { success: false, message: 'Failed to restore backup: ' + error.message };
        }
    }

    updateProjectInfo() {
        // Update UI with project information
        const code = window.editor ? window.editor.getValue() : '';
        this.projectData.code = code;
        this.projectData.modified = new Date();

        // Update window title
        document.title = `MelodiCode - ${this.projectData.name}`;

        // Trigger block inspector update
        if (window.uiManager) {
            window.uiManager.updateBlockInspector();
        }
    }

    getProjectStats() {
        const code = this.projectData.code || '';
        const lines = code.split('\n').length;
        const blocks = (code.match(/\[.*\]/g) || []).filter(match => !match.includes('end')).length;
        const samples = this.projectData.samples.size;
        
        return {
            name: this.projectData.name,
            lines: lines,
            blocks: blocks,
            samples: samples,
            created: this.projectData.created,
            modified: this.projectData.modified,
            size: new Blob([code]).size
        };
    }

    validateProject() {
        const errors = [];
        const warnings = [];
        
        // Check if project has content
        if (!this.projectData.code || this.projectData.code.trim().length === 0) {
            warnings.push('Project is empty');
        }
        
        // Check for very large projects
        if (this.projectData.code && this.projectData.code.length > 100000) {
            warnings.push('Project is very large and may impact performance');
        }
        
        // Check for referenced samples that don't exist
        if (window.codeInterpreter) {
            const parseResult = window.codeInterpreter.parse(this.projectData.code);
            if (!parseResult.success) {
                errors.push('Code has syntax errors');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    // File format detection
    detectFileFormat(filename) {
        const extension = filename.toLowerCase().split('.').pop();
        
        const formats = {
            // Audio formats
            'wav': 'audio',
            'mp3': 'audio',
            'ogg': 'audio',
            'flac': 'audio',
            'aac': 'audio',
            'm4a': 'audio',
            'wma': 'audio',
            
            // Project formats
            'mcode': 'project',
            'json': 'project',
            
            // Code formats
            'txt': 'code',
            'md': 'code'
        };
        
        return formats[extension] || 'unknown';
    }

    // Utility methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    // Cleanup on page unload
    cleanup() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.autoSave(); // Final save
    }
}

// Initialize file manager
window.fileManager = new FileManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    window.fileManager.cleanup();
});
