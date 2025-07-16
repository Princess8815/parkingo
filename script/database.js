// Firebase Database Integration for Multi-Player Bingo
// This file provides database functionality for real-time multi-player support

class BingoDatabase {
  constructor() {
    this.gameId = null
    this.playerId = null
    this.isOffline = true // Default to offline mode
    this.callbacks = {}

    // Try to initialize Firebase if available
    this.initializeFirebase()
  }

  async initializeFirebase() {
    try {
      // Check if Firebase manager is available
      if (typeof FirebaseManager !== 'undefined') {
        const firebaseManager = new FirebaseManager()
        const isReady = await firebaseManager.initialize()

        if (isReady) {
          this.database = firebaseManager.getDatabase()
          this.isOffline = false
          console.log('Firebase database initialized successfully')
        } else {
          throw new Error('Firebase manager initialization failed')
        }
      } else {
        // Fallback to direct Firebase check
        if (typeof firebase !== 'undefined' && firebase.database) {
          this.database = firebase.database()
          this.isOffline = false
          console.log('Firebase initialized successfully (fallback)')
        } else {
          throw new Error('Firebase not available')
        }
      }
    } catch (error) {
      console.log(
        'Firebase not available, running in offline mode:',
        error.message
      )
      this.isOffline = true
    }
  }

  // Generate or join a game room
  async createOrJoinGame(gameCode = null) {
    if (this.isOffline) {
      return this.handleOfflineMode()
    }

    try {
      if (!gameCode) {
        // Create new game
        this.gameId = this.generateGameCode()
        const gameRef = this.database.ref(`games/${this.gameId}`)

        await gameRef.set({
          created: firebase.database.ServerValue.TIMESTAMP,
          players: {},
          status: 'waiting',
        })
      } else {
        // Join existing game
        this.gameId = gameCode
        const gameRef = this.database.ref(`games/${this.gameId}`)
        const snapshot = await gameRef.once('value')

        if (!snapshot.exists()) {
          throw new Error('Game not found')
        }
      }

      this.playerId = this.generatePlayerId()
      await this.addPlayerToGame()
      this.setupListeners()

      return {
        gameId: this.gameId,
        playerId: this.playerId,
      }
    } catch (error) {
      console.error('Database error, falling back to offline mode:', error)
      return this.handleOfflineMode()
    }
  }

  handleOfflineMode() {
    this.gameId = 'offline'
    this.playerId = 'player1'
    return {
      gameId: this.gameId,
      playerId: this.playerId,
      offline: true,
    }
  }

  generateGameCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  generatePlayerId() {
    return 'player_' + Math.random().toString(36).substring(2, 15)
  }

  async addPlayerToGame() {
    if (this.isOffline) return

    const playerRef = this.database.ref(
      `games/${this.gameId}/players/${this.playerId}`
    )
    await playerRef.set({
      joined: firebase.database.ServerValue.TIMESTAMP,
      bingoCard: null,
      progress: [],
      status: 'playing',
    })
  }

  async saveBingoCard(bingoCard) {
    if (this.isOffline) {
      localStorage.setItem('bingoCard', JSON.stringify(bingoCard))
      return
    }

    try {
      const cardRef = this.database.ref(
        `games/${this.gameId}/players/${this.playerId}/bingoCard`
      )
      await cardRef.set(bingoCard)
    } catch (error) {
      console.error('Failed to save to database, using localStorage:', error)
      localStorage.setItem('bingoCard', JSON.stringify(bingoCard))
    }
  }

  async saveBingoProgress(progress) {
    if (this.isOffline) {
      localStorage.setItem('bingoProgress', JSON.stringify(progress))
      return
    }

    try {
      const progressRef = this.database.ref(
        `games/${this.gameId}/players/${this.playerId}/progress`
      )
      await progressRef.set(progress)
    } catch (error) {
      console.error('Failed to save progress to database:', error)
      localStorage.setItem('bingoProgress', JSON.stringify(progress))
    }
  }

  async loadBingoCard() {
    if (this.isOffline) {
      return JSON.parse(localStorage.getItem('bingoCard'))
    }

    try {
      const cardRef = this.database.ref(
        `games/${this.gameId}/players/${this.playerId}/bingoCard`
      )
      const snapshot = await cardRef.once('value')
      return snapshot.val()
    } catch (error) {
      console.error('Failed to load from database, using localStorage:', error)
      return JSON.parse(localStorage.getItem('bingoCard'))
    }
  }

  async loadBingoProgress() {
    if (this.isOffline) {
      return JSON.parse(localStorage.getItem('bingoProgress') || '[]')
    }

    try {
      const progressRef = this.database.ref(
        `games/${this.gameId}/players/${this.playerId}/progress`
      )
      const snapshot = await progressRef.once('value')
      return snapshot.val() || []
    } catch (error) {
      console.error('Failed to load progress from database:', error)
      return JSON.parse(localStorage.getItem('bingoProgress') || '[]')
    }
  }

  async saveGameState(gameState) {
    if (this.isOffline) {
      localStorage.setItem('gameState', JSON.stringify(gameState))
      return
    }

    try {
      const stateRef = this.database.ref(
        `games/${this.gameId}/players/${this.playerId}/gameState`
      )
      await stateRef.set(gameState)
    } catch (error) {
      console.error('Failed to save game state to database:', error)
      localStorage.setItem('gameState', JSON.stringify(gameState))
    }
  }

  async loadGameState() {
    if (this.isOffline) {
      return JSON.parse(localStorage.getItem('gameState') || 'null')
    }

    try {
      const stateRef = this.database.ref(
        `games/${this.gameId}/players/${this.playerId}/gameState`
      )
      const snapshot = await stateRef.once('value')
      return snapshot.val()
    } catch (error) {
      console.error('Failed to load game state from database:', error)
      return JSON.parse(localStorage.getItem('gameState') || 'null')
    }
  }

  async saveBingoWin() {
    if (this.isOffline) {
      localStorage.setItem('bingoWinner', this.playerId)
      return
    }

    try {
      const winRef = this.database.ref(`games/${this.gameId}/winner`)
      await winRef.set({
        playerId: this.playerId,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      })
    } catch (error) {
      console.error('Failed to save bingo win to database:', error)
    }
  }

  setupListeners() {
    if (this.isOffline) return

    // Listen for other players' progress updates
    const gameRef = this.database.ref(`games/${this.gameId}/players`)
    gameRef.on('child_changed', (snapshot) => {
      const playerId = snapshot.key
      const playerData = snapshot.val()

      if (playerId !== this.playerId && this.callbacks.playerUpdate) {
        this.callbacks.playerUpdate(playerId, playerData)
      }
    })

    // Listen for new players joining
    gameRef.on('child_added', (snapshot) => {
      const playerId = snapshot.key
      const playerData = snapshot.val()

      if (playerId !== this.playerId && this.callbacks.playerJoined) {
        this.callbacks.playerJoined(playerId, playerData)
      }
    })
  }

  onPlayerUpdate(callback) {
    this.callbacks.playerUpdate = callback
  }

  onPlayerJoined(callback) {
    this.callbacks.playerJoined = callback
  }

  async getGamePlayers() {
    if (this.isOffline) {
      return {
        [this.playerId]: {
          joined: Date.now(),
          status: 'playing',
        },
      }
    }

    try {
      const playersRef = this.database.ref(`games/${this.gameId}/players`)
      const snapshot = await playersRef.once('value')
      return snapshot.val() || {}
    } catch (error) {
      console.error('Failed to get players:', error)
      return {}
    }
  }

  disconnect() {
    if (!this.isOffline && this.database) {
      const gameRef = this.database.ref(`games/${this.gameId}/players`)
      gameRef.off()
    }
  }
}

// Export for use in other files
window.BingoDatabase = BingoDatabase
