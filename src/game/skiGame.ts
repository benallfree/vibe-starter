import * as THREE from 'three'
import { createControls } from './controls'
import { createObstacleManager } from './obstacleManager'
import { createScoreManager } from './scoreManager'
import { createSkier } from './skier'
import { createTerrainGenerator } from './terrainGenerator'

// Define GameTime interface
interface GameTime {
  getDeltaTime: () => number
  getSpeed: () => number
}

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

  // Game speed and difficulty settings
  let speed = 0.1
  let score = 0
  let isGameRunning = false
  let animationFrameId = 0
  let lastFrameTime = 0

  // Delta time and fixed time step settings
  const FIXED_TIME_STEP = 1 / 60 // 60 fps is our target
  const MAX_DELTA_TIME = 0.1 // Cap maximum delta to prevent large jumps
  let accumulatedTime = 0
  let currentDeltaTime = FIXED_TIME_STEP

  // Performance monitoring
  let frameCount = 0
  let lastFpsUpdateTime = 0
  let currentFps = 60
  let performanceMode = 'auto' // 'auto', 'high', 'medium', 'low'

  // Define gameTime object
  const gameTime: GameTime = {
    getDeltaTime: () => currentDeltaTime,
    getSpeed: () => speed,
  }

  // Make this globally accessible for all animations
  const getFixedDeltaTime = () => FIXED_TIME_STEP
  const getCurrentSpeed = () => speed

  // Snow particles
  let snowParticles: THREE.Points | null = null
  let SNOW_COUNT = 2000 // Changed from const to let to allow performance adjustments

  // UI elements
  let livesDisplay: HTMLElement | null = null
  let gameOverScreen: HTMLElement | null = null
  let lifeMessageDisplay: HTMLElement | null = null
  let lifeMessageTimeout: number | null = null
  let extraLifeMessageDisplay: HTMLElement | null = null // New UI element for hot chocolate pickup

  // Demo mode flag
  let isDemoMode = false

  // Set up renderer
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  // Create snow particles
  const createSnowParticles = () => {
    // Create snow particles
    const snowGeometry = new THREE.BufferGeometry()
    const snowPositions = new Float32Array(SNOW_COUNT * 3)
    const snowSizes = new Float32Array(SNOW_COUNT)

    for (let i = 0; i < SNOW_COUNT; i++) {
      // Random position in a wide area around the player
      snowPositions[i * 3] = (Math.random() - 0.5) * 50 // x
      snowPositions[i * 3 + 1] = Math.random() * 30 // y
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 80 - 20 // z

      // Random sizes between 0.1 and 0.3
      snowSizes[i] = Math.random() * 0.2 + 0.1
    }

    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3))
    snowGeometry.setAttribute('size', new THREE.BufferAttribute(snowSizes, 1))

    // Create snow material with custom shader
    const snowMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      map: createSnowflakeTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    // Create snow points
    snowParticles = new THREE.Points(snowGeometry, snowMaterial)
    scene.add(snowParticles)
  }

  // Create a texture for snowflakes
  const createSnowflakeTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64

    const context = canvas.getContext('2d')
    if (!context) return new THREE.Texture()

    // Draw a white circle with soft edges
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = canvas.width / 4

    context.beginPath()
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false)

    // Create gradient
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    context.fillStyle = gradient
    context.fill()

    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    return texture
  }

  // Update snow particles
  const updateSnow = (deltaTime: number) => {
    if (!snowParticles) return

    const positions = snowParticles.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < SNOW_COUNT; i++) {
      // Make snow fall downward and slightly to the side (wind effect)
      positions[i * 3 + 1] -= Math.random() * 0.1 + 0.05 // y (fall speed)
      positions[i * 3] += (Math.random() - 0.5) * 0.05 // x (slight drift)
      positions[i * 3 + 2] += speed * 0.5 * deltaTime // z (move with player)

      // Reset if out of view
      if (positions[i * 3 + 1] < -5) {
        positions[i * 3 + 1] = 20 + Math.random() * 10
        positions[i * 3] = (Math.random() - 0.5) * 50
        positions[i * 3 + 2] = -40 + (Math.random() - 0.5) * 40
      }

      // Reset if too far behind
      if (positions[i * 3 + 2] > 15) {
        positions[i * 3 + 2] = -40 + Math.random() * 10
      }
    }

    snowParticles.geometry.attributes.position.needsUpdate = true
  }

  // Set up lighting
  const setupLighting = () => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    // Directional light (sunlight)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8)
    sunLight.position.set(10, 20, 10)
    sunLight.castShadow = true

    // Configure shadow properties
    sunLight.shadow.mapSize.width = 1024
    sunLight.shadow.mapSize.height = 1024
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 50

    scene.add(sunLight)

    // Enable shadows
    renderer.shadowMap.enabled = true
  }

  // Set camera position
  camera.position.set(0, 5, 10) // Behind and above the skier
  camera.lookAt(0, 0, -10)

  // Create terrain generator
  const terrainGenerator = createTerrainGenerator(scene)

  // Create the player's skier
  const skier = createSkier(scene)

  // Create control system
  const controls = createControls(skier)

  // Create obstacle manager
  const obstacleManager = createObstacleManager(scene)

  // Create score manager
  const scoreManager = createScoreManager()

  // Create UI elements
  const createUI = () => {
    // Create lives display
    if (!livesDisplay) {
      livesDisplay = document.createElement('div')
      livesDisplay.id = 'lives-display'
      livesDisplay.style.position = 'absolute'
      livesDisplay.style.top = '20px'
      livesDisplay.style.left = '20px'
      livesDisplay.style.color = 'white'
      livesDisplay.style.fontSize = '24px'
      livesDisplay.style.fontFamily = 'Arial, sans-serif'
      livesDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
      livesDisplay.style.padding = '10px 20px'
      livesDisplay.style.borderRadius = '5px'
      livesDisplay.style.textShadow = '1px 1px 2px #000'
      container.appendChild(livesDisplay)
    }

    // Create life lost message (hidden by default, positioned below skier)
    if (!lifeMessageDisplay) {
      lifeMessageDisplay = document.createElement('div')
      lifeMessageDisplay.id = 'life-message'
      lifeMessageDisplay.style.position = 'absolute'
      lifeMessageDisplay.style.bottom = '20%' // Position below skier
      lifeMessageDisplay.style.left = '50%'
      lifeMessageDisplay.style.transform = 'translate(-50%, 0)' // Adjust transform for bottom positioning
      lifeMessageDisplay.style.color = 'red'
      lifeMessageDisplay.style.fontSize = '36px'
      lifeMessageDisplay.style.fontFamily = 'Arial, sans-serif'
      lifeMessageDisplay.style.fontWeight = 'bold'
      lifeMessageDisplay.style.textShadow = '2px 2px 4px #000'
      lifeMessageDisplay.style.display = 'none'
      lifeMessageDisplay.style.padding = '15px 30px'
      lifeMessageDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
      lifeMessageDisplay.style.borderRadius = '10px'
      lifeMessageDisplay.style.zIndex = '200'
      container.appendChild(lifeMessageDisplay)
    }

    // Create game over screen (hidden by default)
    if (!gameOverScreen) {
      gameOverScreen = document.createElement('div')
      gameOverScreen.id = 'game-over-screen'
      gameOverScreen.style.position = 'absolute'
      gameOverScreen.style.top = '0'
      gameOverScreen.style.left = '0'
      gameOverScreen.style.width = '100%'
      gameOverScreen.style.height = '100%'
      gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
      gameOverScreen.style.color = 'white'
      gameOverScreen.style.display = 'flex'
      gameOverScreen.style.flexDirection = 'column'
      gameOverScreen.style.alignItems = 'center'
      gameOverScreen.style.justifyContent = 'center'
      gameOverScreen.style.fontSize = '32px'
      gameOverScreen.style.fontFamily = 'Arial, sans-serif'
      gameOverScreen.style.display = 'none'

      const gameOverTitle = document.createElement('h1')
      gameOverTitle.textContent = 'GAME OVER'
      gameOverTitle.style.marginBottom = '20px'

      const scoreDisplay = document.createElement('div')
      scoreDisplay.id = 'final-score'
      scoreDisplay.style.marginBottom = '40px'

      // Add instructions to game over screen
      const instructionsDiv = document.createElement('div')
      instructionsDiv.className = 'controls-info'
      instructionsDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
      instructionsDiv.style.padding = '20px'
      instructionsDiv.style.borderRadius = '10px'
      instructionsDiv.style.marginBottom = '30px'
      instructionsDiv.style.maxWidth = '400px'
      instructionsDiv.style.textAlign = 'left'
      instructionsDiv.style.fontSize = '18px'

      instructionsDiv.innerHTML = `
        <h3>Controls:</h3>
        <ul>
          <li>Arrow Keys or WASD: Move the skier</li>
          <li>Mobile: Tilt device or touch screen</li>
          <li>Avoid trees and rocks</li>
          <li>Use ramps for big air!</li>
          <li>Collect hot chocolate for extra lives</li>
        </ul>
      `

      // Add performance settings
      const performanceDiv = document.createElement('div')
      performanceDiv.className = 'performance-settings'
      performanceDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
      performanceDiv.style.padding = '15px'
      performanceDiv.style.borderRadius = '10px'
      performanceDiv.style.marginBottom = '20px'
      performanceDiv.style.maxWidth = '400px'
      performanceDiv.style.textAlign = 'center'
      performanceDiv.style.fontSize = '16px'

      performanceDiv.innerHTML = `
        <h3>Performance Settings:</h3>
        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
          <button id="performance-low" style="padding: 8px 12px; background-color: #777; border: none; color: white; border-radius: 4px;">Low</button>
          <button id="performance-medium" style="padding: 8px 12px; background-color: #777; border: none; color: white; border-radius: 4px;">Medium</button>
          <button id="performance-high" style="padding: 8px 12px; background-color: #777; border: none; color: white; border-radius: 4px;">High</button>
          <button id="performance-auto" style="padding: 8px 12px; background-color: #4CAF50; border: none; color: white; border-radius: 4px;">Auto</button>
        </div>
      `

      const restartButton = document.createElement('button')
      restartButton.textContent = 'Restart Game'
      restartButton.style.padding = '15px 30px'
      restartButton.style.fontSize = '20px'
      restartButton.style.backgroundColor = '#4CAF50'
      restartButton.style.border = 'none'
      restartButton.style.borderRadius = '5px'
      restartButton.style.cursor = 'pointer'
      restartButton.onclick = () => {
        hideGameOverScreen()
        resetGame()
      }

      gameOverScreen.appendChild(gameOverTitle)
      gameOverScreen.appendChild(scoreDisplay)
      gameOverScreen.appendChild(instructionsDiv)
      gameOverScreen.appendChild(performanceDiv)
      gameOverScreen.appendChild(restartButton)

      container.appendChild(gameOverScreen)

      // Add event listeners for performance buttons
      setTimeout(() => {
        const lowBtn = document.getElementById('performance-low')
        const mediumBtn = document.getElementById('performance-medium')
        const highBtn = document.getElementById('performance-high')
        const autoBtn = document.getElementById('performance-auto')

        if (lowBtn) {
          lowBtn.addEventListener('click', () => {
            performanceMode = 'low'
            SNOW_COUNT = 500
            renderer.setPixelRatio(Math.min(1.0, window.devicePixelRatio))
            updatePerformanceButtons()

            if (snowParticles) {
              scene.remove(snowParticles)
              createSnowParticles()
            }
          })
        }

        if (mediumBtn) {
          mediumBtn.addEventListener('click', () => {
            performanceMode = 'medium'
            SNOW_COUNT = 1000
            renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio))
            updatePerformanceButtons()

            if (snowParticles) {
              scene.remove(snowParticles)
              createSnowParticles()
            }
          })
        }

        if (highBtn) {
          highBtn.addEventListener('click', () => {
            performanceMode = 'high'
            SNOW_COUNT = 2000
            renderer.setPixelRatio(window.devicePixelRatio)
            updatePerformanceButtons()

            if (snowParticles) {
              scene.remove(snowParticles)
              createSnowParticles()
            }
          })
        }

        if (autoBtn) {
          autoBtn.addEventListener('click', () => {
            performanceMode = 'auto'
            updatePerformanceButtons()
          })
        }
      }, 0)
    }

    // Create extra life message (hidden initially, positioned below skier)
    if (!extraLifeMessageDisplay) {
      extraLifeMessageDisplay = document.createElement('div')
      extraLifeMessageDisplay.id = 'extra-life-message'
      extraLifeMessageDisplay.style.position = 'absolute'
      extraLifeMessageDisplay.style.bottom = '25%' // Position below skier
      extraLifeMessageDisplay.style.left = '50%'
      extraLifeMessageDisplay.style.transform = 'translate(-50%, 0)' // Adjust transform for bottom positioning
      extraLifeMessageDisplay.style.color = '#2fc82f' // Green color for good things
      extraLifeMessageDisplay.style.fontSize = '36px'
      extraLifeMessageDisplay.style.fontFamily = 'Arial, sans-serif'
      extraLifeMessageDisplay.style.fontWeight = 'bold'
      extraLifeMessageDisplay.style.textShadow = '2px 2px 4px #000'
      extraLifeMessageDisplay.style.display = 'none'
      extraLifeMessageDisplay.style.padding = '15px 30px'
      extraLifeMessageDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
      extraLifeMessageDisplay.style.borderRadius = '10px'
      extraLifeMessageDisplay.style.zIndex = '200'
      extraLifeMessageDisplay.textContent = '☕ HOT CHOCOLATE! +1 LIFE ☕'
      container.appendChild(extraLifeMessageDisplay)
    }
  }

  // Update lives display
  const updateLivesDisplay = () => {
    if (livesDisplay) {
      livesDisplay.textContent = `Lives: ${skier.getLives()}`
    }
  }

  // Show life lost message
  const showLifeLostMessage = () => {
    const remainingLives = skier.getLives()

    if (lifeMessageDisplay) {
      // Clear any existing timeout
      if (lifeMessageTimeout !== null) {
        window.clearTimeout(lifeMessageTimeout)
      }

      if (remainingLives > 0) {
        lifeMessageDisplay.textContent = `Ouch! ${remainingLives} ${remainingLives === 1 ? 'life' : 'lives'} remaining`
      } else {
        lifeMessageDisplay.textContent = 'Last life lost!'
      }

      lifeMessageDisplay.style.display = 'block'

      // Hide message after 2 seconds
      lifeMessageTimeout = window.setTimeout(() => {
        if (lifeMessageDisplay) {
          lifeMessageDisplay.style.display = 'none'
        }
        lifeMessageTimeout = null
      }, 2000)
    }
  }

  // Show game over screen
  const showGameOverScreen = () => {
    if (gameOverScreen) {
      gameOverScreen.style.display = 'flex'
      const finalScoreElement = gameOverScreen.querySelector('#final-score')
      if (finalScoreElement) {
        finalScoreElement.textContent = `Final Score: ${Math.floor(score)}`
      }
    }
  }

  // Hide game over screen
  const hideGameOverScreen = () => {
    if (gameOverScreen) {
      gameOverScreen.style.display = 'none'
    }
  }

  // Show extra life message
  const showExtraLifeMessage = () => {
    if (extraLifeMessageDisplay) {
      extraLifeMessageDisplay.style.display = 'block'

      // Hide after 2 seconds
      window.setTimeout(() => {
        if (extraLifeMessageDisplay) {
          extraLifeMessageDisplay.style.display = 'none'
        }
      }, 2000)
    }
  }

  // Handle hot chocolate pickup
  const handleHotChocolatePickup = (obstacle: any) => {
    console.log('Hot chocolate picked up!')

    // Prevent double collection by marking it as not collidable first
    obstacle.isCollidable = false

    // Gain an extra life
    const lifeGained = skier.gainExtraLife()

    if (lifeGained) {
      const currentLives = skier.getLives()
      console.log('Extra life gained! Lives now:', currentLives)

      // Update message to show current lives
      if (extraLifeMessageDisplay) {
        extraLifeMessageDisplay.textContent = `☕ HOT CHOCOLATE! LIVES: ${currentLives} ☕`
      }

      // Show message
      showExtraLifeMessage()

      // Update the UI
      updateLivesDisplay()

      // Create floating point indicator
      skier.createPointIndicator('☕', skier.getPosition())
    }

    // Remove hot chocolate from scene
    scene.remove(obstacle.mesh)
  }

  // Animation loop
  const animate = (timestamp = 0) => {
    if (!isGameRunning) return

    // Calculate actual delta time in seconds
    if (lastFrameTime === 0) {
      lastFrameTime = timestamp
      lastFpsUpdateTime = timestamp
    }

    const frameTimeDelta = (timestamp - lastFrameTime) / 1000
    lastFrameTime = timestamp

    // Update FPS counter
    frameCount++
    if (timestamp - lastFpsUpdateTime >= 1000) {
      currentFps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdateTime))

      // Auto-adjust quality based on performance
      if (performanceMode === 'auto') {
        adjustPerformance(currentFps)
      }

      // Reset frame counter
      frameCount = 0
      lastFpsUpdateTime = timestamp
    }

    // Clamp delta time to prevent large jumps (e.g., when tab was in background)
    const clampedFrameDelta = Math.min(frameTimeDelta, MAX_DELTA_TIME)

    // Accumulate time and update in fixed time steps
    accumulatedTime += clampedFrameDelta

    // Store current delta time for other animations
    currentDeltaTime = FIXED_TIME_STEP

    // Update in fixed steps
    let updatesThisFrame = 0
    while (accumulatedTime >= FIXED_TIME_STEP && updatesThisFrame < 3) {
      // Update game state with fixed time step
      updateGameState(FIXED_TIME_STEP)
      accumulatedTime -= FIXED_TIME_STEP
      updatesThisFrame++
    }

    // Render scene
    renderer.render(scene, camera)

    // Schedule next frame
    animationFrameId = requestAnimationFrame(animate)
  }

  // Adjust performance settings based on FPS
  const adjustPerformance = (fps: number) => {
    if (fps < 30) {
      // Low performance - reduce quality
      if (performanceMode !== 'low') {
        performanceMode = 'low'
        SNOW_COUNT = 500 // Reduce snow particles
        renderer.setPixelRatio(Math.min(1.0, window.devicePixelRatio))

        // Recreate snow with fewer particles
        if (snowParticles) {
          scene.remove(snowParticles)
          createSnowParticles()
        }
      }
    } else if (fps < 45) {
      // Medium performance
      if (performanceMode !== 'medium') {
        performanceMode = 'medium'
        SNOW_COUNT = 1000
        renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio))

        // Recreate snow with moderate particles
        if (snowParticles) {
          scene.remove(snowParticles)
          createSnowParticles()
        }
      }
    } else {
      // High performance - use full quality
      if (performanceMode !== 'high') {
        performanceMode = 'high'
        SNOW_COUNT = 2000
        renderer.setPixelRatio(window.devicePixelRatio)

        // Recreate snow with full particles
        if (snowParticles) {
          scene.remove(snowParticles)
          createSnowParticles()
        }
      }
    }
  }

  // Update game state with fixed time step
  const updateGameState = (deltaTime: number) => {
    // Update score based on distance traveled (only if not in demo mode)
    if (!isDemoMode) {
      score += speed * 10 * deltaTime * 60 // Scale to make it similar to original timing
    }
    const currentScore = Math.floor(score)

    // Update UI (hide UI elements in demo mode)
    if (livesDisplay) {
      if (isDemoMode) {
        livesDisplay.style.display = 'none'
      } else {
        livesDisplay.style.display = 'block'
        livesDisplay.innerHTML = `Lives: ${skier.getLives()} | Score: ${currentScore}`
      }
    }

    // If in demo mode, automatically reset if skier crashes
    if (isDemoMode && skier.getIsTumbling()) {
      // Wait 2 seconds then reset
      setTimeout(() => {
        if (isDemoMode) {
          // Reset skier but keep demo mode running
          skier.reset()
          skier.resetLives()
        }
      }, 2000)
    }

    // Update skier with controls input
    // In demo mode, let the skier move automatically
    if (isDemoMode) {
      // Simple automatic movement for demo mode
      const demoInputs = {
        left: Math.random() < 0.1,
        right: Math.random() < 0.1,
        up: false,
        down: false,
      }

      // Avoid obstacles by moving randomly
      skier.update(demoInputs, speed, deltaTime * 60) // Scale for compatibility with original speeds
    } else {
      // Normal user controls
      skier.update(controls.getInputs(), speed, deltaTime * 60) // Scale for compatibility with original speeds
    }

    // Check if skier landed from a jump and update flip count in score manager
    if (!skier.getIsJumping() && scoreManager.getLastJumpFlips() !== skier.getFlipCount()) {
      // Get flip count from skier
      const flipCount = skier.getFlipCount()

      // Only update if there were flips performed
      if (flipCount > 0) {
        // Add flips to score manager
        scoreManager.addFlips(flipCount)

        // Add points for flips (50 per flip)
        score += flipCount * 50

        // Reset flip count after awarding points
        skier.resetFlipCount()
      }
    }

    // Update terrain with fixed speed
    terrainGenerator.update(speed * deltaTime * 60)

    // Update snow particles
    updateSnow(deltaTime * 60)

    // Get current skier position for collision detection
    const skierPosition = skier.getPosition()

    // Update obstacles
    obstacleManager.update(speed * deltaTime * 60, skierPosition)

    // Check for collisions with all obstacle types
    // First, prioritize checking for hot chocolate pickups
    const obstacles = obstacleManager.getObstacles()

    // Don't check for collisions if already tumbling
    if (!skier.getIsTumbling()) {
      // First pass: check only for hot chocolate (higher priority)
      for (const obstacle of obstacles) {
        if (
          obstacle.type === 'hotChocolate' &&
          obstacle.isPickup &&
          obstacle.isCollidable &&
          obstacleManager.isColliding(skierPosition, obstacle)
        ) {
          handleHotChocolatePickup(obstacle)
          // Continue the loop as we want to check all hot chocolates
        }
      }

      // Second pass: check for jumps and crashes
      let hasCollided = false
      for (const obstacle of obstacles) {
        // Skip hot chocolates as we already handled them
        if (obstacle.type === 'hotChocolate') continue

        // Skip if we've already had a collision
        if (hasCollided) continue

        // Check if colliding with this obstacle
        if (obstacleManager.isColliding(skierPosition, obstacle)) {
          if (obstacle.type === 'jumpRamp') {
            // Handle jump ramp
            skier.checkJumpCollision(obstacle.type, speed)
            // Add points for jumps
            score += 10
          } else if (obstacle.isCollidable && !skier.getIsJumping()) {
            // Handle crash with tree or rock
            handleCollision()
            hasCollided = true
          }
        }
      }
    }

    // Gradually increase speed - scale by delta time
    speed += 0.0001 * deltaTime * 60

    // Update camera to follow skier
    updateCameraPosition()
  }

  // Expose gameTime globally so other modules can access it
  ;(window as any).gameTime = gameTime

  // Update camera position to follow skier
  const updateCameraPosition = () => {
    const skierPosition = skier.getPosition()
    camera.position.x = skierPosition.x
    camera.position.z = skierPosition.z + 10
    camera.position.y = skierPosition.y + 5
    camera.lookAt(skierPosition.x, skierPosition.y, skierPosition.z - 10)
  }

  // Handle collisions
  const handleCollision = () => {
    // Start tumbling animation
    skier.startTumbling()

    // Show life lost message
    showLifeLostMessage()

    // Check if out of lives
    if (skier.getLives() <= 0) {
      isGameRunning = false
      cancelAnimationFrame(animationFrameId)
      showGameOverScreen()
    }
  }

  // Reset the game state
  const resetGame = () => {
    // Cancel any existing animation frames to prevent duplicates
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    speed = 0.1
    score = 0
    lastFrameTime = 0
    accumulatedTime = 0
    currentDeltaTime = FIXED_TIME_STEP

    // Reset terrain
    terrainGenerator.reset()

    // Reset obstacles
    obstacleManager.reset()

    // Reset skier position and lives
    skier.reset()
    skier.resetLives()

    // Reset controls
    controls.reset()

    // Reset score
    scoreManager.reset()

    // Update lives display
    updateLivesDisplay()

    // Hide game over screen
    hideGameOverScreen()

    // Clear any active life message
    if (lifeMessageTimeout !== null) {
      window.clearTimeout(lifeMessageTimeout)
      lifeMessageTimeout = null
    }

    if (lifeMessageDisplay) {
      lifeMessageDisplay.style.display = 'none'
    }

    // Clear extra life message too
    if (extraLifeMessageDisplay) {
      extraLifeMessageDisplay.style.display = 'none'
    }

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
      // Reset the game state for a fresh start but maintain skier instance
      score = 0
      speed = 0.1

      // Reset terrain and obstacles
      terrainGenerator.reset()
      obstacleManager.reset()

      // Reset skier position and lives but don't recreate the skier
      skier.reset()
      skier.resetLives()

      // Reset controls and score
      controls.reset()
      scoreManager.reset()

      // Show UI elements
      if (livesDisplay) {
        livesDisplay.style.display = 'block'
      }

      // Update lives display
      updateLivesDisplay()
    } else {
      // Switching to demo mode
      // Hide UI elements
      if (livesDisplay) {
        livesDisplay.style.display = 'none'
      }
    }
  }

  // Initialize the game
  const initialize = () => {
    setupLighting()
    createUI()
    updateLivesDisplay()
    terrainGenerator.initialize()
    obstacleManager.initialize()
    skier.initialize()
    createSnowParticles()

    window.addEventListener('resize', handleResize)
  }

  // Start the game
  const start = (demoMode = false) => {
    // Set demo mode flag
    isDemoMode = demoMode

    initialize()
    isGameRunning = true

    // In demo mode, hide some UI elements
    if (isDemoMode && livesDisplay) {
      livesDisplay.style.display = 'none'
    }

    animate()
  }

  // Update performance buttons to highlight the selected option
  const updatePerformanceButtons = () => {
    const btns = {
      low: document.getElementById('performance-low'),
      medium: document.getElementById('performance-medium'),
      high: document.getElementById('performance-high'),
      auto: document.getElementById('performance-auto'),
    }

    // Reset all buttons
    Object.values(btns).forEach((btn) => {
      if (btn) btn.style.backgroundColor = '#777'
    })

    // Highlight the selected button
    const selectedBtn = btns[performanceMode as keyof typeof btns]
    if (selectedBtn) {
      selectedBtn.style.backgroundColor = '#4CAF50'
    }
  }

  // Return the public API
  return {
    initialize,
    start,
    reset: resetGame,
    handleResize,
    setDemoMode,
    getGameTime: () => gameTime,
  }
}
