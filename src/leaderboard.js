/* Nickname preparation only: shared score submission needs a backend service. */
(function () {
  const form = document.getElementById('nickname-form');
  const input = document.getElementById('nickname');
  const status = document.getElementById('nickname-status');
  try { input.value = localStorage.getItem('hospice-dash-nickname') || ''; } catch {}
  form.addEventListener('submit', event => {
    event.preventDefault();
    const nickname = input.value.normalize('NFKC').trim();
    if (!/^[A-Za-z0-9 _-]{3,20}$/.test(nickname)) {
      status.textContent = 'Use 3–20 letters, numbers, spaces, underscores or hyphens.'; return;
    }
    // A first-pass courtesy filter, not a substitute for server-side moderation.
    const normalized = nickname.toLowerCase().replace(/[013457@$]/g, c => ({0:'o',1:'i',3:'e',4:'a',5:'s',7:'t','@':'a','$':'s'}[c])).replace(/[^a-z]/g, '');
    if (/(fuck|shit|cunt|nigg|faggot|bitch)/.test(normalized)) {
      status.textContent = 'Please choose a family-friendly nickname.'; return;
    }
    try {
      localStorage.setItem('hospice-dash-nickname', nickname);
      input.value = nickname; status.textContent = 'Nickname saved on this device. Shared score uploads are not connected yet.';
    } catch { status.textContent = 'Your browser is blocking storage, so this nickname could not be saved.'; }
  });
})();
