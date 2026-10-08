// Load the official Matraic M3E distribution through a file-relative module URL.
// Electron's file:// renderer cannot resolve bare npm specifiers such as
// "@m3e/web/icon". The bundled M3E `all.js` entry exports registerIcon, so we
// register the supplied @m3e/icons add glyph without asking the browser to
// resolve the icon package's bare internal import.
import { registerIcon } from '../node_modules/@m3e/web/dist/all.js';
import '../node_modules/@m3e/icons/dist/outlined/light_mode.js';
import '../node_modules/@m3e/icons/dist/outlined/settings_brightness.js';
import '../node_modules/@m3e/icons/dist/outlined/dark_mode.js';

registerIcon('add', 'outlined', {
  outlined: 'M450-450H200v-60h250v-250h60v250h250v60H510v250h-60v-250Z',
  filled: 'M450-450H200v-60h250v-250h60v250h250v60H510v250h-60v-250Z'
});

window.__resolveM3eReady?.();
