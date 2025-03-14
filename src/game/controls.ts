// Controls for the skier
export const createControls = (skier: any) => {
  // Track key states
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
  }

  // Track touch input
  let touchStartX = 0
  let touchStartY = 0

  // Initialize event listeners
  const initialize = () => {
    // Keyboard controls
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Touch controls for mobile
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    // DeviceOrientation for mobile tilt controls
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation)
    }
  }

  // Reset controls state
  const reset = () => {
    // Reset all key states
    keys.left = false
    keys.right = false
    keys.up = false
    keys.down = false

    // Reset touch tracking
    touchStartX = 0
    touchStartY = 0

    // Remove any existing event listeners and reinitialize
    cleanup()
    initialize()
  }

  // Handle keydown events
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
      case 'a':
        keys.left = true
        break
      case 'ArrowRight':
      case 'd':
        keys.right = true
        break
      case 'ArrowUp':
      case 'w':
        keys.up = true
        break
      case 'ArrowDown':
      case 's':
        keys.down = true
        break
    }
  }

  // Handle keyup events
  const handleKeyUp = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
      case 'a':
        keys.left = false
        break
      case 'ArrowRight':
      case 'd':
        keys.right = false
        break
      case 'ArrowUp':
      case 'w':
        keys.up = false
        break
      case 'ArrowDown':
      case 's':
        keys.down = false
        break
    }
  }

  // Handle touch start
  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      touchStartX = event.touches[0].clientX
      touchStartY = event.touches[0].clientY
    }
  }

  // Handle touch move
  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      const touchX = event.touches[0].clientX
      const touchY = event.touches[0].clientY

      const deltaX = touchX - touchStartX
      const deltaY = touchY - touchStartY

      // Reset all keys first
      keys.left = false
      keys.right = false
      keys.up = false
      keys.down = false

      // Determine direction based on delta
      const threshold = 20 // Minimum distance to trigger movement

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          keys.right = true
        } else {
          keys.left = true
        }
      }

      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          keys.down = true
        } else {
          keys.up = true
        }
      }
    }
  }

  // Handle touch end
  const handleTouchEnd = () => {
    // Reset all keys
    keys.left = false
    keys.right = false
    keys.up = false
    keys.down = false
  }

  // Handle device orientation (tilt controls)
  const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    if (event.gamma === null) return

    // Reset horizontal movement keys
    keys.left = false
    keys.right = false

    // Gamma is the left-to-right tilt
    const tiltThreshold = 10
    if (event.gamma > tiltThreshold) {
      keys.right = true
    } else if (event.gamma < -tiltThreshold) {
      keys.left = true
    }
  }

  // Get current input state
  const getInputs = () => {
    return { ...keys }
  }

  // Clean up event listeners
  const cleanup = () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleTouchEnd)
    if (window.DeviceOrientationEvent) {
      window.removeEventListener('deviceorientation', handleDeviceOrientation)
    }
  }

  // Initialize controls right away
  initialize()

  // Return public API
  return {
    getInputs,
    cleanup,
    reset,
  }
}
