const API_BASE = '/api';

interface ApiResponse<T = any> {
    success: boolean;
    error?: string;
    message?: string;
    [key: string]: any;
}

async function request<T = any>(
    url: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE}${url}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers as any },
        ...options,
    });
    const data = await res.json();
    if (!res.ok && !data.error) {
        data.error = `Request failed with status ${res.status}`;
    }
    return data;
}

export async function getSettings() {
    return request('/settings');
}

export async function saveSettings(settings: {
    jira: {
        projectKey: string;
        apiKey: string;
        email: string;
        baseUrl: string;
        issueType: string;
    };
    groq: { apiKey: string };
}) {
    return request('/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
    });
}

export async function testJiraConnection() {
    return request('/test/jira', { method: 'POST' });
}

export async function testGroqConnection() {
    return request('/test/groq', { method: 'POST' });
}

export async function analyzeScreenshot(file: File, notes: string) {
    const formData = new FormData();
    formData.append('screenshot', file);
    formData.append('notes', notes);

    const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
    });
    return res.json();
}

export async function createJiraTicket(summary: string, description: string) {
    return request('/create-ticket', {
        method: 'POST',
        body: JSON.stringify({ summary, description }),
    });
}
