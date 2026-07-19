const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { readSourceAppMetadata } = require('../source_app');

function writeSourceApp(mountPoint, appName, plist) {
    const contents = path.join(mountPoint, appName, 'Contents');
    const resources = path.join(contents, 'Resources');
    fs.mkdirSync(resources, { recursive: true });
    fs.writeFileSync(path.join(resources, 'app.asar'), 'fixture');
    fs.writeFileSync(path.join(contents, 'Info.plist'), plist);
}

function plist(entries) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>${Object.entries(entries)
    .map(([key, value]) => `<key>${key}</key><string>${value}</string>`)
    .join('')}</dict></plist>`;
}

test('uses CFBundleVersion when an upstream app omits CFBundleShortVersionString', (t) => {
    const mountPoint = fs.mkdtempSync(path.join(os.tmpdir(), 'source-app-test-'));
    t.after(() => fs.rmSync(mountPoint, { recursive: true, force: true }));

    writeSourceApp(mountPoint, 'Codex.app', plist({
        CFBundleExecutable: 'Codex',
        CFBundleVersion: '26.623.141536',
    }));

    assert.deepEqual(readSourceAppMetadata(mountPoint), {
        appPath: path.join(mountPoint, 'Codex.app'),
        contentsPath: path.join(mountPoint, 'Codex.app', 'Contents'),
        executable: 'Codex',
        version: '26.623.141536',
    });
});

test('prefers the marketing version and supports the renamed ChatGPT bundle', (t) => {
    const mountPoint = fs.mkdtempSync(path.join(os.tmpdir(), 'source-app-test-'));
    t.after(() => fs.rmSync(mountPoint, { recursive: true, force: true }));

    writeSourceApp(mountPoint, 'ChatGPT.app', plist({
        CFBundleExecutable: 'ChatGPT',
        CFBundleShortVersionString: '26.707.31428',
        CFBundleVersion: '5059',
    }));

    assert.deepEqual(readSourceAppMetadata(mountPoint), {
        appPath: path.join(mountPoint, 'ChatGPT.app'),
        contentsPath: path.join(mountPoint, 'ChatGPT.app', 'Contents'),
        executable: 'ChatGPT',
        version: '26.707.31428',
    });
});
