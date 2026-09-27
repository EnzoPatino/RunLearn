import sounds from './sounds.js';

const SOUND_STORAGE_KEY = 'runlearn:sound-enabled';

function readSoundPreference() {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
}

function writeSoundPreference(enabled) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
}

export function initSoundControls({
  buttonId = 'btn-toggle-sound',
  iconId = 'sound-icon',
  textId = 'sound-text',
  activeText = 'Sonido activo',
  mutedText = 'Silenciado',
} = {}) {
  let soundEnabled = readSoundPreference();
  const button = document.getElementById(buttonId);
  const icon = document.getElementById(iconId);
  const text = document.getElementById(textId);

  const soundOnSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  const soundOffSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';

  function syncButton() {
    if (icon) icon.innerHTML = soundEnabled ? soundOnSvg : soundOffSvg;
    if (text) text.textContent = soundEnabled ? activeText : mutedText;
    button?.classList.toggle('muted', !soundEnabled);
    button?.setAttribute('aria-pressed', String(!soundEnabled));
  }

  button?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    writeSoundPreference(soundEnabled);
    syncButton();
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== SOUND_STORAGE_KEY) return;
    soundEnabled = readSoundPreference();
    syncButton();
  });

  syncButton();

  return {
    play(fnName) {
      if (!soundEnabled || !sounds || typeof sounds[fnName] !== 'function') return;
      try {
        sounds[fnName]();
      } catch {}
    },
    isEnabled() {
      return soundEnabled;
    },
  };
}
