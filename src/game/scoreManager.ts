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
    // Create score element if it doesn't exist
    if (!document.getElementById('score-display')) {
      // Create score container
      const scoreContainer = document.createElement('div')
      scoreContainer.id = 'score-container'
      scoreContainer.style.position = 'absolute'
      scoreContainer.style.top = '20px'
      scoreContainer.style.right = '20px'
      scoreContainer.style.padding = '10px 20px'
      scoreContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
      scoreContainer.style.color = 'white'
      scoreContainer.style.borderRadius = '5px'
      scoreContainer.style.fontFamily = 'Arial, sans-serif'
      scoreContainer.style.zIndex = '100'

      // Create score label
      const scoreLabel = document.createElement('div')
      scoreLabel.textContent = 'SCORE'
      scoreLabel.style.fontSize = '14px'
      scoreLabel.style.marginBottom = '5px'

      // Create score display
      scoreElement = document.createElement('div')
      scoreElement.id = 'score-display'
      scoreElement.textContent = '0'
      scoreElement.style.fontSize = '24px'
      scoreElement.style.fontWeight = 'bold'

      // Create flip tracker
      const flipLabel = document.createElement('div')
      flipLabel.textContent = 'TOTAL FLIPS'
      flipLabel.style.fontSize = '14px'
      flipLabel.style.marginTop = '10px'
      flipLabel.style.marginBottom = '5px'

      flipElement = document.createElement('div')
      flipElement.id = 'flip-display'
      flipElement.textContent = '0'
      flipElement.style.fontSize = '20px'

      // Create combo tracker
      const comboLabel = document.createElement('div')
      comboLabel.textContent = 'FLIP COMBO'
      comboLabel.style.fontSize = '14px'
      comboLabel.style.marginTop = '10px'
      comboLabel.style.marginBottom = '5px'

      comboElement = document.createElement('div')
      comboElement.id = 'combo-display'
      comboElement.textContent = '0'
      comboElement.style.fontSize = '20px'
      comboElement.style.color = '#ffdd00'

      // Assemble the elements
      scoreContainer.appendChild(scoreLabel)
      scoreContainer.appendChild(scoreElement)
      scoreContainer.appendChild(flipLabel)
      scoreContainer.appendChild(flipElement)
      scoreContainer.appendChild(comboLabel)
      scoreContainer.appendChild(comboElement)

      // Add to document
      document.body.appendChild(scoreContainer)
    } else {
      // Get existing elements
      scoreElement = document.getElementById('score-display')
      flipElement = document.getElementById('flip-display')
      comboElement = document.getElementById('combo-display')
    }

    // Reset score
    updateScore(0)
    updateFlips(0)
    updateFlipCombo(0)
  }

  // Update score display
  const updateScore = (newScore: number) => {
    score = newScore

    // Update DOM
    if (scoreElement) {
      scoreElement.textContent = score.toString()
    }
  }

  // Update total flips display
  const updateFlips = (flips: number) => {
    totalFlips = flips

    // Update DOM
    if (flipElement) {
      flipElement.textContent = totalFlips.toString()
    }
  }

  // Update current flip combo display
  const updateFlipCombo = (combo: number) => {
    lastJumpFlips = combo

    // Update DOM
    if (comboElement) {
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
