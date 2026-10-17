
function bhaktiMobileNavigation() {
  const layout = document.querySelector('.layout');
  const sidebar = document.querySelector('.sidebar');

  if (!layout || !sidebar || document.getElementById('bhakti-mobile-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'bhakti-mobile-bar';

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = '☰';
  button.setAttribute('aria-label', 'Open navigation');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'bhakti-mobile-sidebar');

  sidebar.id = 'bhakti-mobile-sidebar';

  const title = document.createElement('strong');
  title.textContent = 'Bhakti Study';


  const update = document.createElement('button');
  update.id = 'bhakti-update-button';
  update.type = 'button';
  update.textContent = '↻';
  update.title = 'Check for updates';
  update.setAttribute('aria-label', 'Check for updates');

  update.addEventListener('click', async () => {
    if (update.disabled) return;
    update.disabled = true;
    update.textContent = '…';

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) await registration.update();
      }
      window.location.reload();
    } catch (error) {
      console.error('Update check failed:', error);
      update.textContent = '↻';
      update.disabled = false;
      alert('Unable to check for updates. Please try again.');
    }
  });

  bar.append(button, title, update);
  layout.parentNode.insertBefore(bar, layout);

  button.addEventListener('click', () => {
    const open = layout.classList.toggle('bhakti-menu-open');
    button.textContent = open ? '✕' : '☰';
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
}
