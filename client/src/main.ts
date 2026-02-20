import './styles.css';
import { renderMainPage } from './pages/main-page';
import { renderSettingsPage } from './pages/settings-page';

const app = document.getElementById('app')!;

type Page = 'main' | 'settings';
let currentPage: Page = 'main';

function navigate(page: Page) {
    currentPage = page;
    render();
}

function render() {
    app.innerHTML = '';
    if (currentPage === 'main') {
        renderMainPage(app, () => navigate('settings'));
    } else {
        renderSettingsPage(app, () => navigate('main'));
    }
}

render();
