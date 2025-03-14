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

  // Set up renderer
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

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

  // Game loop
  const animate = () => {
    if (!isGameRunning) return

    animationFrameId = requestAnimationFrame(animate)

    // Update terrain - move forward and generate new segments
    terrainGenerator.update(speed)

    // Update skier position based on controls
    skier.update(controls.getInputs())

    // Update obstacles position and check for collisions
    const collision = obstacleManager.update(speed, skier.getPosition())

    // Handle collision
    if (collision) {
      handleCollision()
    }

    // Increase speed gradually as game progresses
    // Make the speed increase proportional to current speed for a smoother acceleration
    speed += 0.0001 * (speed / 0.2)

    // Update score based on distance traveled
    score += speed
    scoreManager.updateScore(Math.floor(score))

    // Render the scene
    renderer.render(scene, camera)
  }

  // Handle collisions with obstacles
  const handleCollision = () => {
    isGameRunning = false
    cancelAnimationFrame(animationFrameId)
    alert(`Game Over! Your score: ${Math.floor(score)}`)
    // Reset game
    resetGame()
  }

  // Reset the game
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

    // Reset skier position
    skier.reset()

    // Reset controls
    controls.reset()

    // Clear score
    scoreManager.reset()

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
    terrainGenerator.initialize()
    obstacleManager.initialize()
    skier.initialize()
    scoreManager.initialize()
  }

  // Start the game
  const start = () => {
    initialize()
    isGameRunning = true
    animate()
  }

  // Return the public API
  return {
    start,
    handleResize,
    reset: resetGame,
  }
}
