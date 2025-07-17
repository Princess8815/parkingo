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
  async createOrJoinGame(gameCode = null, playerNickname = null) {
    console.log('createOrJoinGame called with gameCode:', gameCode)
    console.log('Database offline status:', this.isOffline)

    if (this.isOffline) {
      console.log('Database is offline, returning offline mode')
      return this.handleOfflineMode()
    }

    try {
      if (!gameCode) {
        // Create new game
        console.log('Creating new game')
        this.gameId = this.generateGameCode()
        console.log('Generated game code:', this.gameId)
        const gameRef = this.database.ref(`games/${this.gameId}`)

        await gameRef.set({
          created: firebase.database.ServerValue.TIMESTAMP,
          players: {},
          status: 'waiting', // waiting, ready, playing, finished
          hostId: null,
          playerAssignments: {}, // who tracks whom
          gameSettings: {
            minPlayers: 2,
            maxPlayers: 6,
          },
        })
        console.log('New game created successfully')
      } else {
        // Join existing game
        console.log('Attempting to join existing game:', gameCode)
        this.gameId = gameCode.toUpperCase() // Ensure uppercase
        const gameRef = this.database.ref(`games/${this.gameId}`)
        console.log('Checking if game exists...')
        const snapshot = await gameRef.once('value')

        if (!snapshot.exists()) {
          console.log('Game not found:', gameCode)
          throw new Error(
            `Game "${gameCode}" not found. Please check the game code.`
          )
        }
        console.log('Game found, proceeding to join')
      }

      this.playerId = this.generatePlayerId()
      console.log('Generated player ID:', this.playerId)

      // Set host if this is a new game
      if (!gameCode) {
        const gameRef = this.database.ref(`games/${this.gameId}`)
        await gameRef.child('hostId').set(this.playerId)
        console.log('Set as game host')
      }

      await this.addPlayerToGame(playerNickname)
      console.log('Player added to game')
      this.setupListeners()
      console.log('Listeners set up')

      const result = {
        gameId: this.gameId,
        playerId: this.playerId,
      }
      console.log('Returning game info:', result)
      return result
    } catch (error) {
      console.error('Database error, falling back to offline mode:', error)
      return this.handleOfflineMode()
    }
  }

  // Test Firebase connectivity
  async testFirebaseConnection() {
    if (this.isOffline) {
      console.log('Database is offline')
      return false
    }

    try {
      console.log('Testing Firebase connection...')
      const testRef = this.database.ref('test')
      await testRef.set({
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        test: 'connection',
      })
      console.log('Firebase write test successful')

      const snapshot = await testRef.once('value')
      console.log('Firebase read test successful:', snapshot.val())

      // Clean up test data
      await testRef.remove()
      console.log('Firebase connection test completed successfully')
      return true
    } catch (error) {
      console.error('Firebase connection test failed:', error)
      return false
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

  async addPlayerToGame(customNickname = null) {
    if (this.isOffline) {
      console.log('Cannot add player - database is offline')
      return
    }

    console.log(`Adding player ${this.playerId} to game ${this.gameId}`)
    const playerRef = this.database.ref(
      `games/${this.gameId}/players/${this.playerId}`
    )

    // Use custom nickname if provided, otherwise generate random one
    const nickname =
      customNickname || `Player ${Math.floor(Math.random() * 1000)}`

    try {
      await playerRef.set({
        joined: firebase.database.ServerValue.TIMESTAMP,
        bingoCard: null,
        progress: [],
        status: 'joined', // joined, ready, playing
        nickname: nickname,
      })
      console.log('Player successfully added to game')
    } catch (error) {
      console.error('Error adding player to game:', error)
      throw error
    }
  }

  // Get current game state and player list
  async getGameState() {
    if (this.isOffline) return null

    try {
      const gameRef = this.database.ref(`games/${this.gameId}`)
      const snapshot = await gameRef.once('value')
      return snapshot.val()
    } catch (error) {
      console.error('Error getting game state:', error)
      return null
    }
  }

  // Start the game (host only) - assign players and generate cards
  async startGame() {
    if (this.isOffline) return false

    try {
      const gameState = await this.getGameState()
      if (!gameState) throw new Error('Game not found')

      const players = Object.keys(gameState.players || {})
      if (players.length < 2) {
        throw new Error('Need at least 2 players to start')
      }

      // Create player assignments (each player tracks the next player's card)
      const assignments = {}
      for (let i = 0; i < players.length; i++) {
        const currentPlayer = players[i]
        const targetPlayer = players[(i + 1) % players.length] // Next player, wrapping around
        assignments[currentPlayer] = targetPlayer
      }

      // Generate bingo cards for each player
      const playerCards = {}
      players.forEach((playerId) => {
        playerCards[playerId] = this.generateBingoCard()
      })

      // Update game state
      const gameRef = this.database.ref(`games/${this.gameId}`)
      await gameRef.update({
        status: 'playing',
        playerAssignments: assignments,
        playerCards: playerCards,
        gameStarted: firebase.database.ServerValue.TIMESTAMP,
      })

      console.log('Game started successfully')
      console.log('Player assignments:', assignments)
      return true
    } catch (error) {
      console.error('Error starting game:', error)
      return false
    }
  }

  // Get the card this player should be tracking
  async getMyTrackingCard() {
    if (this.isOffline) return null

    try {
      const gameState = await this.getGameState()
      console.log('=== GET MY TRACKING CARD ===')
      console.log('Game state:', gameState)

      if (
        !gameState ||
        !gameState.playerAssignments ||
        !gameState.playerCards
      ) {
        console.log('Missing game state, assignments, or cards')
        return null
      }

      const targetPlayerId = gameState.playerAssignments[this.playerId]
      console.log('Current player ID:', this.playerId)
      console.log('Target player ID:', targetPlayerId)
      console.log('Players in game:', gameState.players)

      if (!targetPlayerId) return null

      const targetNickname =
        gameState.players[targetPlayerId]?.nickname || 'Unknown Player'
      console.log('Target nickname found:', targetNickname)

      return {
        targetPlayerId,
        bingoCard: gameState.playerCards[targetPlayerId],
        targetNickname: targetNickname,
      }
    } catch (error) {
      console.error('Error getting tracking card:', error)
      return null
    }
  }

  // Generate a bingo card (moved from 6-flags.js)
  generateBingoCard() {
    // Import the data from the main file
    const possibleCoasters = window.possibleCoasters || []
    const possibleFlatAndWaterRides = window.possibleFlatAndWaterRides || []
    const possibleChallenges = window.possibleChallenges
      ? window.possibleChallenges.filter((c) => !c.includes('You suck'))
      : []

    // Ensure we have exactly 5 coasters, 10 flat rides, 10 challenges
    const shuffledCoasters = [...possibleCoasters].sort(
      () => Math.random() - 0.5
    )
    const shuffledFlat = [...possibleFlatAndWaterRides].sort(
      () => Math.random() - 0.5
    )
    const shuffledChallenges = [...possibleChallenges].sort(
      () => Math.random() - 0.5
    )

    // Take exactly the required amounts
    const selectedCoasters = shuffledCoasters.slice(0, 5)
    const selectedFlat = shuffledFlat.slice(0, 10)
    const selectedChallenges = shuffledChallenges.slice(0, 10)

    // Combine and shuffle all 25 items
    const allItems = [
      ...selectedCoasters,
      ...selectedFlat,
      ...selectedChallenges,
    ]
    const shuffledItems = allItems.sort(() => Math.random() - 0.5)

    // Create 5x5 card array
    const bingoCard = []
    for (let row = 0; row < 5; row++) {
      bingoCard[row] = []
      for (let col = 0; col < 5; col++) {
        const index = row * 5 + col
        bingoCard[row][col] = shuffledItems[index]
      }
    }

    // Mark center as free space
    bingoCard[2][2] = 'FREE SPACE'

    console.log('Generated card with:', {
      coasters: selectedCoasters.length,
      flatRides: selectedFlat.length,
      challenges: selectedChallenges.length,
    })

    return bingoCard
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

  // Group ride management
  async announceGroupRide(rideName) {
    if (this.isOffline) return

    try {
      const rideRef = this.database.ref(`games/${this.gameId}/currentRide`)
      await rideRef.set({
        rideName: rideName,
        announcedBy: this.playerId,
        announcerNickname: this.nickname || 'Unknown Player',
        announcedAt: firebase.database.ServerValue.TIMESTAMP,
        participants: {},
      })
      console.log('Group ride announced:', rideName)
    } catch (error) {
      console.error('Error announcing group ride:', error)
    }
  }

  async joinGroupRide() {
    if (this.isOffline) return

    try {
      const participantRef = this.database.ref(
        `games/${this.gameId}/currentRide/participants/${this.playerId}`
      )
      await participantRef.set({
        joined: firebase.database.ServerValue.TIMESTAMP,
        nickname: this.nickname || 'Anonymous',
      })
      console.log('Joined group ride')
    } catch (error) {
      console.error('Error joining group ride:', error)
    }
  }

  setupListeners() {
    if (this.isOffline) return

    // Listen for game state changes
    const gameRef = this.database.ref(`games/${this.gameId}`)
    gameRef.on('value', (snapshot) => {
      const gameData = snapshot.val()
      if (gameData && this.callbacks.gameStateChanged) {
        this.callbacks.gameStateChanged(gameData)
      }
    })

    // Listen for other players' progress updates
    const playersRef = this.database.ref(`games/${this.gameId}/players`)
    playersRef.on('child_changed', (snapshot) => {
      const playerId = snapshot.key
      const playerData = snapshot.val()

      if (playerId !== this.playerId && this.callbacks.playerUpdate) {
        this.callbacks.playerUpdate(playerId, playerData)
      }
    })

    // Listen for new players joining
    playersRef.on('child_added', (snapshot) => {
      const playerId = snapshot.key
      const playerData = snapshot.val()

      if (playerId !== this.playerId && this.callbacks.playerJoined) {
        this.callbacks.playerJoined(playerId, playerData)
      }
    })

    // Listen for players leaving
    playersRef.on('child_removed', (snapshot) => {
      const playerId = snapshot.key
      if (this.callbacks.playerLeft) {
        this.callbacks.playerLeft(playerId)
      }
    })

    // Listen for group ride announcements
    const currentRideRef = this.database.ref(`games/${this.gameId}/currentRide`)
    currentRideRef.on('value', (snapshot) => {
      const rideData = snapshot.val()
      if (rideData && this.callbacks.groupRideAnnounced) {
        this.callbacks.groupRideAnnounced(rideData)
      }
    })

    // Listen for group ride participation changes
    const participantsRef = this.database.ref(
      `games/${this.gameId}/currentRide/participants`
    )
    participantsRef.on('value', (snapshot) => {
      const participants = snapshot.val()
      if (participants && this.callbacks.groupRideParticipationChanged) {
        this.callbacks.groupRideParticipationChanged(participants)
      }
    })
  }

  onGameStateChanged(callback) {
    this.callbacks.gameStateChanged = callback
  }

  onPlayerUpdate(callback) {
    this.callbacks.playerUpdate = callback
  }

  onPlayerJoined(callback) {
    this.callbacks.playerJoined = callback
  }

  onPlayerLeft(callback) {
    this.callbacks.playerLeft = callback
  }

  onGroupRideAnnounced(callback) {
    this.callbacks.groupRideAnnounced = callback
  }

  onGroupRideParticipationChanged(callback) {
    this.callbacks.groupRideParticipationChanged = callback
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
