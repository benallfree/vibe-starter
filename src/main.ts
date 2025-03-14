console.log(`Hello world`)

import { io } from 'socket.io-client'
import { createSkiGame } from './game/skiGame'

// Initialize the game
const initGame = () => {
  const appElement = document.getElementById('app')
  if (!appElement) return

  // Create the ski game
  const game = createSkiGame(appElement)

  // Start the game
  game.start()

  // Update game title and description
  updateGameInfo()

  return game
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
  if (!statusElement) return

  // Connect using the proxy provided by Vite
  const socket = io()

  // Update UI when connection is established
  socket.on('connect', () => {
    statusElement.textContent = 'Connected to server'
    statusElement.style.backgroundColor = '#81B29A' // Green for connected state
    console.log(`Connected to server with ID: ${socket.id}`)
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
  })

  // Handle connection errors
  socket.on('connect_error', (error) => {
    statusElement.textContent = 'Connection error'
    statusElement.style.backgroundColor = '#E07A5F'
    console.error('Connection error:', error)
  })

  return socket
}

// Initialize the game and connect to server
const game = initGame()
const socket = connectToSocketServer()

// Handle window resize
window.addEventListener('resize', () => {
  if (game) game.handleResize()
})
