import { createUIContainer, createUIElement, showTemporaryMessage } from '../utils/ui'

// Create and manage the game UI
export const createUIManager = () => {
  // UI elements
  let scoreContainer: HTMLElement | null = null
  let scoreElement: HTMLElement | null = null
  let flipElement: HTMLElement | null = null
  let comboElement: HTMLElement | null = null
  let livesDisplay: HTMLElement | null = null
  let gameOverScreen: HTMLElement | null = null
  let splashScreen: HTMLElement | null = null

  // Initialize UI elements
  const initialize = () => {
    // Create score container and displays
    scoreContainer = createUIContainer('score-container', 'top-right')

    // Score label and display
    const scoreLabel = createUIElement('score-label', 'div', scoreContainer)
    scoreLabel.textContent = 'SCORE'
    scoreLabel.style.fontSize = '14px'
    scoreLabel.style.marginBottom = '5px'

    scoreElement = createUIElement('score-display', 'div', scoreContainer)
    scoreElement.textContent = '0'
    scoreElement.style.fontSize = '24px'
    scoreElement.style.fontWeight = 'bold'

    // Flip tracker
    const flipLabel = createUIElement('flip-label', 'div', scoreContainer)
    flipLabel.textContent = 'TOTAL FLIPS'
    flipLabel.style.fontSize = '14px'
    flipLabel.style.marginTop = '10px'
    flipLabel.style.marginBottom = '5px'

    flipElement = createUIElement('flip-display', 'div', scoreContainer)
    flipElement.textContent = '0'
    flipElement.style.fontSize = '20px'

    // Combo tracker
    const comboLabel = createUIElement('combo-label', 'div', scoreContainer)
    comboLabel.textContent = 'FLIP COMBO'
    comboLabel.style.fontSize = '14px'
    comboLabel.style.marginTop = '10px'
    comboLabel.style.marginBottom = '5px'

    comboElement = createUIElement('combo-display', 'div', scoreContainer)
    comboElement.textContent = '0'
    comboElement.style.fontSize = '20px'
    comboElement.style.color = '#ffdd00'

    // Lives display
    createLivesDisplay()

    // Game over screen (initially hidden)
    createGameOverScreen()

    // Get existing splash screen from HTML
    splashScreen = document.getElementById('splash-screen')

    // Reset displays
    updateScore(0)
    updateFlips(0)
    updateFlipCombo(0)
    updateLives(3)
  }

  // Create lives display
  const createLivesDisplay = () => {
    const livesContainer = createUIContainer('lives-container', 'top-left')

    const livesLabel = createUIElement('lives-label', 'div', livesContainer)
    livesLabel.textContent = 'LIVES'
    livesLabel.style.fontSize = '14px'
    livesLabel.style.marginBottom = '5px'

    livesDisplay = createUIElement('lives-display', 'div', livesContainer)
    livesDisplay.style.fontSize = '24px'
    livesDisplay.style.fontWeight = 'bold'
  }

  // Create game over screen
  const createGameOverScreen = () => {
    gameOverScreen = createUIContainer('game-over-screen', 'center')
    gameOverScreen.style.width = '60%'
    gameOverScreen.style.maxWidth = '500px'
    gameOverScreen.style.textAlign = 'center'
    gameOverScreen.style.padding = '30px'
    gameOverScreen.style.display = 'none' // Initially hidden

    const gameOverTitle = createUIElement('game-over-title', 'div', gameOverScreen)
    gameOverTitle.textContent = 'GAME OVER'
    gameOverTitle.style.fontSize = '36px'
    gameOverTitle.style.fontWeight = 'bold'
    gameOverTitle.style.marginBottom = '20px'

    const finalScoreLabel = createUIElement('final-score-label', 'div', gameOverScreen)
    finalScoreLabel.textContent = 'Final Score:'
    finalScoreLabel.style.fontSize = '24px'
    finalScoreLabel.style.marginBottom = '5px'

    const finalScore = createUIElement('final-score', 'div', gameOverScreen)
    finalScore.textContent = '0'
    finalScore.style.fontSize = '36px'
    finalScore.style.fontWeight = 'bold'
    finalScore.style.marginBottom = '30px'

    const restartButton = createUIElement('restart-button', 'button', gameOverScreen)
    restartButton.textContent = 'PLAY AGAIN'
    restartButton.style.fontSize = '24px'
    restartButton.style.padding = '10px 30px'
    restartButton.style.backgroundColor = '#4CAF50'
    restartButton.style.border = 'none'
    restartButton.style.borderRadius = '5px'
    restartButton.style.cursor = 'pointer'

    const bannerLink = createUIElement('banner-link', 'div', gameOverScreen)
    bannerLink.innerHTML =
      'Buy a Banner: <a href="mailto:gnar@benallfree.com" style="color: #4CAF50;">gnar@benallfree.com</a>'
    bannerLink.style.marginTop = '20px'
    bannerLink.style.fontSize = '14px'
  }

  // Update score display
  const updateScore = (score: number) => {
    if (scoreElement) {
      scoreElement.textContent = score.toString()
    }

    // Also update final score in game over screen
    const finalScore = document.getElementById('final-score')
    if (finalScore) {
      finalScore.textContent = score.toString()
    }
  }

  // Update lives display
  const updateLives = (lives: number) => {
    if (livesDisplay) {
      // Create heart symbols
      livesDisplay.textContent = '❤️'.repeat(lives)
    }
  }

  // Update total flips display
  const updateFlips = (flips: number) => {
    if (flipElement) {
      flipElement.textContent = flips.toString()
    }
  }

  // Update current flip combo display
  const updateFlipCombo = (combo: number) => {
    if (!comboElement) return

    comboElement.textContent = combo.toString()

    // Change color based on combo count
    if (combo === 0) {
      comboElement.style.color = '#ffffff'
    } else if (combo === 1) {
      comboElement.style.color = '#ffdd00' // Gold for 1 flip
    } else if (combo === 2) {
      comboElement.style.color = '#00ffff' // Cyan for 2 flips
    } else {
      comboElement.style.color = '#ff00ff' // Purple for 3+ flips - impressive!
    }

    // Animate size on new combo
    comboElement.style.fontSize = '28px'
    setTimeout(() => {
      if (comboElement) {
        comboElement.style.fontSize = '20px'
        comboElement.style.transition = 'font-size 0.3s ease-out'
      }
    }, 50)
  }

  // Show life lost message
  const showLifeLostMessage = () => {
    showTemporaryMessage('Life Lost! ❤️', 2000, 'behind-player')
  }

  // Show extra life message
  const showExtraLifeMessage = () => {
    showTemporaryMessage('Extra Life! ❤️', 2000, 'behind-player')
  }

  // Show game over screen
  const showGameOverScreen = (finalScore: number) => {
    if (!gameOverScreen) return

    // Update final score
    const finalScoreElement = document.getElementById('final-score')
    if (finalScoreElement) {
      finalScoreElement.textContent = finalScore.toString()
    }

    // Show game over screen
    gameOverScreen.style.display = 'block'
  }

  // Hide game over screen
  const hideGameOverScreen = () => {
    if (gameOverScreen) {
      gameOverScreen.style.display = 'none'
    }
  }

  // Show splash screen
  const showSplashScreen = () => {
    if (splashScreen) {
      splashScreen.style.display = 'flex'
    }
  }

  // Hide splash screen
  const hideSplashScreen = () => {
    if (splashScreen) {
      splashScreen.style.display = 'none'
    }
  }

  // Return public API
  return {
    initialize,
    updateScore,
    updateLives,
    updateFlips,
    updateFlipCombo,
    showLifeLostMessage,
    showExtraLifeMessage,
    showGameOverScreen,
    hideGameOverScreen,
    showSplashScreen,
    hideSplashScreen,
  }
}
