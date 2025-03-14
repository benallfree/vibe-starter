import * as THREE from 'three'

type PerformanceMode = 'auto' | 'high' | 'medium' | 'low'

// Interface for the snow manager
interface SnowManager {
  setSnowCount: (count: number) => void
}

export const createPerformanceManager = (
  renderer: THREE.WebGLRenderer,
  snowManager: SnowManager
) => {
  let performanceMode: PerformanceMode = 'auto'
  let frameCount = 0
  let lastFpsUpdateTime = 0
  let currentFps = 60

  // Update performance monitoring
  const updateFpsCounter = (timestamp: number) => {
    if (lastFpsUpdateTime === 0) {
      lastFpsUpdateTime = timestamp
      return
    }

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

    return currentFps
  }

  // Apply performance settings
  const applyPerformanceSettings = (mode: PerformanceMode) => {
    if (mode === performanceMode) return

    performanceMode = mode

    switch (mode) {
      case 'low':
        snowManager.setSnowCount(500)
        renderer.setPixelRatio(Math.min(1.0, window.devicePixelRatio))
        break

      case 'medium':
        snowManager.setSnowCount(1000)
        renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio))
        break

      case 'high':
        snowManager.setSnowCount(2000)
        renderer.setPixelRatio(window.devicePixelRatio)
        break

      case 'auto':
        // Initial auto setting starts at medium
        // It will be automatically adjusted based on FPS
        snowManager.setSnowCount(1000)
        renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio))
        break
    }
  }

  // Auto-adjust based on FPS
  const adjustPerformance = (fps: number) => {
    if (fps < 30) {
      // Low performance - reduce quality
      applyPerformanceSettings('low')
    } else if (fps < 45) {
      // Medium performance
      applyPerformanceSettings('medium')
    } else {
      // High performance - use full quality
      applyPerformanceSettings('high')
    }
  }

  // Reset monitoring stats
  const reset = () => {
    frameCount = 0
    lastFpsUpdateTime = 0
    currentFps = 60
  }

  // Get current performance mode
  const getPerformanceMode = () => performanceMode

  return {
    updateFpsCounter,
    applyPerformanceSettings,
    reset,
    getPerformanceMode,
  }
}
