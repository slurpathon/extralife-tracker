// Check version.info in the github repo.
// If it differs then prompt user to refresh.

let cachedVersion;
let versionCheckInterval;

async function CheckNewVersion() {
    const checkUrl = 'https://raw.githubusercontent.com/slurpathon/extralife-tracker/main/version.info';

    let res = await fetch(checkUrl, {
        cache: "no-store"
    });
    let rawVersion = await res.text();
    let serverVersion = parseFloat(rawVersion.trim());

    // If this is the first page load, assume we have the latest version
    if (!cachedVersion) {
        cachedVersion = serverVersion;
        return;
    }

    if (serverVersion > cachedVersion) {
        console.log('[PAGE-VERSION]', 'Server has a new page version.');
        document.getElementById('snackbar').classList.add('show');

        // Stop checking. Save bandwidth.
        clearInterval(versionCheckInterval);
    } else {
        console.log('[PAGE-VERSION]', 'We have the most recent page version.');
    }
}

// REFRESH BAR
document.getElementById('snackbar').addEventListener('click', function (event) {
    event.preventDefault();

    // Hard refresh the page without cache
    location.reload(true);
});

// Check for a new version every 2 minutes
versionCheckInterval = setInterval(CheckNewVersion, 1000 * 60 * 2);