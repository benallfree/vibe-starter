import * as THREE from 'three'
import { Obstacle, Position } from '../types'

// Define interfaces for the entities we'll be working with
interface Skier {
  getPosition: () => Position
  getIsTumbling: () => boolean
  getIsJumping: () => boolean
  startTumbling: () => void
  getLives: () => number
  gainExtraLife: () => boolean
  checkJumpCollision: (type: string, speed: number) => void
  getFlipCount: () => number
  resetFlipCount: () => void
}

interface ScoreManager {
  getLastJumpFlips: () => number
  addFlips: (count: number) => void
}

interface ObstacleManager {
  getObstacles: () => Obstacle[]
  isColliding: (playerPosition: Position, obstacle: Obstacle) => boolean
  update: (delta: number, playerPosition: Position) => void
}

interface UIManager {
  showLifeLostMessage: () => void
  showGameOverScreen: (score: number) => void
  handleHotChocolatePickup: () => void
}

export const createCollisionHelper = (
  scene: THREE.Scene,
  skier: Skier,
  obstacleManager: ObstacleManager,
  scoreManager: ScoreManager,
  uiManager: UIManager
) => {
  // Check for collisions with all obstacles
  const checkCollisions = (
    score: number,
    speed: number,
    setGameRunning: (isRunning: boolean) => void
  ) => {
    if (skier.getIsTumbling()) return { scoreUpdate: 0, hasCollided: false }

    const skierPosition = skier.getPosition()
    const obstacles = obstacleManager.getObstacles()
    let scoreUpdate = 0
    let hasCollided = false

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
    for (const obstacle of obstacles) {
      // Skip hot chocolates as we already handled them
      if (obstacle.type === 'hotChocolate') continue

      // Skip if we've already had a collision
      if (hasCollided) continue

      // Check if colliding with this obstacle
      if (obstacleManager.isColliding(skierPosition, obstacle)) {
        if (obstacle.type === 'jumpRamp' || obstacle.type === 'bannerJump') {
          // Only handle jump if we're not already tumbling
          if (!skier.getIsTumbling()) {
            // Handle jump ramp or banner jump
            skier.checkJumpCollision(obstacle.type, speed)

            // Add points based on jump type
            if (obstacle.type === 'jumpRamp') {
              // Regular jump ramp
              scoreUpdate += 10
            } else if (obstacle.type === 'bannerJump') {
              // Banner jumps are worth more
              scoreUpdate += 25

              // Log which banner was hit if available
              if ('bannerType' in obstacle && obstacle.bannerType) {
                console.log(`Hit ${obstacle.bannerType} banner!`)
              }
            }
          }
        } else if (obstacle.isCollidable && !skier.getIsJumping() && !skier.getIsTumbling()) {
          // Handle crash with tree or rock
          handleCollision(score, setGameRunning)
          hasCollided = true
        }
      }
    }

    return { scoreUpdate, hasCollided }
  }

  // Handle hot chocolate pickup
  const handleHotChocolatePickup = (obstacle: Obstacle) => {
    console.log('Hot chocolate picked up!')

    // Prevent double collection by marking it as not collidable first
    obstacle.isCollidable = false

    // Gain an extra life
    const lifeGained = skier.gainExtraLife()

    if (lifeGained) {
      // Update UI elements
      uiManager.handleHotChocolatePickup()
    }

    // Remove hot chocolate from scene
    if (obstacle.mesh) {
      scene.remove(obstacle.mesh)
    }
  }

  // Handle collision with obstacles
  const handleCollision = (score: number, setGameRunning: (isRunning: boolean) => void) => {
    // Start tumbling animation
    skier.startTumbling()

    // Show life lost message
    uiManager.showLifeLostMessage()

    // Check if out of lives
    if (skier.getLives() <= 0) {
      setGameRunning(false)
      uiManager.showGameOverScreen(score)
    }
  }

  // Check if skier landed from a jump and update flip count
  const checkFlips = (score: number) => {
    // Only check if we're not jumping anymore
    if (skier.getIsJumping()) return 0

    // See if we need to update flip count
    if (scoreManager.getLastJumpFlips() !== skier.getFlipCount()) {
      // Get flip count from skier
      const flipCount = skier.getFlipCount()

      // Only update if there were flips performed
      if (flipCount > 0) {
        // Add flips to score manager
        scoreManager.addFlips(flipCount)

        // Add points for flips (50 per flip)
        const flipPoints = flipCount * 50

        // Reset flip count after awarding points
        skier.resetFlipCount()

        return flipPoints
      }
    }

    return 0
  }

  return {
    checkCollisions,
    checkFlips,
  }
}
