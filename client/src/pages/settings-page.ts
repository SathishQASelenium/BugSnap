import { getSettings, saveSettings, testJiraConnection, testGroqConnection } from '../api';

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

function setButtonLoading(btn: HTMLButtonElement, loading: boolean, originalText: string) {
    if (loading) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> Testing...`;
    } else {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

export function renderSettingsPage(container: HTMLElement, onNavigateBack: () => void) {
    container.innerHTML = `
    <div class="settings-page">
      <div class="settings-header">
        <h1 class="settings-header__title">
          <span class="settings-header__title-icon">⚙️</span>Settings
        </h1>
        <button class="btn btn--secondary" id="back-btn">← Back</button>
      </div>

      <div class="card">
        <!-- JIRA Section -->
        <div class="settings-section">
          <div class="settings-section__header">
            <div class="settings-section__title">
              <span class="settings-section__number">1</span>
              JIRA Connection Details
            </div>
            <span id="jira-status"></span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-group__label" for="jira-project">Project Key</label>
              <input class="input" id="jira-project" type="text" placeholder="e.g. VWO" />
            </div>
            <div class="form-group">
              <label class="form-group__label" for="jira-issue-type">Issue Type</label>
              <input class="input" id="jira-issue-type" type="text" placeholder="Bug" value="Bug" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="jira-email">Email</label>
            <input class="input" id="jira-email" type="email" placeholder="your-email@company.com" />
          </div>

          <div class="form-group">
            <label class="form-group__label" for="jira-api-key">API Key / Token</label>
            <input class="input" id="jira-api-key" type="password" placeholder="Your Jira API token" />
          </div>

          <div class="form-group">
            <label class="form-group__label" for="jira-url">JIRA URL</label>
            <input class="input" id="jira-url" type="url" placeholder="https://your-domain.atlassian.net" />
          </div>
        </div>

        <div class="divider"></div>

        <!-- GROQ Section -->
        <div class="settings-section">
          <div class="settings-section__header">
            <div class="settings-section__title">
              <span class="settings-section__number">2</span>
              GROQ API Key
            </div>
            <span id="groq-status"></span>
          </div>

          <div class="form-group">
            <label class="form-group__label" for="groq-api-key">API Key</label>
            <input class="input" id="groq-api-key" type="password" placeholder="gsk_..." />
          </div>
        </div>

        <div class="divider"></div>

        <!-- Actions -->
        <div class="settings-actions">
          <button class="btn btn--primary" id="save-btn">💾 Save Settings</button>
          <button class="btn btn--outline" id="test-jira-btn">🔗 Test Jira Connection</button>
          <button class="btn btn--outline" id="test-groq-btn">🤖 Test Groq Connection</button>
        </div>
      </div>
    </div>
  `;

    // Load existing settings
    loadCurrentSettings();

    // Event listeners
    document.getElementById('back-btn')?.addEventListener('click', onNavigateBack);
    document.getElementById('save-btn')?.addEventListener('click', handleSave);
    document.getElementById('test-jira-btn')?.addEventListener('click', handleTestJira);
    document.getElementById('test-groq-btn')?.addEventListener('click', handleTestGroq);
}

async function loadCurrentSettings() {
    try {
        const result = await getSettings();
        if (result.success && result.settings) {
            const s = result.settings;
            (document.getElementById('jira-project') as HTMLInputElement).value = s.jira.projectKey || '';
            (document.getElementById('jira-api-key') as HTMLInputElement).value = s.jira.apiKey || '';
            (document.getElementById('jira-email') as HTMLInputElement).value = s.jira.email || '';
            (document.getElementById('jira-url') as HTMLInputElement).value = s.jira.baseUrl || '';
            (document.getElementById('jira-issue-type') as HTMLInputElement).value = s.jira.issueType || 'Bug';
            (document.getElementById('groq-api-key') as HTMLInputElement).value = s.groq.apiKey || '';
        }
    } catch {
        // Settings file doesn't exist yet, that's fine
    }
}

function getFormValues() {
    return {
        jira: {
            projectKey: (document.getElementById('jira-project') as HTMLInputElement).value.trim(),
            apiKey: (document.getElementById('jira-api-key') as HTMLInputElement).value.trim(),
            email: (document.getElementById('jira-email') as HTMLInputElement).value.trim(),
            baseUrl: (document.getElementById('jira-url') as HTMLInputElement).value.trim(),
            issueType: (document.getElementById('jira-issue-type') as HTMLInputElement).value.trim() || 'Bug',
        },
        groq: {
            apiKey: (document.getElementById('groq-api-key') as HTMLInputElement).value.trim(),
        },
    };
}

async function handleSave() {
    const btn = document.getElementById('save-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const values = getFormValues();
        const result = await saveSettings(values);
        if (result.success) {
            showToast('Settings saved successfully!', 'success');
        } else {
            showToast(result.error || 'Failed to save settings', 'error');
        }
    } catch (err: any) {
        showToast('Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '💾 Save Settings';
    }
}

async function handleTestJira() {
    const btn = document.getElementById('test-jira-btn') as HTMLButtonElement;
    const statusEl = document.getElementById('jira-status') as HTMLElement;
    const originalText = btn.innerHTML;

    // Save settings first
    const values = getFormValues();
    await saveSettings(values);

    setButtonLoading(btn, true, originalText);
    statusEl.innerHTML = '<span class="status-badge status-badge--pending">⏳ Testing...</span>';

    try {
        const result = await testJiraConnection();
        if (result.success) {
            statusEl.innerHTML = '<span class="status-badge status-badge--success">✓ Connected</span>';
            showToast(result.message || 'Jira connected!', 'success');
        } else {
            statusEl.innerHTML = '<span class="status-badge status-badge--error">✕ Failed</span>';
            showToast(result.error || 'Jira connection failed', 'error');
        }
    } catch (err: any) {
        statusEl.innerHTML = '<span class="status-badge status-badge--error">✕ Error</span>';
        showToast('Error: ' + err.message, 'error');
    } finally {
        setButtonLoading(btn, false, originalText);
    }
}

async function handleTestGroq() {
    const btn = document.getElementById('test-groq-btn') as HTMLButtonElement;
    const statusEl = document.getElementById('groq-status') as HTMLElement;
    const originalText = btn.innerHTML;

    // Save settings first
    const values = getFormValues();
    await saveSettings(values);

    setButtonLoading(btn, true, originalText);
    statusEl.innerHTML = '<span class="status-badge status-badge--pending">⏳ Testing...</span>';

    try {
        const result = await testGroqConnection();
        if (result.success) {
            statusEl.innerHTML = '<span class="status-badge status-badge--success">✓ Connected</span>';
            showToast(result.message || 'Groq connected!', 'success');
        } else {
            statusEl.innerHTML = '<span class="status-badge status-badge--error">✕ Failed</span>';
            showToast(result.error || 'Groq connection failed', 'error');
        }
    } catch (err: any) {
        statusEl.innerHTML = '<span class="status-badge status-badge--error">✕ Error</span>';
        showToast('Error: ' + err.message, 'error');
    } finally {
        setButtonLoading(btn, false, originalText);
    }
}
