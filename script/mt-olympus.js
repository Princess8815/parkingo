console.log('mt olympus loaded')

const possibleCoasters = [
  'Hades 360',
  'Zeus',
  'Cyclops',
  'Pegasus',
  'Little Titans Coaster',
  'Time Warp',
]

const possibleFlatAndWaterRides = [
  'Trojan Horse',
  'Chaos',
  'Kamikaze',
  'Bumper Boats',
  'Go Karts',
  'Mini Golf',
  'Batting Cages',
  'Thunder Falls',
  "Poseidon's Plunge",
  "Neptune's Revenge",
  "Medusa's Waterslides",
  'Parthenon Pool',
  'Lazy River',
  "Zeus' Playground",
  'Hydra Falls',
  'Tornado Alley',
  'Black Hole',
  'Lost City of Atlantis',
]

const possibleChallenges = [
  'Find a food stand that sells cheese curds',
  'Take a selfie with a Greek-themed decoration',
  'Find someone wearing a Wisconsin Dells shirt',
  'Find a map sign and point at it dramatically',
  'Get sprayed by a water feature',
  'Find a sign with your birth month on it',
  'Locate a souvenir shop (no need to buy)',
  'High five any staff member',
  'Spot someone with a matching shirt color to you',
  'Take a group photo in front of the Mt. Olympus sign',
  'Spot a ride operator preparing a ride',
  'Sit and relax for 5 minutes without checking your phone',
  "Compliment a stranger's outfit",
  'Find and photograph something golden in the park',
  'Spot someone wearing flip-flops',
  'Get a stranger to take a picture of you',
  'Count how many people are in a water ride line',
  "Wave to people on a ride while you're on the ground",
  'Take a photo imitating a ride photo pose',
  'Find a duck or bird near the water features',
  'Spot someone wearing a swimsuit as regular clothes',
  'Wave to a lifeguard and get them to wave back',
  'Compliment a food stand worker',
  'Find a quiet spot to sit for a minute',
  'Spot a ride with a short line',
  'Find and read a safety sign in a dramatic voice',
  'You suck draw a punishment card now',
  'You suck draw a punishment card now',
  'You suck draw a punishment card now',
  'You suck draw a punishment card now',
  'You suck draw a punishment card now',
]

const possiblePerks = [
  {
    name: 'Draw a Challenge Card',
    description:
      'Immediately draw an extra challenge card. If already holding one, choose which to keep.',
    quantity: 5,
  },
  {
    name: "Steal and Complete a Player's Next Challenge Card",
    description:
      'Choose a player. You take their next drawn challenge and complete it as your own.',
    quantity: 2,
  },
  {
    name: 'Pick Any Challenge to Complete',
    description:
      "Announce any challenge by name. If it's on your card, it's marked complete.",
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
    name: 'Ride Hades 360 for 2 Challenge and 2 Perk Cards',
    description:
      'If you ride Hades 360, draw two Challenge and two Perk Cards instead of one each.',
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
  'Find 5 people wearing swimsuits',
  'Make water splash sounds for 5 minutes',
  "Ask a stranger 'Where's the nearest ocean?'",
  "Get into a water ride line, wait a little, then announce 'I forgot my swimsuit!' and leave.",
  'Get a person to record you doing your best Greek god pose',
  'Give a stranger one of the blank cards',
  'Sit on a bench and start talking about ancient Greek mythology',
  "On your next water ride, yell 'Poseidon, protect me!' when it starts",
  'Do the Greek warrior march for 5 minutes',
  'Skip like a happy nymph for 5 minutes',
  "You're dehydrated – drink water now",
  "You're dehydrated – drink water now",
  "You're dehydrated – drink water now",
  "You're dehydrated – drink water now",
  "You're dehydrated – drink water now",
  'Mimic a Greek statue pose for 2 minutes',
  "Ride a kiddie ride if you're allowed",
  'Speak like Zeus (booming voice) for 5 minutes',
  'Hug a column or pillar (if available)',
  'Walk backwards for 3 minutes',
  "Compliment every stranger like they're a Greek god/goddess for 5 minutes",
  'Narrate everything like an epic Greek tale for 5 minutes',
  'Do the victory dance for 1 minute',
  'Ask a staff member where Mount Olympus actually is',
  "Walk up to a stranger and say 'The oracle has spoken!' dramatically",
  'Pretend to be a Greek statue for 3 minutes',
  'Spread your arms like wings and hold for 3 minutes',
  'Do 10 squats right where you stand',
  "Walk like you're carrying a heavy amphora for 2 minutes",
  "Sniff the air and say 'I smell ambrosia!'",
  "Say 'By Zeus!' at the end of every sentence for 5 minutes",
  "Ask a stranger if they've seen any gods today",
  'Stomp like a mighty titan for 1 minute',
  'Try to high five every person you pass for 3 minutes',
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
  canDrawCards: false,
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
      !gameState.canDrawCards
  }

  // Update perk draw button
  document.getElementById('drawPerkBtn').disabled =
    !gameState.canDrawCards || !gameState.hasCompletedRide

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

  if (!gameState.canDrawCards) {
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

  gameState.canDrawCards = false
  saveGameState()
  updateGameUI()
}

function drawPerkCard() {
  if (!gameState.canDrawCards || !gameState.hasCompletedRide) {
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

  // Check if this challenge exists on the bingo card
  const bingoCard = JSON.parse(localStorage.getItem('bingoCard'))
  let found = false

  if (bingoCard) {
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (bingoCard[row][col] === challenge) {
          // Mark this cell as completed
          const cell = document.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
          )
          if (cell && !cell.classList.contains('marked')) {
            cell.classList.add('marked')
            found = true
            break
          }
        }
      }
      if (found) break
    }
  }

  if (found) {
    alert(`Challenge completed and marked on your bingo card: ${challenge}`)
  } else {
    alert(`Challenge completed, but it's not on your bingo card: ${challenge}`)
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
  const rideName = prompt('Enter the name of the ride you completed:')
  if (!rideName) return

  // Mark ride on bingo card if it exists
  const bingoCard = JSON.parse(localStorage.getItem('bingoCard'))
  let found = false
  let isCoaster = false

  if (bingoCard) {
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (bingoCard[row][col].toLowerCase() === rideName.toLowerCase()) {
          const cell = document.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
          )
          if (cell && !cell.classList.contains('marked')) {
            cell.classList.add('marked')
            found = true

            // Check if it's a coaster
            isCoaster = possibleCoasters.some(
              (coaster) => coaster.toLowerCase() === rideName.toLowerCase()
            )
            break
          }
        }
      }
      if (found) break
    }
  }

  if (found) {
    alert(`Ride "${rideName}" marked on your bingo card!`)
  } else {
    alert(
      `Ride "${rideName}" is not on your bingo card, but you can still draw cards.`
    )
  }

  // Enable card drawing
  gameState.canDrawCards = true
  gameState.hasCompletedRide = isCoaster

  if (isCoaster) {
    alert(
      'You completed a roller coaster! You can now draw both challenge and perk cards.'
    )
  } else {
    alert('Ride completed! You can now draw a challenge card.')
  }

  saveGameState()
  saveBingoProgress()
  updateGameUI()

  // Check for bingo
  checkForBingo()
}

function checkForBingo() {
  const markedCells = document.querySelectorAll('.bingo-cell.marked')
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
      canDrawCards: false,
    }

    // Generate new card and reinitialize
    const newCard = generateBingoCard()
    populateBingoGrid(newCard)
    initializeDecks()
    updateGameUI()
  }
}

function generateBingoCard() {
  // Check if bingo card already exists in localStorage
  let savedCard = JSON.parse(localStorage.getItem('bingoCard'))
  if (savedCard) {
    console.log('Bingo card loaded from localStorage.')
    return savedCard
  }

  console.log('Generating new bingo card...')

  // Shuffle helper
  const shuffle = (array) => array.sort(() => Math.random() - 0.5)

  // Clone arrays to avoid mutating originals
  let coasters = shuffle([...possibleCoasters])
  let flatWaterRides = shuffle([...possibleFlatAndWaterRides])
  let challenges = shuffle([...possibleChallenges])

  // Select required numbers
  let selectedCoasters = coasters.slice(0, 5)
  let selectedFlatWater = flatWaterRides.slice(0, 10)
  let selectedChallenges = challenges.slice(0, 10)

  // Combine all into one array and shuffle for placement
  let bingoItems = shuffle([
    ...selectedCoasters,
    ...selectedFlatWater,
    ...selectedChallenges,
  ])

  // Create 5x5 card structure
  let bingoCard = []
  let index = 0
  for (let row = 0; row < 5; row++) {
    let rowItems = []
    for (let col = 0; col < 5; col++) {
      rowItems.push(bingoItems[index] || 'FREE') // Fallback safety
      index++
    }
    bingoCard.push(rowItems)
  }

  // Save to localStorage
  localStorage.setItem('bingoCard', JSON.stringify(bingoCard))
  console.log('Bingo card generated and saved to localStorage.')

  return bingoCard
}

function populateBingoGrid(bingoCard) {
  const bingoGrid = document.getElementById('bingoGrid')
  if (!bingoGrid) {
    console.error('Bingo grid element not found')
    return
  }

  bingoGrid.innerHTML = '' // Clear existing content

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const cell = document.createElement('div')
      cell.className = 'bingo-cell'
      cell.textContent = bingoCard[row][col]
      cell.dataset.row = row
      cell.dataset.col = col

      // Add click handler for marking cells
      cell.addEventListener('click', () => toggleCell(row, col))

      bingoGrid.appendChild(cell)
    }
  }
}

function toggleCell(row, col) {
  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`)
  if (cell) {
    cell.classList.toggle('marked')
    saveBingoProgress()
  }
}

function saveBingoProgress() {
  const markedCells = []
  document.querySelectorAll('.bingo-cell.marked').forEach((cell) => {
    markedCells.push({
      row: parseInt(cell.dataset.row),
      col: parseInt(cell.dataset.col),
    })
  })

  localStorage.setItem('bingoProgress', JSON.stringify(markedCells))

  // Save to database if available
  if (window.gameDatabase && !window.gameDatabase.isOffline) {
    window.gameDatabase.saveBingoProgress(markedCells)
  }
}

function loadBingoProgress() {
  let progress = JSON.parse(localStorage.getItem('bingoProgress') || '[]')

  // Try to load from database if available
  if (window.gameDatabase && !window.gameDatabase.isOffline) {
    window.gameDatabase.loadBingoProgress().then((dbProgress) => {
      if (dbProgress && dbProgress.length > 0) {
        progress = dbProgress
      }
      applyProgress(progress)
    })
  } else {
    applyProgress(progress)
  }
}

function applyProgress(progress) {
  progress.forEach((cell) => {
    const cellElement = document.querySelector(
      `[data-row="${cell.row}"][data-col="${cell.col}"]`
    )
    if (cellElement) {
      cellElement.classList.add('marked')
    }
  })
}

// Initialize bingo game function that will be called from game.html
function initializeBingoGame(database) {
  console.log('Initializing Mt. Olympus bingo game...')

  // Store database reference globally
  window.gameDatabase = database

  // Initialize decks first
  initializeDecks()

  // Generate or load bingo card
  let myBingoCard

  if (database && !database.isOffline) {
    // Try to load from database first
    database.loadBingoCard().then((savedCard) => {
      if (savedCard) {
        myBingoCard = savedCard
        console.log('Bingo card loaded from database')
      } else {
        myBingoCard = generateBingoCard()
        database.saveBingoCard(myBingoCard)
        console.log('New bingo card generated and saved to database')
      }
      populateBingoGrid(myBingoCard)
      loadBingoProgress()
      updateGameUI()
    })
  } else {
    // Offline mode
    myBingoCard = generateBingoCard()
    populateBingoGrid(myBingoCard)
    loadBingoProgress()
    updateGameUI()
  }
}

function shuffle(deck, storageKey = 'shuffledDeck') {
  const shuffled = [...deck].sort(() => Math.random() - 0.5)
  localStorage.setItem(storageKey, JSON.stringify(shuffled))
  console.log(`${storageKey} shuffled and saved to localStorage.`)
  return shuffled
}
