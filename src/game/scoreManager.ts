import { createUIContainer, createUIElement } from './utils/ui'

// Create and manage scoring system
export const createScoreManager = () => {
  // Track score
  let score = 0
  let totalFlips = 0
  let lastJumpFlips = 0

  // DOM elements
  let scoreElement: HTMLElement | null = null
  let flipElement: HTMLElement | null = null
  let comboElement: HTMLElement | null = null

  // Initialize score display
  const initialize = () => {
    // Create or get the score container
    const scoreContainer = createUIContainer('score-container', 'top-right')

    // Create score label and display
    const scoreLabel = createUIElement('score-label', 'div', scoreContainer)
    scoreLabel.textContent = 'SCORE'
    scoreLabel.style.fontSize = '14px'
    scoreLabel.style.marginBottom = '5px'

    scoreElement = createUIElement('score-display', 'div', scoreContainer)
    scoreElement.textContent = '0'
    scoreElement.style.fontSize = '24px'
    scoreElement.style.fontWeight = 'bold'

    // Create flip tracker
    const flipLabel = createUIElement('flip-label', 'div', scoreContainer)
    flipLabel.textContent = 'TOTAL FLIPS'
    flipLabel.style.fontSize = '14px'
    flipLabel.style.marginTop = '10px'
    flipLabel.style.marginBottom = '5px'

    flipElement = createUIElement('flip-display', 'div', scoreContainer)
    flipElement.textContent = '0'
    flipElement.style.fontSize = '20px'

    // Create combo tracker
    const comboLabel = createUIElement('combo-label', 'div', scoreContainer)
    comboLabel.textContent = 'FLIP COMBO'
    comboLabel.style.fontSize = '14px'
    comboLabel.style.marginTop = '10px'
    comboLabel.style.marginBottom = '5px'

    comboElement = createUIElement('combo-display', 'div', scoreContainer)
    comboElement.textContent = '0'
    comboElement.style.fontSize = '20px'
    comboElement.style.color = '#ffdd00'

    // Reset score
    updateScore(0)
    updateFlips(0)
    updateFlipCombo(0)
  }

  // Update score display
  const updateScore = (newScore: number) => {
    score = newScore

    if (!scoreElement) return

    scoreElement.textContent = score.toString()
  }

  // Update total flips display
  const updateFlips = (flips: number) => {
    totalFlips = flips

    if (!flipElement) return

    flipElement.textContent = totalFlips.toString()
  }

  // Update current flip combo display
  const updateFlipCombo = (combo: number) => {
    lastJumpFlips = combo

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

  // Add points to score
  const addPoints = (points: number) => {
    updateScore(score + points)
  }

  // Add flips to total
  const addFlips = (flips: number) => {
    updateFlips(totalFlips + flips)
    updateFlipCombo(flips)
  }

  // Reset score
  const reset = () => {
    updateScore(0)
    updateFlips(0)
    updateFlipCombo(0)
  }

  // Get current score
  const getScore = () => {
    return score
  }

  // Get current total flips
  const getTotalFlips = () => {
    return totalFlips
  }

  // Get last jump's flip count
  const getLastJumpFlips = () => {
    return lastJumpFlips
  }

  // Return public API
  return {
    initialize,
    updateScore,
    updateFlips,
    updateFlipCombo,
    addPoints,
    addFlips,
    reset,
    getScore,
    getTotalFlips,
    getLastJumpFlips,
  }
}
