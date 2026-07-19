const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function readPlistValue(plistPath, key) {
    try {
        return execFileSync(
            '/usr/libexec/PlistBuddy',
            ['-c', `Print :${key}`, plistPath],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
        ).trim();
    } catch (_) {
        return null;
    }
}

function readSourceAppMetadata(mountPoint) {
    const appNames = fs.readdirSync(mountPoint)
        .filter(name => name.endsWith('.app'))
        .sort();

    for (const appName of appNames) {
        const appPath = path.join(mountPoint, appName);
        const contentsPath = path.join(appPath, 'Contents');
        const plistPath = path.join(contentsPath, 'Info.plist');
        const asarPath = path.join(contentsPath, 'Resources', 'app.asar');

        if (!fs.existsSync(plistPath) || !fs.existsSync(asarPath)) {
            continue;
        }

        const executable = readPlistValue(plistPath, 'CFBundleExecutable');
        const version = readPlistValue(plistPath, 'CFBundleShortVersionString') ||
            readPlistValue(plistPath, 'CFBundleVersion');

        if (!executable || !version) {
            throw new Error(`Could not read the executable or version from ${plistPath}`);
        }

        return { appPath, contentsPath, executable, version };
    }

    throw new Error(`Could not find an app bundle with app.asar in ${mountPoint}`);
}

if (require.main === module) {
    const mountPoint = process.argv[2];
    if (!mountPoint) {
        console.error('Usage: node source_app.js <mounted-dmg-path>');
        process.exit(1);
    }

    console.log(JSON.stringify(readSourceAppMetadata(mountPoint)));
}

module.exports = { readPlistValue, readSourceAppMetadata };
