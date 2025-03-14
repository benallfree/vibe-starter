// Create and manage scoring system
export const createScoreManager = () => {
  // Track score
  let score = 0

  // DOM elements
  let scoreElement: HTMLElement | null = null

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

      // Assemble the elements
      scoreContainer.appendChild(scoreLabel)
      scoreContainer.appendChild(scoreElement)

      // Add to document
      document.body.appendChild(scoreContainer)
    } else {
      // Get existing score element
      scoreElement = document.getElementById('score-display')
    }

    // Reset score
    updateScore(0)
  }

  // Update score display
  const updateScore = (newScore: number) => {
    score = newScore

    // Update DOM
    if (scoreElement) {
      scoreElement.textContent = score.toString()
    }
  }

  // Add points to score
  const addPoints = (points: number) => {
    updateScore(score + points)
  }

  // Reset score
  const reset = () => {
    updateScore(0)
  }

  // Get current score
  const getScore = () => {
    return score
  }

  // Return public API
  return {
    initialize,
    updateScore,
    addPoints,
    reset,
    getScore,
  }
}
