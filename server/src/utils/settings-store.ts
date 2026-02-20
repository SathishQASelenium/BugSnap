import fs from 'fs';
import path from 'path';

export interface Settings {
    jira: {
        projectKey: string;
        apiKey: string;
        email: string;
        baseUrl: string;
        issueType: string;
    };
    groq: {
        apiKey: string;
    };
}

const SETTINGS_PATH = path.join(__dirname, '..', '..', 'settings.json');

const DEFAULT_SETTINGS: Settings = {
    jira: {
        projectKey: '',
        apiKey: '',
        email: '',
        baseUrl: '',
        issueType: 'Bug',
    },
    groq: {
        apiKey: '',
    },
};

export function loadSettings(): Settings {
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
            return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        }
    } catch (err) {
        console.error('Error loading settings:', err);
    }
    return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: Settings): void {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}
