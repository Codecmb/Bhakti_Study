
async function downloadCompleteLibrary() {
  const button = document.getElementById('download-library');
  const status = document.getElementById('download-status');

  button.disabled = true;
  status.textContent = 'Preparing library download...';

  try {
    if (!('serviceWorker' in navigator) || !('caches' in window)) {
      throw new Error('Offline storage is not supported.');
    }

    const response = await fetch('offline-files.json', {cache:'no-store'});
    if (!response.ok) throw new Error('Cannot load offline manifest.');

    const files = await response.json();
    const cache = await caches.open('bhakti-study-offline-v17');

    let completed = 0;
    let failed = 0;

    for (const file of files) {
      try {
        const url = new URL(file, document.baseURI);
        const result = await fetch(url);
        if (!result.ok) throw new Error('HTTP ' + result.status);
        await cache.put(url, result);
        completed++;
      } catch (error) {
        failed++;
        console.warn('Offline download failed:', file, error);
      }

      status.textContent =
        'Downloading library: ' + (completed + failed) +
        '/' + files.length;
    }

    if (failed) {
      status.textContent =
        'Downloaded ' + completed + ' resources. ' +
        failed + ' failed. Internet may still be required.';
    } else {
      status.textContent =
        'Download complete: ' + completed + ' resources saved.';
    }
  } catch (error) {
    status.textContent = 'Download error: ' + error.message;
  } finally {
    button.disabled = false;
  }
}
