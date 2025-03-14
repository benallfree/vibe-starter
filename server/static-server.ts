import express from 'express'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

/**
 * Create a static file server for production.
 * This will serve the Vite-built frontend.
 */
const createStaticServer = (app: express.Express) => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  // Path to the public directory and built frontend
  const publicPath = join(__dirname, '..', '..', 'build', 'public')
  const distPath = join(__dirname, '..', '..', 'build', 'dist')

  // Serve static files from the public directory (higher priority)
  app.use(express.static(publicPath))

  // Serve static files from the Vite build
  app.use(express.static(distPath))

  // Serve index.html for any route that doesn't match a static file
  // This is important for SPA routing
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })

  return app
}

export default createStaticServer
