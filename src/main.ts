console.log(`Hello world`)

import { io } from 'socket.io-client'

const connectToSocketServer = () => {
  const statusElement = document.getElementById('status')
  if (!statusElement) return

  // Connect using the proxy provided by Vite - no need to specify a URL
  // as the proxy in vite.config.js will forward to the correct server
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

    // Socket.io automatically attempts to reconnect
  })

  return socket
}

// Start connection to socket server
connectToSocketServer()
