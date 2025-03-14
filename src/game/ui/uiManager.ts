import { Position } from '../types'

// Types
interface SkierInterface {
  getLives: () => number
  gainExtraLife: () => boolean
  getPosition: () => Position
  createPointIndicator: (text: string, position: Position) => void
}

// UI manager factory
export const createUIManager = (container: HTMLElement, skier: SkierInterface) => {
  // UI elements
  let livesDisplay: HTMLElement | null = null
  let gameOverScreen: HTMLElement | null = null
  let lifeMessageDisplay: HTMLElement | null = null
  let lifeMessageTimeout: number | null = null
  let extraLifeMessageDisplay: HTMLElement | null = null

  // Create all UI elements
  const initialize = () => {
    createLivesDisplay()
    createLifeMessageDisplay()
    createGameOverScreen()
    createExtraLifeMessageDisplay()
  }

  // Create lives display
  const createLivesDisplay = () => {
    if (livesDisplay) return

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

  // Create life lost message
  const createLifeMessageDisplay = () => {
    if (lifeMessageDisplay) return

    lifeMessageDisplay = document.createElement('div')
    lifeMessageDisplay.id = 'life-message'
    lifeMessageDisplay.style.position = 'absolute'
    lifeMessageDisplay.style.bottom = '20%'
    lifeMessageDisplay.style.left = '50%'
    lifeMessageDisplay.style.transform = 'translate(-50%, 0)'
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

  // Create game over screen
  const createGameOverScreen = () => {
    if (gameOverScreen) return

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
    restartButton.id = 'restart-button'
    restartButton.textContent = 'Restart Game'
    restartButton.style.padding = '15px 30px'
    restartButton.style.fontSize = '20px'
    restartButton.style.backgroundColor = '#4CAF50'
    restartButton.style.border = 'none'
    restartButton.style.borderRadius = '5px'
    restartButton.style.cursor = 'pointer'

    gameOverScreen.appendChild(gameOverTitle)
    gameOverScreen.appendChild(scoreDisplay)
    gameOverScreen.appendChild(instructionsDiv)
    gameOverScreen.appendChild(performanceDiv)
    gameOverScreen.appendChild(restartButton)

    container.appendChild(gameOverScreen)
  }

  // Create extra life message
  const createExtraLifeMessageDisplay = () => {
    if (extraLifeMessageDisplay) return

    extraLifeMessageDisplay = document.createElement('div')
    extraLifeMessageDisplay.id = 'extra-life-message'
    extraLifeMessageDisplay.style.position = 'absolute'
    extraLifeMessageDisplay.style.bottom = '25%'
    extraLifeMessageDisplay.style.left = '50%'
    extraLifeMessageDisplay.style.transform = 'translate(-50%, 0)'
    extraLifeMessageDisplay.style.color = '#2fc82f'
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

  // Update lives display
  const updateLivesDisplay = (score: number, isDemoMode: boolean) => {
    if (!livesDisplay) return

    if (isDemoMode) {
      livesDisplay.style.display = 'none'
      return
    }

    livesDisplay.style.display = 'block'
    livesDisplay.innerHTML = `Lives: ${skier.getLives()} | Score: ${Math.floor(score)}`
  }

  // Show life lost message
  const showLifeLostMessage = () => {
    if (!lifeMessageDisplay) return

    const remainingLives = skier.getLives()

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

  // Show game over screen
  const showGameOverScreen = (score: number) => {
    if (!gameOverScreen) return

    gameOverScreen.style.display = 'flex'
    const finalScoreElement = gameOverScreen.querySelector('#final-score')
    if (finalScoreElement) {
      finalScoreElement.textContent = `Final Score: ${Math.floor(score)}`
    }
  }

  // Hide game over screen
  const hideGameOverScreen = () => {
    if (!gameOverScreen) return

    gameOverScreen.style.display = 'none'
  }

  // Show extra life message
  const showExtraLifeMessage = () => {
    if (!extraLifeMessageDisplay) return

    extraLifeMessageDisplay.style.display = 'block'

    // Hide after 2 seconds
    window.setTimeout(() => {
      if (extraLifeMessageDisplay) {
        extraLifeMessageDisplay.style.display = 'none'
      }
    }, 2000)
  }

  // Handle hot chocolate pickup UI effects
  const handleHotChocolatePickup = () => {
    const currentLives = skier.getLives()

    // Update message to show current lives
    if (extraLifeMessageDisplay) {
      extraLifeMessageDisplay.textContent = `☕ HOT CHOCOLATE! LIVES: ${currentLives} ☕`
    }

    // Show message
    showExtraLifeMessage()

    // Create floating point indicator
    skier.createPointIndicator('☕ +1 LIFE', skier.getPosition())
  }

  // Clean up any timeouts
  const cleanup = () => {
    if (lifeMessageTimeout !== null) {
      window.clearTimeout(lifeMessageTimeout)
      lifeMessageTimeout = null
    }

    if (lifeMessageDisplay) {
      lifeMessageDisplay.style.display = 'none'
    }

    if (extraLifeMessageDisplay) {
      extraLifeMessageDisplay.style.display = 'none'
    }
  }

  // Add event listener to restart button
  const onRestartClick = (callback: () => void) => {
    const restartButton = document.getElementById('restart-button')
    if (restartButton) {
      restartButton.onclick = () => {
        hideGameOverScreen()
        callback()
      }
    }
  }

  // Set up performance button event listeners
  const setupPerformanceButtons = (callbacks: {
    onLow: () => void
    onMedium: () => void
    onHigh: () => void
    onAuto: () => void
  }) => {
    setTimeout(() => {
      const lowBtn = document.getElementById('performance-low')
      const mediumBtn = document.getElementById('performance-medium')
      const highBtn = document.getElementById('performance-high')
      const autoBtn = document.getElementById('performance-auto')

      if (lowBtn) {
        lowBtn.addEventListener('click', callbacks.onLow)
      }

      if (mediumBtn) {
        mediumBtn.addEventListener('click', callbacks.onMedium)
      }

      if (highBtn) {
        highBtn.addEventListener('click', callbacks.onHigh)
      }

      if (autoBtn) {
        autoBtn.addEventListener('click', callbacks.onAuto)
      }
    }, 0)
  }

  // Update performance buttons to highlight the selected option
  const updatePerformanceButtons = (performanceMode: string) => {
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

  // Toggle UI visibility for demo mode
  const setDemoMode = (isDemoMode: boolean) => {
    if (livesDisplay) {
      livesDisplay.style.display = isDemoMode ? 'none' : 'block'
    }
  }

  return {
    initialize,
    updateLivesDisplay,
    showLifeLostMessage,
    showGameOverScreen,
    hideGameOverScreen,
    showExtraLifeMessage,
    handleHotChocolatePickup,
    cleanup,
    onRestartClick,
    setupPerformanceButtons,
    updatePerformanceButtons,
    setDemoMode,
  }
}
