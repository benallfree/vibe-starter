// Define GameTime interface
export interface GameTime {
  getDeltaTime: () => number
  getSpeed: () => number
}

export const createTimeManager = (initialSpeed = 0.1) => {
  // Delta time and fixed time step settings
  const FIXED_TIME_STEP = 1 / 60 // 60 fps is our target
  const MAX_DELTA_TIME = 0.1 // Cap maximum delta to prevent large jumps

  let speed = initialSpeed
  let lastFrameTime = 0
  let accumulatedTime = 0
  let currentDeltaTime = FIXED_TIME_STEP

  // Define gameTime object
  const gameTime: GameTime = {
    getDeltaTime: () => currentDeltaTime,
    getSpeed: () => speed,
  }

  // Calculate and clamp delta time
  const calculateDeltaTime = (timestamp: number) => {
    if (lastFrameTime === 0) {
      lastFrameTime = timestamp
      return 0
    }

    const frameTimeDelta = (timestamp - lastFrameTime) / 1000
    lastFrameTime = timestamp

    // Clamp delta time to prevent large jumps (e.g., when tab was in background)
    return Math.min(frameTimeDelta, MAX_DELTA_TIME)
  }

  // Update time tracking
  const update = (timestamp: number) => {
    const clampedFrameDelta = calculateDeltaTime(timestamp)

    // Accumulate time and update in fixed time steps
    accumulatedTime += clampedFrameDelta

    // Store current delta time for other animations
    currentDeltaTime = FIXED_TIME_STEP

    // Handle fixed time steps
    let updatesThisFrame = 0
    let hasUpdates = false

    while (accumulatedTime >= FIXED_TIME_STEP && updatesThisFrame < 3) {
      accumulatedTime -= FIXED_TIME_STEP
      updatesThisFrame++
      hasUpdates = true
    }

    return {
      hasUpdates,
      updatesThisFrame,
      deltaTime: FIXED_TIME_STEP,
    }
  }

  // Increase game speed
  const increaseSpeed = (deltaTime: number) => {
    speed += 0.0001 * deltaTime * 60
  }

  // Set or get current speed
  const setSpeed = (newSpeed: number) => {
    speed = newSpeed
  }

  const getSpeed = () => speed

  // Reset all time-related state
  const reset = () => {
    speed = initialSpeed
    lastFrameTime = 0
    accumulatedTime = 0
    currentDeltaTime = FIXED_TIME_STEP
  }

  return {
    gameTime,
    update,
    increaseSpeed,
    setSpeed,
    getSpeed,
    reset,
    getFixedTimeStep: () => FIXED_TIME_STEP,
  }
}
