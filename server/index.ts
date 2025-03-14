import express from 'express'
import http from 'http'
import { Server, Socket } from 'socket.io'
import createStaticServer from './static-server'

/**
 * Create and configure the game server
 * Uses function factory pattern as per project style
 */
const createGameServer = () => {
  const app = express()
  const server = http.createServer(app)
  const io = new Server(server, {
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? false // Disable CORS in production as we serve frontend from same origin
          : 'http://localhost:5173', // Allow CORS from Vite dev server
      methods: ['GET', 'POST'],
    },
  })

  const PORT = process.env.PORT || 3000

  // In production, serve static files from the Vite build
  if (process.env.NODE_ENV === 'production') {
    createStaticServer(app)
  }

  // Set up Socket.io connection handling
  const setupSocketHandlers = () => {
    io.on('connection', (socket: Socket) => {
      console.log(`Player connected: ${socket.id}`)

      // Send welcome message to client
      socket.emit('message', 'Welcome to GAME NAME! 🤠')

      // Broadcast to all other clients that a new player joined
      socket.broadcast.emit('message', 'A new player has joined the arena!')

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`)
        io.emit('message', 'A player has left the arena.')
      })
    })
  }

  // Start the server
  const start = () => {
    setupSocketHandlers()

    server.listen(PORT, () => {
      console.log(`Game server running on http://localhost:${PORT}`)
    })
  }

  return { start }
}

// Create and start the game server
const gameServer = createGameServer()
gameServer.start()
