import { GameTime } from '../types'

// Create a game time manager for fixed timestep updates
export const createGameTime = (
  initialSpeed: number = 0.1,
  fixedTimeStep: number = 1 / 60,
  maxDeltaTime: number = 0.1
): GameTime & {
  update: (timestamp: number) => void
  setSpeed: (newSpeed: number) => void
  reset: () => void
} => {
  // Time tracking
  let lastFrameTime = 0
  let currentDeltaTime = fixedTimeStep
  let accumulatedTime = 0
  let speed = initialSpeed

  // Update time values based on current timestamp
  const update = (timestamp: number): void => {
    // Calculate real delta time
    if (lastFrameTime === 0) {
      lastFrameTime = timestamp
    }

    // Calculate delta time in seconds
    let deltaTime = (timestamp - lastFrameTime) / 1000

    // Cap maximum delta to prevent large jumps
    deltaTime = Math.min(deltaTime, maxDeltaTime)

    // Update for next frame
    lastFrameTime = timestamp
    currentDeltaTime = fixedTimeStep

    // Accumulate time for fixed-step updates
    accumulatedTime += deltaTime
  }

  // Set the game speed
  const setSpeed = (newSpeed: number): void => {
    speed = newSpeed
  }

  // Reset time tracking
  const reset = (): void => {
    lastFrameTime = 0
    currentDeltaTime = fixedTimeStep
    accumulatedTime = 0
    speed = initialSpeed
  }

  // Return the game time object plus utility methods
  return {
    getDeltaTime: () => currentDeltaTime,
    getSpeed: () => speed,
    update,
    setSpeed,
    reset,
  }
}
