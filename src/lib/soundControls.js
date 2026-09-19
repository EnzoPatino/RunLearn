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

  function syncButton() {
    if (icon) icon.textContent = soundEnabled ? '🔊' : '🔇';
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
