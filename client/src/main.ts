import { createApp } from 'vue'
import App from './App.vue'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles.css'
import './fidelity.css'
import './styles/pages/reply.css'
// Shared shell rules resolve after legacy flow styles.
import './styles/base.css'
import './styles/components.css'
document.addEventListener('contextmenu', event => {
  const target = event.target
  if (target instanceof Element) {
    const editor = target.closest('[contenteditable]')
    if (target.closest('input,textarea') || (editor instanceof HTMLElement && editor.isContentEditable)) return
  }
  event.preventDefault()
})
createApp(App).mount('#app')
