// Initialize database connection
let bingoDatabase = null
let gameModeSelected = false // Track if game mode has been selected

if (typeof BingoDatabase !== 'undefined') {
  bingoDatabase = new BingoDatabase()

  // If we have game info from room setup, connect to that game
  const gameId = localStorage.getItem('gameId')
  const playerId = localStorage.getItem('playerId')

  if (gameId && playerId) {
    bingoDatabase.gameId = gameId
    bingoDatabase.playerId = playerId
    bingoDatabase.setupListeners()
  }
}

// Initialize the game
function initializeBingoGame(database) {
  if (database) {
    bingoDatabase = database
    console.log('Game initialized with database support')

    // Set up multiplayer listeners
    bingoDatabase.onGameStateChanged((gameData) => {
      console.log('Game state changed:', gameData)

      if (gameData.status === 'playing' && gameData.playerCards) {
        // Game has started, load tracking card
        loadMultiplayerCard()
      } else if (gameData.status === 'waiting') {
        // Show waiting room and update player list
        showWaitingForGame()
      }
    })

    bingoDatabase.onPlayerJoined((playerId, playerData) => {
      console.log('Player joined:', playerId, playerData)
      updatePlayerList()
    })

    bingoDatabase.onPlayerLeft((playerId) => {
      console.log('Player left:', playerId)
      updatePlayerList()
    })

    bingoDatabase.onGroupRideAnnounced((rideData) => {
      console.log('Group ride announced:', rideData)
      handleGroupRideAnnouncement(rideData)
    })

    bingoDatabase.onGroupRideParticipationChanged((participants) => {
      console.log('Group ride participation changed:', participants)
      handleGroupRideParticipationChange(participants)
    })

    // For multiplayer, start with waiting room
    initializeDecks()

    // Always start by showing the waiting room for multiplayer
    showWaitingForGame()
  } else {
    console.log('Game initialized in offline mode')

    // Solo mode - generate card immediately
    let savedCard = JSON.parse(localStorage.getItem('bingoCard'))
    if (savedCard) {
      console.log('Bingo card loaded from localStorage.')
      populateBingoGrid(savedCard)
    } else {
      console.log('Generating new bingo card...')
      const newCard = generateBingoCard()
      populateBingoGrid(newCard)
    }

    initializeDecks()
    loadBingoProgress()
    populateRidesList()
  }
}

// Load multiplayer tracking card
async function loadMultiplayerCard() {
  if (!bingoDatabase || bingoDatabase.isOffline) return

  try {
    const trackingInfo = await bingoDatabase.getMyTrackingCard()
    if (trackingInfo && trackingInfo.bingoCard) {
      console.log(`You are tracking ${trackingInfo.targetNickname}'s card`)

      // Hide waiting room and show complete game UI
      document.getElementById('bingoCardContainer').innerHTML = `
        <div class="bingo-header">
          <div class="header-cell"></div>
          <!-- Blank upper left corner -->
          <div class="header-cell">B</div>
          <div class="header-cell">I</div>
          <div class="header-cell">N</div>
          <div class="header-cell">G</div>
          <div class="header-cell">O</div>
        </div>
        <div class="bingo-grid" id="bingoGrid">
          <!-- Grid items will be populated by JavaScript -->
        </div>
        <div class="card-buttons">
          <button class="card-button perks" onclick="showPerks()">
            View Perks
          </button>
          <button class="card-button challenges" onclick="showChallenges()">
            View Challenges
          </button>
          <button class="card-button punishments" onclick="showPunishments()">
            View Punishments
          </button>
          <button class="card-button hand" onclick="showHand()">
            Current Hand
          </button>
          <button class="new-card-button" onclick="generateNewCard()" style="display: none;">
            New Card
          </button>
          <button class="end-game-button" onclick="endGame()">End Game</button>
        </div>

        <!-- Deck Management Section -->
        <div class="deck-management">
          <!-- Group Ride Selection -->
          <div class="group-ride-selection" id="groupRideSelection">
            <h3>🎢 Group Ride Selection</h3>
            <p>Choose a ride for the entire group:</p>
            <input 
              type="text" 
              id="selectedRide" 
              placeholder="Enter ride name (e.g., 'Goliath')" 
              list="ridesList"
            />
            <datalist id="ridesList">
              <!-- Will be populated by JavaScript -->
            </datalist>
            <div class="ride-buttons">
              <button class="ride-button" onclick="announceGroupRide()">
                📢 Announce Ride to Group
              </button>
              <button class="ride-button" onclick="confirmRiderParticipation()">
                ✅ I Rode This Ride
              </button>
            </div>
            <div id="currentGroupRide" style="display: none;">
              <strong>Current Group Ride:</strong> <span id="groupRideText">None</span>
              <button onclick="completeGroupRide()" class="complete-ride-btn">Complete Ride</button>
            </div>
          </div>

          <div class="current-challenge" id="currentChallenge">
            <strong>Current Challenge:</strong>
            <span id="challengeText">None</span>
          </div>

          <div class="deck-buttons">
            <button
              class="deck-button"
              id="drawChallengeBtn"
              onclick="drawChallengeCard()"
            >
              Draw Challenge Card
            </button>
            <button
              class="deck-button"
              id="drawPerkBtn"
              onclick="drawPerkCard()"
              disabled
            >
              Draw Perk Card
            </button>
            <button
              class="deck-button"
              id="completeChallengeBtn"
              onclick="completeChallenge()"
              disabled
            >
              Complete Challenge
            </button>
            <button
              class="deck-button"
              id="markRideBtn"
              onclick="markRideCompleted()"
            >
              Mark Ride (or tap squares)
            </button>
          </div>

          <div class="challenge-display" id="challengeDisplay"></div>
          <div class="perk-display" id="perkDisplay"></div>

          <div class="card-counter">
            Challenge Cards Left: <span id="challengeCount">0</span> | Perk
            Cards Left: <span id="perkCount">0</span>
          </div>
        </div>
      `

      // Store the card data globally for game functions
      currentCard = trackingInfo.bingoCard
      trackingTarget = trackingInfo.targetNickname

      // Populate the card and initialize game state
      populateBingoGrid(trackingInfo.bingoCard)
      loadBingoProgress()
      updateCardCounters()

      // Initialize group ride system
      console.log('About to populate rides list...')
      populateRidesList()

      // Verify the group ride selection is visible
      const groupRideElement = document.getElementById('groupRideSelection')
      console.log(
        'Group ride selection element after populate:',
        groupRideElement
      )
      if (groupRideElement) {
        console.log(
          'Group ride selection visibility:',
          window.getComputedStyle(groupRideElement).display
        )
      }

      // Update UI to show whose card we're tracking
      updateTrackingStatus(trackingInfo.targetNickname)

      // Show the game container
      document.getElementById('bingoCardContainer').style.display = 'block'
    } else {
      console.log('No tracking card available yet, staying in waiting room')
      // Stay in waiting room
    }
  } catch (error) {
    console.error('Error loading multiplayer card:', error)
  }
}

// Show waiting screen
function showWaitingForGame() {
  const container = document.getElementById('bingoCardContainer')
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <h2>Waiting for Game to Start...</h2>
        <p>The host will start the game when all players have joined.</p>
        <div id="playerList" style="margin: 20px 0;"></div>
        <div id="hostControls" style="display: none;">
          <button onclick="startMultiplayerGame()" style="padding: 10px 20px; font-size: 16px;">
            Start Game
          </button>
        </div>
      </div>
    `

    // Update player list
    updatePlayerList()
  }
}

// Update tracking status in UI
function updateTrackingStatus(targetNickname) {
  const statusElement = document.getElementById('connectionStatus')
  if (statusElement) {
    statusElement.textContent = `Tracking: ${targetNickname}'s Card`
  }
}

// Update player list in waiting room
async function updatePlayerList() {
  if (!bingoDatabase || bingoDatabase.isOffline) return

  try {
    const gameState = await bingoDatabase.getGameState()
    if (!gameState) return

    const playerListElement = document.getElementById('playerList')
    const hostControlsElement = document.getElementById('hostControls')

    if (playerListElement) {
      const players = Object.entries(gameState.players || {})
      const playerCount = players.length

      let html = `<h3>Players (${playerCount}):</h3><ul>`
      players.forEach(([playerId, playerData]) => {
        const isHost = playerId === gameState.hostId
        const hostLabel = isHost ? ' (Host)' : ''
        html += `<li>${playerData.nickname || 'Unknown'}${hostLabel}</li>`
      })
      html += '</ul>'

      if (playerCount >= 2) {
        html += '<p style="color: green;">✓ Ready to start!</p>'
      } else {
        html += '<p style="color: orange;">Need at least 2 players to start</p>'
      }

      playerListElement.innerHTML = html
    }

    // Show host controls if this player is the host
    if (hostControlsElement && gameState.hostId === bingoDatabase.playerId) {
      hostControlsElement.style.display = 'block'
    }
  } catch (error) {
    console.error('Error updating player list:', error)
  }
}

// Auto-initialize if called directly (for backward compatibility)
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Only show game mode selection if not already selected
      if (!gameModeSelected) {
        showGameModeSelection()
      }
    })
  } else {
    // Only show game mode selection if not already selected
    if (!gameModeSelected) {
      showGameModeSelection()
    }
  }
}

const possibleCoasters = [
  'American Eagle',
  'Batman: The Ride',
  'Demon',
  'Goliath',
  'Joker',
  'Little Dipper',
  'Maxx Force',
  'Raging Bull',
  'The Dark Knight Coaster',
  'Vertical Velocity (The Flash retheme)',
  'Whizzer',
  'X-Flight',
  'Spacely’s Sprocket Rockets',
  'Superman: Ultimate Flight',
  'Mardi Gras Hangover',
  'Joker Free Fly',
  'Wrath of Rakshasa (2025)',
]

const possibleFlatAndWaterRides = [
  'Giant Drop',
  'Hometown Fun Machine',
  'Revolution',
  'Sky Trek Tower',
  'Condor',
  'East River Crawler',
  'Fiddler’s Fling',
  'Mardi Gras Hangover', // if counted as flat ride instead of coaster
  'Big Easy Balloons',
  'Krazy Kars',
  'Rue Le Dodge (bumper cars)',
  'Chubasco (teacups)',
  'Buccaneer Battle (water interactive ride)',
  'Logger’s Run (log flume)',
  'Yankee Clipper (flume ride)',
  'Roaring Rapids (rapids ride)',
  'Scenic Railway (train ride around park)',
  'Triple Play',
  'The Lobster',
  'Castaway Creek (Lazy River)',
  'Bahama Mama & Bubba Tubba (Family raft slides)',
  'Paradise Plunge & Riptide (Dual speed raft slides)',
  'Skull Island & Buccaneer Bay (Interactive group splash zone with slides)',
  'Hammerhead & Barracuda (Dual raft slide complex)',
  'Vortex & Typhoon (Twin bowl rafting slides)',
  'Tornado (Giant funnel raft ride)',
  'Surf Rider (Stand-up/sit-down surf simulator)',
  'Wahoo Racer (Six-lane mat/raft racer)',
  'Wipeout (Double-funnel raft slide)',
  'Tsunami Surge (Water coaster – uphill blasts + drops)',
  'Hurricane Bay (Wave pool)',
  'Monsoon Lagoon (Interactive wave/tidal pool)',
]

const possibleChallenges = [
  'Find a food stand that sells churros or funnel cake (no purchase needed)',
  'Take a selfie with a costumed character or statue',
  'Find someone wearing a coaster shirt and compliment them',
  'Find a map sign and point at it like you’re lost',
  'Get sprayed by a mist fan or cooling station',
  'Find a sign with your birth month on it',
  'Locate a pressed penny machine (no need to buy)',
  'High five any staff member',
  'Spot someone with a matching shirt color to you',
  'Take a group photo in front of the park entrance sign',
  'Spot a ride mechanic walking to or from a ride',
  'Sit and relax for 5 minutes without checking your phone',
  'Compliment a stranger’s outfit or hair',
  'Find and photograph something purple in the park',
  'Spot someone wearing Mickey or Disney apparel',
  'Get a stranger to take a picture of you',
  'Count how many people are wearing sunglasses in line (choose a line)',
  'Wave dramatically to people on a ride while you’re on the ground',
  'Take a photo imitating a ride photo pose while standing in line',
  'Find a duck, squirrel, or bird in the park',
  'Spot someone wearing socks with sandals',
  'Wave to a staff member and get them to wave back',
  'Compliment a food stand worker',
  'Find a hidden or overlooked bench to sit on for a minute',
  'Spot a ride with no line (even if you don’t ride it)',
  'Find and read a safety sign aloud in a dramatic voice',
  'You suck draw a punishment card now',
  'You suck draw a punishment card now',
  'You suck draw a punishment card now',
  'You suck draw a punishment card now',
  'You suck draw a punishment card now',
]

// Make arrays globally available for database module
window.possibleCoasters = possibleCoasters
window.possibleFlatAndWaterRides = possibleFlatAndWaterRides
window.possibleChallenges = possibleChallenges

const possiblePerks = [
  {
    name: 'Draw a Challenge Card',
    description:
      'Immediately draw an extra challenge card. If already holding one, choose which to keep.',
    quantity: 5,
  },
  {
    name: 'Steal and Complete a Player’s Next Challenge Card',
    description:
      'Choose a player. You take their next drawn challenge and complete it as your own.',
    quantity: 2,
  },
  {
    name: 'Pick Any Challenge to Complete',
    description:
      'Announce any challenge by name. If it’s on your card, it’s marked complete.',
    quantity: 1,
  },
  {
    name: 'Reveal a Space on Your Bingo Card',
    description:
      'Choose B/I/N/G/O and 1-5. Your tracker reveals if that space is marked and what it is.',
    quantity: 5,
  },
  {
    name: 'Force a 5 Minute Timeout for All Other Players',
    description:
      'All other players must sit/rest for 5 minutes while you proceed to your next ride.',
    quantity: 2,
  },
  {
    name: 'Ride Wrath of Rakshasa for 2 Challenge and 2 Perk Cards',
    description:
      'If you ride Wrath of Rakshasa, draw two Challenge and two Perk Cards instead of one each.',
    quantity: 1,
  },
  {
    name: 'For Next 3 Rides, Any Ride Yields a Perk Card',
    description:
      'For the next 3 rides by any player, all riders draw a Perk Card. Stacks if multiple copies are played.',
    quantity: 1,
  },
  {
    name: 'Collect 5 for Auto Win',
    description:
      'If you collect 5 of these cards, you may immediately declare victory regardless of your bingo progress.',
    quantity: 5,
  },
  {
    name: 'Force a Player to Discard All Perk Cards',
    description:
      'Choose a player; they must discard all perk cards they currently hold. Play immediately upon drawing.',
    quantity: 10,
  },
  {
    name: 'Transfer Your Punishment to Another Player',
    description:
      'If you draw a punishment challenge, you may transfer it to another player.',
    quantity: 5,
  },
]

const possiblePunishments = [
  'Find 5 people wearing red',
  'Make ride sounds only for 5 minutes',
  "Ask a stranger 'What year is it?'",
  "Get into a line, wait a little, then announce loudly 'I’m too scared for this ride!' and leave.",
  'Get a person to record you for 1 minute doing something weird',
  'Give a stranger one of the blank cards (these are included with the decks)',
  'Sit on a bench next to a stranger and start the Forrest Gump monologue',
  "On your next ride, once it starts, yell 'Mommy, hold me!' even if your mom isn’t there.",
  'Do the sideways crab walk for the next 5 minutes',
  'Skip (literally skip) instead of walk for the next 5 minutes',
  'You’re dehydrated – drink water now',
  'You’re dehydrated – drink water now',
  'You’re dehydrated – drink water now',
  'You’re dehydrated – drink water now',
  'You’re dehydrated – drink water now',
  'Mimic a stranger. If they ask what you’re doing, show them this card',
  'Ride a little kiddie ride that you’re allowed to ride',
  'Speak in a British accent for the next 5 minutes',
  'Hug a trash can (gently, don’t knock it over)',
  'Walk backwards for 3 minutes',
  'Compliment every stranger you pass for the next 5 minutes',
  'Pretend to narrate everything you see like a nature documentary for 5 minutes',
  'Dance in place for 1 minute wherever you are',
  "Ask a staff member where the 'portal to Narnia' is",
  "Walk up to a stranger, point dramatically at something random, and say 'Behold… the prophecy is true.'",
  'Pretend to be a robot for the next 3 minutes',
  'Make your arms airplane wings and hold them out for 3 minutes',
  'Do 10 squats right where you stand',
  'Walk like a zombie for 2 minutes',
  "Sniff the air dramatically and say 'I smell adventure!'",
  "Say 'meow' at the end of every sentence for 5 minutes",
  "Ask a stranger if they’ve 'seen the dragon' today",
  'Stomp your feet like a dinosaur for 1 minute',
  'Try to high five every person you walk past for 3 minutes',
]

const discard = []

// Game state management
let gameState = {
  currentChallenge: null,
  currentPerkCards: [],
  challengeDeck: [],
  perkDeck: [],
  punishmentDeck: [],
  hasCompletedRide: false,
  canDrawChallengeCards: false,
  canDrawPerkCards: false,
}

// Initialize game decks
function initializeDecks() {
  // Create challenge deck (combine challenges and punishments)
  gameState.challengeDeck = [...possibleChallenges]

  // Create perk deck
  gameState.perkDeck = []
  possiblePerks.forEach((perk) => {
    for (let i = 0; i < perk.quantity; i++) {
      gameState.perkDeck.push(perk)
    }
  })

  // Create punishment deck
  gameState.punishmentDeck = [...possiblePunishments]

  // Shuffle all decks
  gameState.challengeDeck = shuffle(gameState.challengeDeck, 'challengeDeck')
  gameState.perkDeck = shuffle(gameState.perkDeck, 'perkDeck')
  gameState.punishmentDeck = shuffle(gameState.punishmentDeck, 'punishmentDeck')

  // Update UI counters
  updateCardCounters()

  // Load saved game state
  loadGameState()
}

function updateCardCounters() {
  document.getElementById('challengeCount').textContent =
    gameState.challengeDeck.length
  document.getElementById('perkCount').textContent = gameState.perkDeck.length
}

function saveGameState() {
  localStorage.setItem('gameState', JSON.stringify(gameState))

  // Save to database if available
  if (window.gameDatabase && !window.gameDatabase.isOffline) {
    window.gameDatabase.saveGameState(gameState)
  }
}

function loadGameState() {
  const saved = localStorage.getItem('gameState')
  if (saved) {
    const loadedState = JSON.parse(saved)
    gameState = { ...gameState, ...loadedState }
    updateGameUI()
  }
}

function updateGameUI() {
  // Update current challenge display
  if (gameState.currentChallenge) {
    document.getElementById('currentChallenge').style.display = 'block'
    document.getElementById('challengeText').textContent =
      gameState.currentChallenge
    document.getElementById('completeChallengeBtn').disabled = false
    document.getElementById('drawChallengeBtn').disabled = true
  } else {
    document.getElementById('currentChallenge').style.display = 'none'
    document.getElementById('completeChallengeBtn').disabled = true
    document.getElementById('drawChallengeBtn').disabled =
      !gameState.canDrawChallengeCards
  }

  // Update perk draw button
  document.getElementById('drawPerkBtn').disabled = !gameState.canDrawPerkCards

  updateCardCounters()
}

// Card drawing functions
function drawChallengeCard() {
  if (gameState.currentChallenge) {
    alert(
      'You already have a challenge! Complete it first before drawing a new one.'
    )
    return
  }

  if (!gameState.canDrawChallengeCards) {
    alert('You must complete a ride first before drawing cards!')
    return
  }

  if (gameState.challengeDeck.length === 0) {
    alert('No more challenge cards left!')
    return
  }

  const drawnCard = gameState.challengeDeck.pop()

  // Check if it's a punishment (contains "You suck")
  if (drawnCard.includes('You suck')) {
    // Draw a punishment card instead
    if (gameState.punishmentDeck.length > 0) {
      const punishment = gameState.punishmentDeck.pop()
      displayCard('punishment', punishment, true)
    } else {
      alert('No punishment cards left! Skip this draw.')
    }
  } else {
    gameState.currentChallenge = drawnCard
    displayCard('challenge', drawnCard)
  }

  // Only disable challenge card drawing, not perk cards
  gameState.canDrawChallengeCards = false
  saveGameState()
  updateGameUI()
}

function drawPerkCard() {
  if (!gameState.canDrawPerkCards) {
    alert('You can only draw perk cards after completing a roller coaster!')
    return
  }

  if (gameState.perkDeck.length === 0) {
    alert('No more perk cards left!')
    return
  }

  const drawnPerk = gameState.perkDeck.pop()
  gameState.currentPerkCards.push(drawnPerk)
  displayCard('perk', `${drawnPerk.name}: ${drawnPerk.description}`)

  // Perk cards can be drawn multiple times after use
  // Don't disable perk drawing after use
  saveGameState()
  updateGameUI()
}

function displayCard(type, text, isImmediate = false) {
  const displayElement = document.getElementById(
    type === 'perk' ? 'perkDisplay' : 'challengeDisplay'
  )
  displayElement.textContent = text
  displayElement.style.display = 'block'

  if (isImmediate) {
    alert(`PUNISHMENT CARD (Complete Immediately): ${text}`)
  }

  // Hide after 5 seconds
  setTimeout(() => {
    displayElement.style.display = 'none'
  }, 5000)
}

function completeChallenge() {
  if (!gameState.currentChallenge) {
    alert('No current challenge to complete!')
    return
  }

  const challenge = gameState.currentChallenge

  // Check if this challenge exists on the tracking card (multiplayer) or own card (solo)
  let bingoCard
  if (currentCard) {
    // Multiplayer mode - use tracking card
    bingoCard = currentCard
  } else {
    // Solo mode - use localStorage
    bingoCard = JSON.parse(localStorage.getItem('bingoCard'))
  }

  let found = false

  if (bingoCard) {
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        // More flexible matching - check if challenge name matches or is contained in the square
        const squareText = bingoCard[row][col]
        if (
          squareText &&
          (squareText.toLowerCase() === challenge.toLowerCase() ||
            squareText.toLowerCase().includes(challenge.toLowerCase()) ||
            challenge.toLowerCase().includes(squareText.toLowerCase()))
        ) {
          // Mark this cell as completed
          const cell = document.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
          )
          if (cell && !cell.classList.contains('marked')) {
            cell.classList.add('marked')
            found = true
            alert(`✅ Challenge completed and marked: ${squareText}`)
            break
          } else if (cell) {
            found = true
            alert(
              `✅ Challenge completed! (Square was already marked: ${squareText})`
            )
            break
          }
        }
      }
      if (found) break
    }
  }

  if (!found) {
    alert(
      `✅ Challenge completed: ${challenge}\nHowever, this challenge doesn't match any square on the tracked card, so no square was marked.`
    )
  }

  // Clear current challenge
  gameState.currentChallenge = null
  saveGameState()
  saveBingoProgress()
  updateGameUI()

  // Check for bingo
  checkForBingo()
}

function markRideCompleted() {
  const rideName = prompt(
    'Enter the name of the ride you completed (or just tap the bingo square directly):'
  )
  if (!rideName) return

  // Check if it's a coaster first
  const isCoaster = possibleCoasters.some(
    (coaster) => coaster.toLowerCase() === rideName.toLowerCase()
  )

  console.log(`Ride "${rideName}" is coaster: ${isCoaster}`) // Debug log

  // Mark ride on bingo card if it exists
  const bingoCard = JSON.parse(localStorage.getItem('bingoCard'))
  let found = false
  let alreadyMarked = false

  if (bingoCard) {
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (bingoCard[row][col].toLowerCase() === rideName.toLowerCase()) {
          const cell = document.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
          )
          if (cell) {
            found = true
            alreadyMarked = cell.classList.contains('marked')

            // Mark the cell if not already marked
            if (!alreadyMarked) {
              cell.classList.add('marked')
            }
            break
          }
        }
      }
      if (found) break
    }
  }

  // Provide appropriate feedback
  if (found) {
    if (alreadyMarked) {
      alert(`Ride "${rideName}" was already completed on your bingo card!`)
    } else {
      alert(`Ride "${rideName}" marked on your bingo card!`)
    }
  } else {
    alert(
      `Ride "${rideName}" is not on your bingo card, but you can still draw cards.`
    )
  }

  // Enable card drawing regardless of whether ride was on card
  gameState.canDrawChallengeCards = true

  // Set hasCompletedRide if it's actually a coaster
  if (isCoaster) {
    gameState.hasCompletedRide = true
    gameState.canDrawPerkCards = true
    console.log('Set hasCompletedRide to true') // Debug log
    alert(
      'You completed a roller coaster! You can now draw both challenge and perk cards.'
    )
  } else {
    console.log(
      'Not a coaster, hasCompletedRide remains:',
      gameState.hasCompletedRide
    ) // Debug log
    alert('Ride completed! You can now draw a challenge card.')
  }

  console.log('Game state after ride completion:', gameState) // Debug log

  saveGameState()
  saveBingoProgress()
  updateGameUI()

  // Check for bingo
  checkForBingo()
}

function checkForBingo() {
  const markedCells = document.querySelectorAll('.bingo-square.marked')
  const markedPositions = Array.from(markedCells).map((cell) => ({
    row: parseInt(cell.dataset.row),
    col: parseInt(cell.dataset.col),
  }))

  // Check rows
  for (let row = 0; row < 5; row++) {
    let count = 0
    for (let col = 0; col < 5; col++) {
      if (markedPositions.some((pos) => pos.row === row && pos.col === col)) {
        count++
      }
    }
    if (count === 5) {
      showBingoAlert()
      return
    }
  }

  // Check columns
  for (let col = 0; col < 5; col++) {
    let count = 0
    for (let row = 0; row < 5; row++) {
      if (markedPositions.some((pos) => pos.row === row && pos.col === col)) {
        count++
      }
    }
    if (count === 5) {
      showBingoAlert()
      return
    }
  }

  // Check diagonals
  let diag1 = 0,
    diag2 = 0
  for (let i = 0; i < 5; i++) {
    if (markedPositions.some((pos) => pos.row === i && pos.col === i)) {
      diag1++
    }
    if (markedPositions.some((pos) => pos.row === i && pos.col === 4 - i)) {
      diag2++
    }
  }

  if (diag1 === 5 || diag2 === 5) {
    showBingoAlert()
  }
}

function showBingoAlert() {
  document.getElementById('bingoAlert').style.display = 'block'

  // Save bingo achievement
  localStorage.setItem('bingoAchieved', 'true')

  // Notify database if available
  if (window.gameDatabase && !window.gameDatabase.isOffline) {
    window.gameDatabase.saveBingoWin()
  }
}

function closeBingoAlert() {
  document.getElementById('bingoAlert').style.display = 'none'
}

// View functions for buttons
function showPerks() {
  let perkList = possiblePerks
    .map((perk) => `${perk.name} (${perk.quantity}): ${perk.description}`)
    .join('\n\n')
  alert('PERK CARDS:\n\n' + perkList)
}

function showChallenges() {
  let challengeList = possibleChallenges
    .filter((c) => !c.includes('You suck'))
    .join('\n')
  alert('CHALLENGE CARDS:\n\n' + challengeList)
}

function showPunishments() {
  let punishmentList = possiblePunishments.join('\n')
  alert('PUNISHMENT CARDS:\n\n' + punishmentList)
}

function showHand() {
  let hand = 'CURRENT HAND:\n\n'

  if (gameState.currentChallenge) {
    hand += `Challenge: ${gameState.currentChallenge}\n\n`
  }

  if (gameState.currentPerkCards.length > 0) {
    hand += 'Perk Cards:\n'
    gameState.currentPerkCards.forEach((perk, index) => {
      hand += `${index + 1}. ${perk.name}: ${perk.description}\n`
    })
  }

  if (!gameState.currentChallenge && gameState.currentPerkCards.length === 0) {
    hand += 'No cards in hand.'
  }

  alert(hand)
}

function generateNewCard() {
  if (
    confirm(
      'Are you sure you want to generate a new bingo card? This will reset your progress.'
    )
  ) {
    localStorage.removeItem('bingoCard')
    localStorage.removeItem('bingoProgress')
    localStorage.removeItem('gameState')

    // Reset game state
    gameState = {
      currentChallenge: null,
      currentPerkCards: [],
      challengeDeck: [],
      perkDeck: [],
      punishmentDeck: [],
      hasCompletedRide: false,
      canDrawChallengeCards: false,
      canDrawPerkCards: false,
    }

    // Generate new card and reinitialize
    const newCard = generateBingoCard()
    populateBingoGrid(newCard)
    initializeDecks()
    updateGameUI()
  }
}

function shuffle(deck, storageKey = 'shuffledDeck') {
  const shuffled = [...deck].sort(() => Math.random() - 0.5)
  localStorage.setItem(storageKey, JSON.stringify(shuffled))
  console.log(`${storageKey} shuffled and saved to localStorage.`)
  return shuffled
}

function generateBingoCard() {
  // Create the actual bingo card data first
  const allItems = [
    ...possibleCoasters,
    ...possibleFlatAndWaterRides,
    ...possibleChallenges.filter((c) => !c.includes('You suck')),
  ]

  // Shuffle and take 25 items for 5x5 grid
  const shuffled = shuffle([...allItems], 'bingoCardItems')
  const selectedItems = shuffled.slice(0, 25)

  // Create 5x5 card array
  const bingoCard = []
  for (let row = 0; row < 5; row++) {
    bingoCard[row] = []
    for (let col = 0; col < 5; col++) {
      const index = row * 5 + col
      bingoCard[row][col] = selectedItems[index]
    }
  }

  // Mark center as free space
  bingoCard[2][2] = 'FREE SPACE'

  // Save the card
  localStorage.setItem('bingoCard', JSON.stringify(bingoCard))

  return bingoCard
}

function populateBingoGrid(bingoCard) {
  const bingoGrid = document.getElementById('bingoGrid')
  if (!bingoGrid) {
    console.error('Bingo grid element not found')
    return
  }

  bingoGrid.innerHTML = '' // Clear existing content

  // Generate 5 rows with row headers
  for (let row = 0; row < 5; row++) {
    // Add row header (1, 2, 3, 4, 5)
    const rowHeader = document.createElement('div')
    rowHeader.className = 'row-header'
    rowHeader.textContent = row + 1
    bingoGrid.appendChild(rowHeader)

    // Add 5 bingo squares for this row
    for (let col = 0; col < 5; col++) {
      const cell = document.createElement('div')
      cell.className = 'bingo-square'
      cell.textContent = bingoCard[row][col]
      cell.dataset.row = row
      cell.dataset.col = col

      // Mark center square as free
      if (row === 2 && col === 2) {
        cell.classList.add('free', 'marked')
        cell.textContent = 'FREE'
      }

      // Add click handler for marking cells
      cell.addEventListener('click', () => toggleCell(row, col))

      bingoGrid.appendChild(cell)
    }
  }
}

function saveBingoProgress() {
  const completedCells = []
  document.querySelectorAll('.bingo-square.marked').forEach((cell) => {
    if (cell.dataset.row !== undefined && cell.dataset.col !== undefined) {
      completedCells.push({
        row: parseInt(cell.dataset.row),
        col: parseInt(cell.dataset.col),
      })
    }
  })

  // Save to localStorage as backup
  localStorage.setItem('bingoProgress', JSON.stringify(completedCells))

  // Save to database if available
  if (bingoDatabase && !bingoDatabase.isOffline) {
    bingoDatabase.saveBingoProgress(completedCells)
  }
}

function loadBingoProgress() {
  // Try to load from database first, then localStorage
  if (bingoDatabase && !bingoDatabase.isOffline) {
    bingoDatabase.loadBingoProgress().then((savedProgress) => {
      if (savedProgress && savedProgress.length > 0) {
        applyProgressToGrid(savedProgress)
      } else {
        // Fallback to localStorage
        const localProgress = JSON.parse(
          localStorage.getItem('bingoProgress') || '[]'
        )
        applyProgressToGrid(localProgress)
      }
    })
  } else {
    const savedProgress = JSON.parse(
      localStorage.getItem('bingoProgress') || '[]'
    )
    applyProgressToGrid(savedProgress)
  }
}

function applyProgressToGrid(savedProgress) {
  savedProgress.forEach((progress) => {
    const cell = document.querySelector(
      `[data-row="${progress.row}"][data-col="${progress.col}"]`
    )
    if (cell) {
      cell.classList.add('marked')
    }
  })
}

function toggleCell(row, col) {
  // Don't allow toggling the free space
  if (row === 2 && col === 2) return

  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`)
  if (cell) {
    const wasMarked = cell.classList.contains('marked')
    cell.classList.toggle('marked')

    // If we just marked a cell (not unmarked), check if it's a ride and update game state
    if (!wasMarked && cell.classList.contains('marked')) {
      // Get bingo card from either localStorage (solo) or currentCard (multiplayer)
      let bingoCard
      if (currentCard) {
        // Multiplayer mode - use the tracking card
        bingoCard = currentCard
      } else {
        // Solo mode - use localStorage
        bingoCard = JSON.parse(localStorage.getItem('bingoCard'))
      }

      if (bingoCard && bingoCard[row] && bingoCard[row][col]) {
        const itemName = bingoCard[row][col]

        // Check if it's a coaster to enable perk card drawing
        const isCoaster = possibleCoasters.some(
          (coaster) => coaster.toLowerCase() === itemName.toLowerCase()
        )

        // Enable card drawing for any completed item
        gameState.canDrawChallengeCards = true

        // Enable perk drawing if it's a coaster
        if (isCoaster) {
          gameState.hasCompletedRide = true
          gameState.canDrawPerkCards = true
          // Show notification that it's a coaster
          const notification = document.createElement('div')
          notification.textContent =
            '🎢 Roller coaster completed! You can now draw perk cards!'
          notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1000;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          `
          document.body.appendChild(notification)
          setTimeout(() => notification.remove(), 3000)
        }

        saveGameState()
        updateGameUI()
      }
    }

    saveBingoProgress()
    checkForBingo()
  }
}

// Group ride management
let currentGroupRide = null
let ridersWhoParticipated = new Set()

// Populate ride datalist on game start
function populateRidesList() {
  console.log('populateRidesList() called')
  const datalist = document.getElementById('ridesList')
  const groupRideSelection = document.getElementById('groupRideSelection')

  console.log('ridesList element:', datalist)
  console.log('groupRideSelection element:', groupRideSelection)

  if (!datalist) {
    console.error('ridesList datalist not found!')
    return
  }

  const allRides = [...possibleCoasters, ...possibleFlatAndWaterRides]
  console.log('Total rides to populate:', allRides.length)
  datalist.innerHTML = ''

  allRides.forEach((ride) => {
    const option = document.createElement('option')
    option.value = ride
    datalist.appendChild(option)
  })

  console.log('Rides list populated successfully')
}

// Announce a group ride
window.announceGroupRide = function () {
  const rideInput = document.getElementById('selectedRide')
  const rideName = rideInput.value.trim()

  if (!rideName) {
    alert('Please enter a ride name first!')
    return
  }

  currentGroupRide = rideName
  ridersWhoParticipated.clear()

  // Update UI
  document.getElementById('currentGroupRide').style.display = 'block'
  document.getElementById('groupRideText').textContent = rideName
  rideInput.value = ''

  // Notify other players via database if in multiplayer
  if (bingoDatabase && !bingoDatabase.isOffline) {
    bingoDatabase.announceGroupRide(rideName)
  }

  alert(
    `📢 Group ride announced: ${rideName}\nEveryone who rides this should click "I Rode This Ride" when done!`
  )
}

// Handle group ride announcements from other players
function handleGroupRideAnnouncement(rideData) {
  // Don't notify if this player announced the ride
  if (rideData.announcedBy === bingoDatabase?.playerId) {
    return
  }

  const rideName = rideData.rideName
  const announcerNickname = rideData.announcerNickname || 'Another player'

  // Update local state
  currentGroupRide = rideName
  ridersWhoParticipated.clear()

  // Add participants from database
  if (rideData.participants) {
    Object.keys(rideData.participants).forEach((playerId) => {
      ridersWhoParticipated.add(playerId)
    })
  }

  // Update UI
  document.getElementById('currentGroupRide').style.display = 'block'
  document.getElementById('groupRideText').textContent = rideName

  // Show notification to player
  alert(
    `🎢 ${announcerNickname} announced a group ride: ${rideName}\n\nClick "I Rode This Ride" after you complete it!`
  )

  // Update participation display
  updateRiderParticipationDisplay()
}

// Handle group ride participation changes
function handleGroupRideParticipationChange(participants) {
  if (!currentGroupRide) return

  // Update local riders list
  ridersWhoParticipated.clear()
  if (participants) {
    Object.keys(participants).forEach((playerId) => {
      ridersWhoParticipated.add(playerId)
    })
  }

  // Update UI
  updateRiderParticipationDisplay()
}

// Confirm player participated in the ride
window.confirmRiderParticipation = function () {
  if (!currentGroupRide) {
    alert('No group ride is currently active!')
    return
  }

  // Add current player to riders list
  const playerName = bingoDatabase?.playerId || 'You'
  ridersWhoParticipated.add(playerName)

  // Sync with database in multiplayer mode
  if (bingoDatabase && !bingoDatabase.isOffline) {
    bingoDatabase.joinGroupRide()
  }

  alert(
    `✅ Confirmed: You participated in ${currentGroupRide}!\nYou'll be able to draw cards when the ride is completed.`
  )

  // Update UI to show participation status
  updateRiderParticipationDisplay()
}

function updateRiderParticipationDisplay() {
  const currentRideDiv = document.getElementById('currentGroupRide')
  if (!currentRideDiv || !currentGroupRide) return

  const participantCount = ridersWhoParticipated.size
  const playerName = bingoDatabase?.playerId || 'You'
  const hasParticipated = ridersWhoParticipated.has(playerName)

  const participationStatus = hasParticipated
    ? `✅ You confirmed participation (${participantCount} riders confirmed)`
    : `⏳ Waiting for your confirmation (${participantCount} riders confirmed)`

  let statusElement = document.getElementById('participationStatus')
  if (!statusElement) {
    statusElement = document.createElement('div')
    statusElement.id = 'participationStatus'
    statusElement.style.fontSize = '0.9em'
    statusElement.style.marginTop = '5px'
    currentRideDiv.appendChild(statusElement)
  }

  statusElement.textContent = participationStatus
  statusElement.style.color = hasParticipated ? '#4CAF50' : '#ff9800'
}

// Complete the group ride and distribute rewards
window.completeGroupRide = function () {
  if (!currentGroupRide) {
    alert('No group ride is currently active!')
    return
  }

  // Mark the ride on all players' cards if it appears
  markRideOnAllCards(currentGroupRide)

  // Enable card drawing for participants
  if (ridersWhoParticipated.has(bingoDatabase?.playerId || 'You')) {
    gameState.canDrawChallengeCards = true

    // Check if it's a coaster for perk cards
    const isCoaster = possibleCoasters.some(
      (coaster) => coaster.toLowerCase() === currentGroupRide.toLowerCase()
    )

    if (isCoaster) {
      gameState.canDrawPerkCards = true
      alert(
        `🎢 ${currentGroupRide} completed! You can now draw challenge and perk cards!`
      )
    } else {
      alert(
        `🎠 ${currentGroupRide} completed! You can now draw challenge cards!`
      )
    }

    saveGameState()
    updateGameUI()
  }

  // Clear current ride
  currentGroupRide = null
  ridersWhoParticipated.clear()
  document.getElementById('currentGroupRide').style.display = 'none'
}

// Mark ride on all players' cards
function markRideOnAllCards(rideName) {
  if (bingoDatabase && !bingoDatabase.isOffline) {
    // In multiplayer, mark on the tracking card
    markRideOnTrackingCard(rideName)
  } else {
    // In solo mode, mark on own card
    markRideOnCard(rideName)
  }
}

function markRideOnTrackingCard(rideName) {
  if (!currentCard) return

  // Find and mark the ride on the tracking card
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (
        currentCard[row][col] &&
        currentCard[row][col].toLowerCase() === rideName.toLowerCase()
      ) {
        const cell = document.querySelector(
          `[data-row="${row}"][data-col="${col}"]`
        )
        if (cell && !cell.classList.contains('marked')) {
          cell.classList.add('marked')
          saveBingoProgress()
          checkForBingo()
        }
      }
    }
  }
}

function markRideOnCard(rideName) {
  const bingoCard = JSON.parse(localStorage.getItem('bingoCard'))
  if (!bingoCard) return

  // Find and mark the ride on the card
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (
        bingoCard[row][col] &&
        bingoCard[row][col].toLowerCase() === rideName.toLowerCase()
      ) {
        const cell = document.querySelector(
          `[data-row="${row}"][data-col="${col}"]`
        )
        if (cell && !cell.classList.contains('marked')) {
          cell.classList.add('marked')
          saveBingoProgress()
          checkForBingo()
        }
      }
    }
  }
}

// Make functions globally available
window.endGame = function () {
  if (
    confirm(
      'Are you sure you want to end the current game? This will return you to the homepage.'
    )
  ) {
    // Clear all localStorage
    localStorage.clear()

    // Reset game mode flag
    gameModeSelected = false

    // Return to homepage
    window.location.href = '/'
  }
}

window.generateNewCard = function () {
  if (
    confirm('Generate a new bingo card? This will reset your current progress.')
  ) {
    localStorage.removeItem('bingoCard')
    localStorage.removeItem('bingoProgress')
    localStorage.removeItem('bingoCardItems')

    // Regenerate the card
    const newCard = generateBingoCard()
    populateBingoGrid(newCard)
    loadBingoProgress()
  }
}

window.toggleCell = toggleCell
window.showHand = showHand

// Game mode selection functions
window.showGameModeSelection = function () {
  // Reset the game mode selection flag
  gameModeSelected = false

  document.getElementById('gameModeSelection').style.display = 'block'
  document.getElementById('multiplayerOptions').style.display = 'none'
  document.getElementById('gameStatus').style.display = 'none'
  document.getElementById('bingoCardContainer').style.display = 'none'
}

window.showMultiplayerOptions = function () {
  document.getElementById('gameModeSelection').style.display = 'none'
  document.getElementById('multiplayerOptions').style.display = 'block'
}

window.startSoloGame = function () {
  // Mark game mode as selected
  gameModeSelected = true

  // Clear any multiplayer data
  localStorage.removeItem('gameId')
  localStorage.removeItem('playerId')
  localStorage.removeItem('isHost')

  // Hide mode selection and show game
  document.getElementById('gameModeSelection').style.display = 'none'
  document.getElementById('gameStatus').style.display = 'block'
  document.getElementById('bingoCardContainer').style.display = 'block'

  // Update status
  document.getElementById('connectionStatus').textContent = 'Solo Mode'

  // Initialize game
  initializeBingoGame(null)
}

window.createMultiplayerGame = async function () {
  try {
    console.log('Creating multiplayer game...')

    // Get and validate player name
    const playerName = getPlayerName()
    if (!playerName) return

    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
      alert('Firebase is not available. Playing in solo mode instead.')
      startSoloGame()
      return
    }

    // Initialize database if not already done
    if (!bingoDatabase) {
      console.log('Initializing new BingoDatabase instance for host')
      bingoDatabase = new BingoDatabase()
      await bingoDatabase.initializeFirebase()
    }

    console.log('Database offline status:', bingoDatabase.isOffline)

    // Check if database is still offline after initialization
    if (bingoDatabase.isOffline) {
      alert('Could not connect to database. Playing in solo mode instead.')
      startSoloGame()
      return
    }

    console.log('Calling createOrJoinGame to create new game')
    // Create new game (call createOrJoinGame without gameCode but with player name)
    const gameInfo = await bingoDatabase.createOrJoinGame(null, playerName)

    console.log('Game info returned:', gameInfo)

    if (gameInfo && !gameInfo.offline) {
      // Mark game mode as selected
      gameModeSelected = true

      localStorage.setItem('gameId', gameInfo.gameId)
      localStorage.setItem('playerId', gameInfo.playerId)
      localStorage.setItem('isHost', 'true')

      // Hide mode selection and show game
      document.getElementById('multiplayerOptions').style.display = 'none'
      document.getElementById('gameStatus').style.display = 'block'
      document.getElementById('bingoCardContainer').style.display = 'block'

      // Update status
      document.getElementById('connectionStatus').textContent =
        'Multiplayer - Host'
      document.getElementById(
        'gameCode'
      ).textContent = `Game Code: ${gameInfo.gameId}`
      document.getElementById('gameCode').style.display = 'inline'

      // Initialize game with database
      initializeBingoGame(bingoDatabase)

      console.log(
        'Successfully created multiplayer game with code:',
        gameInfo.gameId
      )
    } else {
      console.log('Failed to create game - gameInfo:', gameInfo)
      alert('Failed to create game room. Playing in solo mode.')
      startSoloGame()
    }
  } catch (error) {
    console.error('Error creating multiplayer game:', error)
    alert(
      `Failed to create multiplayer game: ${error.message}. Playing in solo mode.`
    )
    startSoloGame()
  }
}

window.joinMultiplayerGame = async function () {
  const gameCode = document
    .getElementById('joinGameCode')
    .value.trim()
    .toUpperCase()

  if (!gameCode) {
    alert('Please enter a game code')
    return
  }

  // Get and validate player name
  const playerName = getPlayerName()
  if (!playerName) return

  console.log('Attempting to join game with code:', gameCode)

  try {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
      alert('Firebase is not available. Cannot join multiplayer game.')
      return
    }

    // Initialize database if not already done
    if (!bingoDatabase) {
      console.log('Initializing new BingoDatabase instance')
      bingoDatabase = new BingoDatabase()
      await bingoDatabase.initializeFirebase()
    }

    console.log('Database offline status:', bingoDatabase.isOffline)

    // Check if database is still offline after initialization
    if (bingoDatabase.isOffline) {
      alert('Could not connect to database. Cannot join multiplayer game.')
      return
    }

    console.log('Calling createOrJoinGame with gameCode:', gameCode)
    // Join existing game (call createOrJoinGame with gameCode and player name)
    const gameInfo = await bingoDatabase.createOrJoinGame(gameCode, playerName)

    console.log('Game info returned:', gameInfo)

    if (gameInfo && !gameInfo.offline) {
      // Mark game mode as selected
      gameModeSelected = true

      localStorage.setItem('gameId', gameInfo.gameId)
      localStorage.setItem('playerId', gameInfo.playerId)
      localStorage.setItem('isHost', 'false')

      // Hide mode selection and show game
      document.getElementById('multiplayerOptions').style.display = 'none'
      document.getElementById('gameStatus').style.display = 'block'
      document.getElementById('bingoCardContainer').style.display = 'block'

      // Update status
      document.getElementById('connectionStatus').textContent =
        'Multiplayer - Player'
      document.getElementById('gameCode').textContent = `Game Code: ${gameCode}`
      document.getElementById('gameCode').style.display = 'inline'

      // Initialize game with database
      initializeBingoGame(bingoDatabase)

      console.log('Successfully joined multiplayer game')
    } else {
      console.log('Failed to join game - gameInfo:', gameInfo)
      alert('Failed to join game. Check the game code and try again.')
    }
  } catch (error) {
    console.error('Error joining multiplayer game:', error)
    alert(
      `Failed to join multiplayer game: ${error.message}. Please try again.`
    )
  }
}

// Start multiplayer game (host only)
window.startMultiplayerGame = async function () {
  console.log('=== START MULTIPLAYER GAME CALLED ===')
  console.log('Called by:', new Error().stack)

  if (!bingoDatabase || bingoDatabase.isOffline) {
    alert('Not connected to database')
    return
  }

  try {
    console.log('Starting multiplayer game...')
    const success = await bingoDatabase.startGame()

    if (success) {
      console.log('Game started successfully')
      // Reload the tracking card
      await loadMultiplayerCard()
    } else {
      alert('Failed to start game. Make sure you have at least 2 players.')
    }
  } catch (error) {
    console.error('Error starting game:', error)
    alert(`Failed to start game: ${error.message}`)
  }
}

// Helper function to get and validate player name
function getPlayerName() {
  const nameInput = document.getElementById('playerName')
  if (!nameInput) return null

  const name = nameInput.value.trim()
  if (!name) {
    alert('Please enter your name before joining/creating a game')
    nameInput.focus()
    return null
  }

  // Limit name length and sanitize
  if (name.length > 20) {
    alert('Name must be 20 characters or less')
    nameInput.focus()
    return null
  }

  return name
}

// Debug function to test coaster detection
window.testCoasterDetection = function () {
  console.log('=== COASTER DETECTION TEST ===')
  console.log('Possible coasters:', possibleCoasters)
  console.log('Current game state:', gameState)

  // Test some common coaster names
  const testNames = ['Goliath', 'Batman: The Ride', 'Raging Bull', 'X-Flight']
  testNames.forEach((name) => {
    const isCoaster = possibleCoasters.some(
      (coaster) => coaster.toLowerCase() === name.toLowerCase()
    )
    console.log(`"${name}" is coaster: ${isCoaster}`)
  })
}

// Debug function to show current bingo card
window.showBingoCard = function () {
  const bingoCard = JSON.parse(localStorage.getItem('bingoCard'))
  console.log('Current bingo card:', bingoCard)

  if (bingoCard) {
    console.log('Coasters on card:')
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const item = bingoCard[row][col]
        const isCoaster = possibleCoasters.some(
          (coaster) => coaster.toLowerCase() === item.toLowerCase()
        )
        if (isCoaster) {
          console.log(`- ${item} (Row ${row + 1}, Col ${col + 1})`)
        }
      }
    }
  }
}

// Debug function to test Firebase connection
window.testFirebase = async function () {
  if (!bingoDatabase) {
    console.log('Creating BingoDatabase instance for testing...')
    bingoDatabase = new BingoDatabase()
    await bingoDatabase.initializeFirebase()
  }

  console.log('Testing Firebase connection...')
  const result = await bingoDatabase.testFirebaseConnection()
  console.log('Firebase test result:', result)
  return result
}
