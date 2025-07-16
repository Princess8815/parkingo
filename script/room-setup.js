class RoomSetup {
  constructor() {
    this.database = null
    this.gameInfo = null
    this.initializeFirebaseAndDatabase()
  }

  async initializeFirebaseAndDatabase() {
    // Initialize Firebase
    if (typeof FirebaseManager !== 'undefined') {
      const firebaseManager = new FirebaseManager()
      await firebaseManager.initialize()
    }

    // Initialize database
    this.database = new BingoDatabase()
    await this.database.initializeFirebase()

    // Set up event listeners after database is ready
    this.initializeEventListeners()
  }

  initializeEventListeners() {
    document
      .getElementById('createGame')
      .addEventListener('click', () => this.createGame())
    document
      .getElementById('joinGame')
      .addEventListener('click', () => this.joinGame())
    document
      .getElementById('playSolo')
      .addEventListener('click', () => this.playSolo())
    document
      .getElementById('startGame')
      .addEventListener('click', () => this.startGame())
    document
      .getElementById('retryButton')
      .addEventListener('click', () => this.hideAllInfo())

    // Enter key support for game code input
    document.getElementById('gameCode').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.joinGame()
      }
    })

    // Set up database callbacks
    this.database.onPlayerJoined((playerId, playerData) => {
      this.updatePlayerCount()
    })
  }

  async createGame() {
    this.showLoading()

    try {
      const template = localStorage.getItem('selectedTemplate') || 'sfga2025'
      this.gameInfo = await this.database.createOrJoinGame()

      if (this.gameInfo.offline) {
        this.showError(
          'Running in offline mode. Multiplayer features not available.'
        )
        return
      }

      // Store game info
      localStorage.setItem('gameId', this.gameInfo.gameId)
      localStorage.setItem('playerId', this.gameInfo.playerId)
      localStorage.setItem('isHost', 'true')

      this.showGameInfo()
      this.updatePlayerCount()
    } catch (error) {
      this.showError('Failed to create game: ' + error.message)
    }
  }

  async joinGame() {
    const gameCode = document
      .getElementById('gameCode')
      .value.trim()
      .toUpperCase()

    if (!gameCode) {
      this.showError('Please enter a game code')
      return
    }

    this.showLoading()

    try {
      this.gameInfo = await this.database.createOrJoinGame(gameCode)

      if (this.gameInfo.offline) {
        this.showError('Cannot join game in offline mode')
        return
      }

      // Store game info
      localStorage.setItem('gameId', this.gameInfo.gameId)
      localStorage.setItem('playerId', this.gameInfo.playerId)
      localStorage.setItem('isHost', 'false')

      // Go directly to game page
      window.location.href = '/pages/game.html'
    } catch (error) {
      this.showError('Failed to join game: ' + error.message)
    }
  }

  playSolo() {
    // Clear any existing multiplayer data
    localStorage.removeItem('gameId')
    localStorage.removeItem('playerId')
    localStorage.removeItem('isHost')

    // Go to game page
    window.location.href = '/pages/game.html'
  }

  startGame() {
    window.location.href = '/pages/game.html'
  }

  async updatePlayerCount() {
    if (!this.gameInfo || this.gameInfo.offline) return

    try {
      const players = await this.database.getGamePlayers()
      const count = Object.keys(players).length
      document.getElementById('playerCount').textContent = count
    } catch (error) {
      console.error('Failed to update player count:', error)
    }
  }

  showGameInfo() {
    this.hideAllInfo()
    document.getElementById('gameInfo').style.display = 'block'
    document.getElementById('displayGameCode').textContent =
      this.gameInfo.gameId
  }

  showLoading() {
    this.hideAllInfo()
    document.getElementById('loadingInfo').style.display = 'block'
  }

  showError(message) {
    this.hideAllInfo()
    document.getElementById('errorMessage').textContent = message
    document.getElementById('errorInfo').style.display = 'block'
  }

  hideAllInfo() {
    document.getElementById('gameInfo').style.display = 'none'
    document.getElementById('loadingInfo').style.display = 'none'
    document.getElementById('errorInfo').style.display = 'none'
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  new RoomSetup()
})
