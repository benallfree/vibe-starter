import * as THREE from 'three'
import { createControls } from './controls'
import { createObstacleManager } from './obstacleManager'
import { createScoreManager } from './scoreManager'
import { createSkier } from './skier'
import { createTerrainGenerator } from './terrainGenerator'
import { createUIManager } from './ui/uiManager'
import { createCollisionHelper } from './utils/collisionHelper'
import { createLightingManager } from './utils/lightingManager'
import { createPerformanceManager } from './utils/performanceManager'
import { createSnowManager } from './utils/snowManager'
import { createTimeManager, GameTime } from './utils/timeManager'

// Extend Window interface
declare global {
  interface Window {
    gameTime?: GameTime
  }
}

// Create the main ski game
export const createSkiGame = (container: HTMLElement) => {
  // Core Three.js components
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ antialias: true })

  // Game state
  let score = 0
  let isGameRunning = false
  let animationFrameId = 0
  let isDemoMode = false

  // Set up renderer
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  // Set camera position
  camera.position.set(0, 5, 10) // Behind and above the skier
  camera.lookAt(0, 0, -10)

  // Create managers and helpers
  const timeManager = createTimeManager()
  const terrainGenerator = createTerrainGenerator(scene)
  const skier = createSkier(scene)
  const controls = createControls(skier)
  const obstacleManager = createObstacleManager(scene)
  const scoreManager = createScoreManager()
  const uiManager = createUIManager(container, skier)
  const snowManager = createSnowManager(scene)
  const performanceManager = createPerformanceManager(renderer, snowManager)
  const lightingManager = createLightingManager(scene, renderer)
  const collisionHelper = createCollisionHelper(
    scene,
    skier,
    obstacleManager,
    scoreManager,
    uiManager
  )

  // Make gameTime globally accessible for all animations
  ;(window as any).gameTime = timeManager.gameTime

  // Update camera position to follow skier
  const updateCameraPosition = () => {
    const skierPosition = skier.getPosition()
    camera.position.x = skierPosition.x
    camera.position.z = skierPosition.z + 10
    camera.position.y = skierPosition.y + 5
    camera.lookAt(skierPosition.x, skierPosition.y, skierPosition.z - 10)
  }

  // Update game state with fixed time step
  const updateGameState = (deltaTime: number) => {
    // Get current speed for updates
    const speed = timeManager.getSpeed()

    // Update score based on distance traveled (only if not in demo mode)
    if (!isDemoMode) {
      score += speed * 10 * deltaTime * 60 // Scale to make it similar to original timing
    }

    // Update UI
    uiManager.updateLivesDisplay(score, isDemoMode)

    // Handle demo mode automatic movement
    if (isDemoMode) {
      if (skier.getIsTumbling()) {
        // Wait 2 seconds then reset
        setTimeout(() => {
          if (isDemoMode) {
            // Reset skier but keep demo mode running
            skier.reset()
            skier.resetLives()
          }
        }, 2000)
      }

      // Simple automatic movement for demo mode
      const demoInputs = {
        left: Math.random() < 0.1,
        right: Math.random() < 0.1,
        up: false,
        down: false,
      }

      // Avoid obstacles by moving randomly
      skier.update(demoInputs, speed)
    } else {
      // Normal user controls
      skier.update(controls.getInputs(), speed)
    }

    // Update terrain with fixed speed
    terrainGenerator.update(speed * deltaTime * 60)

    // Update snow particles
    snowManager.update(deltaTime * 60, speed)

    // Update obstacles with skier position
    const skierPosition = skier.getPosition()
    obstacleManager.update(speed * deltaTime * 60, skierPosition)

    // Handle all collisions through the collision helper
    const collisionResult = collisionHelper.checkCollisions(score, speed, (isRunning) => {
      isGameRunning = isRunning
      if (!isRunning) {
        cancelAnimationFrame(animationFrameId)
      }
    })

    // Check if skier landed from a jump and update flip count
    const flipPoints = collisionHelper.checkFlips(score)
    if (flipPoints > 0) {
      score += flipPoints
    }

    // Update score if needed from collision rewards
    if (collisionResult?.scoreUpdate) {
      score += collisionResult.scoreUpdate
    }

    // Gradually increase speed - scale by delta time
    timeManager.increaseSpeed(deltaTime)

    // Update camera to follow skier
    updateCameraPosition()
  }

  // Animation loop
  const animate = (timestamp = 0) => {
    if (!isGameRunning) return

    // Update FPS counter and performance adjustments
    performanceManager.updateFpsCounter(timestamp)

    // Update time tracking
    const timeUpdate = timeManager.update(timestamp)

    // Only update game state if we have updates for this frame
    if (timeUpdate.hasUpdates) {
      updateGameState(timeUpdate.deltaTime)
    }

    // Render scene
    renderer.render(scene, camera)

    // Schedule next frame
    animationFrameId = requestAnimationFrame(animate)
  }

  // Reset the game state
  const resetGame = () => {
    // Cancel any existing animation frames to prevent duplicates
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    // Reset game state
    score = 0

    // Reset all managers
    timeManager.reset()
    terrainGenerator.reset()
    obstacleManager.reset()
    skier.reset()
    skier.resetLives()
    controls.reset()
    scoreManager.reset()
    performanceManager.reset()

    // Reset UI
    uiManager.cleanup()

    // Restart the game
    isGameRunning = true
    animate()
  }

  // Handle window resize
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  // Set demo mode (allows switching between demo and real play)
  const setDemoMode = (demoMode: boolean) => {
    // Only do something if changing the mode
    if (isDemoMode === demoMode) return

    // Update demo mode flag
    isDemoMode = demoMode

    if (!demoMode) {
      // Switching from demo to real play mode
      score = 0
      timeManager.setSpeed(0.1)

      // Reset game elements
      terrainGenerator.reset()
      obstacleManager.reset()
      skier.reset()
      skier.resetLives()
      controls.reset()
      scoreManager.reset()
    }

    // Update UI for demo mode
    uiManager.setDemoMode(demoMode)
  }

  // Initialize the game
  const initialize = () => {
    lightingManager.initialize()
    uiManager.initialize()
    terrainGenerator.initialize()
    obstacleManager.initialize()
    skier.initialize()
    snowManager.createSnowParticles()

    // Set up performance button handlers
    uiManager.setupPerformanceButtons({
      onLow: () => {
        performanceManager.applyPerformanceSettings('low')
        uiManager.updatePerformanceButtons('low')
      },
      onMedium: () => {
        performanceManager.applyPerformanceSettings('medium')
        uiManager.updatePerformanceButtons('medium')
      },
      onHigh: () => {
        performanceManager.applyPerformanceSettings('high')
        uiManager.updatePerformanceButtons('high')
      },
      onAuto: () => {
        performanceManager.applyPerformanceSettings('auto')
        uiManager.updatePerformanceButtons('auto')
      },
    })

    // Set up restart button handler
    uiManager.onRestartClick(resetGame)

    window.addEventListener('resize', handleResize)
  }

  // Start the game
  const start = (demoMode = false) => {
    // Set demo mode flag
    isDemoMode = demoMode

    initialize()
    isGameRunning = true

    // Update UI for demo mode
    uiManager.setDemoMode(demoMode)

    animate()
  }

  // Return the public API
  return {
    initialize,
    start,
    reset: resetGame,
    handleResize,
    setDemoMode,
    getGameTime: () => timeManager.gameTime,
  }
}
