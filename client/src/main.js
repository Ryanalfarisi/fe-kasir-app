import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import vue3GoogleLogin from 'vue3-google-login'

const app = createApp(App)

app.use(router)

// Initialize Google Login
// NOTE: For development, we use a placeholder or prompt user.
// To make it work in demo, we need a valid client ID. 
// I will use a dummy one, but it will error on click if not replaced.
// For now, I'll instruct user to replace it.
const GOOGLE_CLIENT_ID = '850077129404-dqc8trp32l2bo0behslrhquddmnpikr2.apps.googleusercontent.com' 

app.use(vue3GoogleLogin, {
  clientId: GOOGLE_CLIENT_ID
})

app.mount('#app')
