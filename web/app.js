/**
 * App logic: language switching, OS detection, download link wiring.
 *
 * Load order in index.html:
 *   1. <script> const APP_VERSION = '__APP_VERSION__'; </script>  ← CI patches this
 *   2. <script src="i18n.js">                                     ← translation strings
 *   3. <script src="app.js">                                      ← this file
 */

/* global APP_VERSION, i18n, lucide */

const RELEASE_URL = `https://github.com/BeaversLab/codex-rebuilder/releases/download/v${APP_VERSION}/Codex-${APP_VERSION}.zip`;

function detectLang() {
    const nav = (navigator.language || navigator.languages?.[0] || 'en').toLowerCase();
    if (nav.startsWith('zh-hk') || nav.startsWith('zh-tw') || nav.startsWith('zh-hant')) return 'zh-HK';
    if (nav.startsWith('zh')) return 'zh';
    if (nav.startsWith('fr')) return 'fr';
    if (nav.startsWith('es')) return 'es';
    if (nav.startsWith('de')) return 'de';
    if (nav.startsWith('ja')) return 'ja';
    if (nav.startsWith('ko')) return 'ko';
    if (nav.startsWith('ru')) return 'ru';
    if (nav.startsWith('ar')) return 'ar';
    return 'en';
}

let currentLang = detectLang();

function detectOS() {
    const ua = (navigator.userAgent || '').toLowerCase();
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('win')) return 'Windows';
    if (ua.includes('linux')) return 'Linux';
    return 'Unknown';
}

function applyLang(lang) {
    const t = i18n[lang];
    const os = detectOS();

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Text direction (RTL for Arabic)
    document.documentElement.dir = t.dir || 'ltr';

    // Page title
    document.title = t['page-title'];

    // Language trigger label (uses a <span id="lang-current"> inside the button)
    const langCurrent = document.getElementById('lang-current');
    if (langCurrent) langCurrent.innerText = t['lang-current'];

    // Nav GitHub link — preserves the <i> icon, updates the <span> text
    const navGh = document.getElementById('nav-github');
    if (navGh) {
        const span = navGh.querySelector('span');
        if (span) span.innerText = t['nav-github'];
    }

    // Plain-text elements
    const textKeys = [
        'promo-text', 'hero-title', 'hero-desc',
        'label-apple', 'label-windows',
        'f1-title', 'f1-desc', 'f2-title', 'f2-desc',
        'f3-title', 'f3-desc', 'f4-title', 'f4-desc',
        'trouble-title', 'trouble-desc',
    ];
    for (const key of textKeys) {
        const el = document.getElementById(key);
        if (el) el.innerText = t[key];
    }

    // Footer contains an <a> tag — use innerHTML
    const footer = document.getElementById('footer-text');
    if (footer) footer.innerHTML = t['footer-text'];

    // OS detection label
    const osTag = document.getElementById('detected-os');
    if (osTag) osTag.innerText = t['detected-os'] + os;

    // Primary download button
    const mainBtn = document.getElementById('main-download-btn');
    const mainBtnText = document.getElementById('main-download-text');
    if (mainBtn && mainBtnText) {
        if (os === 'macOS') {
            mainBtn.href = RELEASE_URL;
            mainBtnText.innerText = t['main-download-text'];
        } else {
            mainBtn.href = 'https://openai.com/codex';
            mainBtnText.innerText = os === 'Windows' ? t['download-windows'] : t['download-other'];
        }
    }

    if (window.lucide) lucide.createIcons();
}

function changeLang(lang) {
    currentLang = lang;
    applyLang(lang);
}

document.addEventListener('DOMContentLoaded', function () {
    applyLang(currentLang);
    if (window.lucide) lucide.createIcons();
});
