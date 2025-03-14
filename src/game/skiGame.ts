import * as THREE from 'three'
import { createControls } from './controls'
import { createObstacleManager } from './obstacleManager'
import { createScoreManager } from './scoreManager'
import { createSkier } from './skier'
import { createTerrainGenerator } from './terrainGenerator'

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

  // Snow particles
  let snowParticles: THREE.Points | null = null
  const SNOW_COUNT = 2000

  // UI elements
  let livesDisplay: HTMLElement | null = null
  let gameOverScreen: HTMLElement | null = null
  let lifeMessageDisplay: HTMLElement | null = null
  let lifeMessageTimeout: number | null = null

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
  const updateSnow = () => {
    if (!snowParticles) return

    const positions = snowParticles.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < SNOW_COUNT; i++) {
      // Make snow fall downward and slightly to the side (wind effect)
      positions[i * 3 + 1] -= Math.random() * 0.1 + 0.05 // y (fall speed)
      positions[i * 3] += (Math.random() - 0.5) * 0.05 // x (slight drift)
      positions[i * 3 + 2] += speed * 0.5 // z (move with player)

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

    // Create life lost message (hidden by default)
    if (!lifeMessageDisplay) {
      lifeMessageDisplay = document.createElement('div')
      lifeMessageDisplay.id = 'life-message'
      lifeMessageDisplay.style.position = 'absolute'
      lifeMessageDisplay.style.top = '50%'
      lifeMessageDisplay.style.left = '50%'
      lifeMessageDisplay.style.transform = 'translate(-50%, -50%)'
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
      gameOverScreen.appendChild(restartButton)

      container.appendChild(gameOverScreen)
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

  // Animation loop
  const animate = () => {
    if (!isGameRunning) return

    // Update score based on distance traveled
    score += speed * 10
    const currentScore = Math.floor(score)

    // Update UI
    if (livesDisplay) {
      livesDisplay.innerHTML = `Lives: ${skier.getLives()} | Score: ${currentScore}`
    }

    // Update skier with controls input
    skier.update(controls.getInputs())

    // Update terrain
    terrainGenerator.update(speed)

    // Update snow particles
    updateSnow()

    // Update obstacles and check for collisions
    const collisionResult = obstacleManager.update(speed, skier.getPosition())

    // Check if player crashed into a tree or rock
    if (collisionResult.collision) {
      handleCollision()
    }
    // Check if player hit a jump
    else if (collisionResult.jumpCollision) {
      // Trigger jump and flip
      skier.checkJumpCollision(collisionResult.obstacleType)

      // Add points for jumps
      score += 50
    }

    // Gradually increase speed
    speed += 0.0001

    // Render scene
    renderer.render(scene, camera)

    // Update camera to follow skier
    updateCameraPosition()

    // Continue animation loop (keeping only this call)
    animationFrameId = requestAnimationFrame(animate)
  }

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
  const start = () => {
    initialize()
    isGameRunning = true
    animate()
  }

  // Return the public API
  return {
    initialize,
    start,
    reset: resetGame,
  }
}
