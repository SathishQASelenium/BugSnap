import { analyzeScreenshot, createJiraTicket } from '../api';

let selectedFile: File | null = null;

function showToast(message: string, type: 'success' | 'error' | 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const icons: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function showLoading(text: string, subtext: string = '') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
    <div class="loading-overlay__inner">
      <div class="loading-overlay__spinner"></div>
      <div class="loading-overlay__text">${text}</div>
      ${subtext ? `<div class="loading-overlay__subtext">${subtext}</div>` : ''}
    </div>`;
    document.body.appendChild(overlay);
}

function hideLoading() {
    document.getElementById('loading-overlay')?.remove();
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function updateDropZone(container: HTMLElement) {
    const dropZone = container.querySelector('.drop-zone') as HTMLElement;
    if (!dropZone) return;

    if (selectedFile) {
        dropZone.classList.add('drop-zone--has-file');
        const reader = new FileReader();
        reader.onload = (e) => {
            dropZone.innerHTML = `
        <div class="drop-zone__content">
          <div class="drop-zone__preview">
            <img src="${e.target?.result}" alt="Screenshot preview" />
          </div>
          <div class="drop-zone__file-info">
            <span>📎 ${selectedFile!.name} (${formatFileSize(selectedFile!.size)})</span>
            <button class="drop-zone__remove" id="remove-file">✕ Remove</button>
          </div>
        </div>`;
            document.getElementById('remove-file')?.addEventListener('click', (ev) => {
                ev.stopPropagation();
                selectedFile = null;
                updateDropZone(container);
            });
        };
        reader.readAsDataURL(selectedFile);
    } else {
        dropZone.classList.remove('drop-zone--has-file');
        dropZone.innerHTML = `
      <div class="drop-zone__content">
        <span class="drop-zone__icon">📸</span>
        <div class="drop-zone__title">Drag & Drop Screenshot Here</div>
        <div class="drop-zone__subtitle">or click to browse • PNG, JPG, GIF up to 10 MB</div>
      </div>`;
    }
}

function setupDropZone(container: HTMLElement) {
    const dropZone = container.querySelector('.drop-zone') as HTMLElement;
    const fileInput = container.querySelector('#file-input') as HTMLInputElement;
    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drop-zone--active');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drop-zone--active');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drop-zone--active');
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                selectedFile = file;
                updateDropZone(container);
            } else {
                showToast('Please drop an image file (PNG, JPG, GIF)', 'error');
            }
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
            selectedFile = fileInput.files[0];
            updateDropZone(container);
        }
    });
}

async function handleAnalyzeAndPush(container: HTMLElement) {
    if (!selectedFile) {
        showToast('Please upload a screenshot first', 'error');
        return;
    }

    const notes = (container.querySelector('#additional-notes') as HTMLTextAreaElement)?.value || '';
    const resultPanel = container.querySelector('#result-panel') as HTMLElement;

    // Step 1: Analyze
    showLoading('Analyzing screenshot with AI...', 'Using Groq LLaMA 4 Scout Vision');

    try {
        const analyzeResult = await analyzeScreenshot(selectedFile, notes);
        hideLoading();

        if (!analyzeResult.success) {
            showToast(analyzeResult.error || 'Analysis failed', 'error');
            return;
        }

        // Show analysis result
        if (resultPanel) {
            resultPanel.style.display = 'block';
            resultPanel.innerHTML = `
        <div class="card">
          <div class="card__title"><span class="card__title-icon">🔍</span> AI Analysis Result</div>
          <div class="result-panel__content">${analyzeResult.analysis}</div>
          <div class="divider"></div>
          <button class="btn btn--success btn--full" id="push-to-jira-btn">
            🚀 Push to JIRA
          </button>
        </div>`;

            document.getElementById('push-to-jira-btn')?.addEventListener('click', async () => {
                showLoading('Creating Jira ticket...', 'Pushing bug report to your project');
                try {
                    const ticketResult = await createJiraTicket(
                        analyzeResult.summary,
                        analyzeResult.analysis
                    );
                    hideLoading();
                    if (ticketResult.success) {
                        showToast(`Ticket ${ticketResult.issueKey} created!`, 'success');
                        resultPanel.innerHTML = `
              <div class="card">
                <div class="card__title"><span class="card__title-icon">✅</span> Jira Ticket Created</div>
                <div class="result-panel__content">
                  <strong>Issue:</strong> ${ticketResult.issueKey}<br/><br/>
                  ${analyzeResult.analysis}
                </div>
                <a class="result-panel__link" href="${ticketResult.issueUrl}" target="_blank" rel="noopener">
                  🔗 Open ${ticketResult.issueKey} in Jira →
                </a>
              </div>`;
                    } else {
                        showToast(ticketResult.error || 'Failed to create ticket', 'error');
                    }
                } catch (err: any) {
                    hideLoading();
                    showToast('Error: ' + err.message, 'error');
                }
            });
        }
    } catch (err: any) {
        hideLoading();
        showToast('Error: ' + err.message, 'error');
    }
}

export function renderMainPage(container: HTMLElement, onNavigateSettings: () => void) {
    selectedFile = null;

    container.innerHTML = `
    <div class="header">
      <h1 class="header__title">
        <span class="header__title-icon">🐛</span>Bug Report Enhancer
      </h1>
      <button class="btn btn--secondary" id="settings-btn">⚙️ Settings</button>
    </div>

    <div class="drop-zone" id="drop-zone">
      <div class="drop-zone__content">
        <span class="drop-zone__icon">📸</span>
        <div class="drop-zone__title">Drag & Drop Screenshot Here</div>
        <div class="drop-zone__subtitle">or click to browse • PNG, JPG, GIF up to 10 MB</div>
      </div>
    </div>
    <input type="file" id="file-input" accept="image/*" hidden />

    <textarea
      class="textarea"
      id="additional-notes"
      placeholder="Additional Notes — describe the bug, steps to reproduce, expected behavior..."
      rows="3"
    ></textarea>

    <button class="btn btn--primary btn--lg btn--full" id="analyze-btn">
      🚀 Analyze and push to JIRA
    </button>

    <div id="result-panel" class="result-panel" style="display:none;"></div>
  `;

    setupDropZone(container);

    document.getElementById('settings-btn')?.addEventListener('click', onNavigateSettings);
    document.getElementById('analyze-btn')?.addEventListener('click', () =>
        handleAnalyzeAndPush(container)
    );
}
