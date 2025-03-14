console.log(`Hello world`)

import { io } from 'socket.io-client'
import { createSkiGame } from './game/skiGame'

// Initialize the game
const initGame = () => {
  const appElement = document.getElementById('app')
  if (!appElement) return

  // Create the ski game
  const game = createSkiGame(appElement)

  // Update game title and description
  updateGameInfo()

  return game
}

// Set up splash screen and handle start button
const setupSplashScreen = (game: any) => {
  const splashScreen = document.getElementById('splash-screen')
  const startButton = document.getElementById('start-game-button') as HTMLButtonElement

  if (!splashScreen || !startButton) return

  // Show splash screen initially
  splashScreen.style.display = 'flex'

  // Start the game in demo mode
  game.start(true) // Pass true to indicate demo mode

  // Handle start button click
  startButton.addEventListener('click', () => {
    // Hide splash screen
    splashScreen.style.display = 'none'

    // Switch from demo mode to regular play mode without resetting
    // This prevents creating a second skier
    game.setDemoMode(false)
  })
}

// Update the game information in the HTML
const updateGameInfo = () => {
  const titleElement = document.querySelector('h1')
  const descriptionElement = document.querySelector('h2')

  if (titleElement) titleElement.textContent = 'GNAR'
  if (descriptionElement)
    descriptionElement.textContent = 'Ski down an endless mountain and rack up points!'
}

// Connect to the socket server for potential multiplayer features
const connectToSocketServer = () => {
  const statusElement = document.getElementById('status')
  const startButton = document.getElementById('start-game-button') as HTMLButtonElement

  if (!statusElement || !startButton) return

  // Connect using the proxy provided by Vite
  const socket = io()

  // Update UI when connection is established
  socket.on('connect', () => {
    statusElement.textContent = 'Connected to server'
    statusElement.style.backgroundColor = '#81B29A' // Green for connected state
    console.log(`Connected to server with ID: ${socket.id}`)

    // Enable the start button once connected
    startButton.disabled = false
  })

  // Handle welcome message
  socket.on('message', (message) => {
    console.log(`Server message: ${message}`)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    statusElement.textContent = 'Disconnected from server'
    statusElement.style.backgroundColor = '#E07A5F' // Red for disconnected state
    console.log('Disconnected from server')

    // Disable the start button if disconnected
    startButton.disabled = true
  })

  // Handle connection errors
  socket.on('connect_error', (error) => {
    statusElement.textContent = 'Connection error'
    statusElement.style.backgroundColor = '#E07A5F'
    console.error('Connection error:', error)

    // Start button stays disabled on connection error
    startButton.disabled = true
  })

  return socket
}

// Initialize the game and connect to server
const game = initGame()
const socket = connectToSocketServer()

// Set up the splash screen after initializing socket connection
setupSplashScreen(game)

// Handle window resize
window.addEventListener('resize', () => {
  if (game) game.handleResize()
})
