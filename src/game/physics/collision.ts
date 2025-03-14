import { Obstacle, Position, Size } from '../types'

// Simple AABB collision check between player and obstacle
export const checkCollision = (
  playerPosition: Position,
  playerSize: Size,
  obstacle: Obstacle
): boolean => {
  // Check if player is jumping over the obstacle
  if (playerPosition.y > obstacle.position.y + obstacle.size.height) {
    return false
  }

  // Simple box collision detection
  const playerLeft = playerPosition.x - playerSize.width / 2
  const playerRight = playerPosition.x + playerSize.width / 2
  const playerTop = playerPosition.z - playerSize.depth / 2
  const playerBottom = playerPosition.z + playerSize.depth / 2

  const obstacleLeft = obstacle.position.x - obstacle.size.width / 2
  const obstacleRight = obstacle.position.x + obstacle.size.width / 2
  const obstacleTop = obstacle.position.z - obstacle.size.depth / 2
  const obstacleBottom = obstacle.position.z + obstacle.size.depth / 2

  // Check for overlap
  return (
    playerRight > obstacleLeft &&
    playerLeft < obstacleRight &&
    playerBottom > obstacleTop &&
    playerTop < obstacleBottom
  )
}

// Check if player is within a certain distance of an obstacle
export const isNearObstacle = (
  playerPosition: Position,
  obstacle: Position,
  distance: number
): boolean => {
  const dx = playerPosition.x - obstacle.x
  const dz = playerPosition.z - obstacle.z
  const distanceSquared = dx * dx + dz * dz

  return distanceSquared < distance * distance
}
