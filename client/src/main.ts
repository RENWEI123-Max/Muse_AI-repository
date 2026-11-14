import { createApp } from 'vue'
import App from './App.vue'
import './styles/tokens.css'
import './styles.css'
import './fidelity.css'
import './styles/pages/reply.css'
// Shared shell rules resolve after legacy flow styles.
import './styles/base.css'
import './styles/components.css'
createApp(App).mount('#app')
