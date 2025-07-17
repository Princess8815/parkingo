// Centralized Firebase Configuration
// This file handles Firebase initialization for the entire application

class FirebaseManager {
  constructor() {
    this.firebaseConfig = {
      apiKey: 'AIzaSyASzLzGNP_099SC4Qr9szdxyuFArpsgv1A',
      authDomain: 'theme-park-bingo.firebaseapp.com',
      databaseURL: 'https://theme-park-bingo-default-rtdb.firebaseio.com',
      projectId: 'theme-park-bingo',
      storageBucket: 'theme-park-bingo.firebasestorage.app',
      messagingSenderId: '826233039245',
      appId: '1:826233039245:web:0e23020d5a3f2f45bd35c4',
      measurementId: 'G-M64J9321TE',
    }

    this.isInitialized = false
    this.database = null
  }

  async initialize() {
    try {
      // Check if Firebase is loaded
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded')
      }

      // Initialize Firebase if not already done
      if (!firebase.apps.length) {
        firebase.initializeApp(this.firebaseConfig)
      }

      // Initialize database
      if (firebase.database) {
        this.database = firebase.database()
        this.isInitialized = true
        console.log('Firebase initialized successfully')
        return true
      } else {
        throw new Error('Firebase database not available')
      }
    } catch (error) {
      console.log('Firebase initialization failed:', error.message)
      this.isInitialized = false
      return false
    }
  }

  getDatabase() {
    return this.database
  }

  isReady() {
    return this.isInitialized
  }
}

// Export for global use
window.FirebaseManager = FirebaseManager
