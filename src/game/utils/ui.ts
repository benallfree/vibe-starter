// Create a UI element with consistent styling
export const createUIElement = (
  id: string,
  type: 'div' | 'button' | 'span' = 'div',
  parentElement?: HTMLElement
): HTMLElement => {
  // Check if element already exists
  const existingElement = document.getElementById(id)
  if (existingElement) return existingElement

  // Create new element
  const element = document.createElement(type)
  element.id = id

  // Apply default styling
  applyDefaultStyling(element)

  // Add to parent if specified
  if (parentElement) {
    parentElement.appendChild(element)
  }

  return element
}

// Apply default game UI styling to element
export const applyDefaultStyling = (element: HTMLElement): void => {
  element.style.fontFamily = 'Arial, sans-serif'
  element.style.color = 'white'
}

// Create a container for UI elements
export const createUIContainer = (
  id: string,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' = 'top-right'
): HTMLElement => {
  const container = createUIElement(id)
  container.style.position = 'absolute'
  container.style.padding = '10px 20px'
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
  container.style.borderRadius = '5px'
  container.style.zIndex = '100'

  // Position the container
  switch (position) {
    case 'top-left':
      container.style.top = '20px'
      container.style.left = '20px'
      break
    case 'top-right':
      container.style.top = '20px'
      container.style.right = '20px'
      break
    case 'bottom-left':
      container.style.bottom = '20px'
      container.style.left = '20px'
      break
    case 'bottom-right':
      container.style.bottom = '20px'
      container.style.right = '20px'
      break
    case 'center':
      container.style.top = '50%'
      container.style.left = '50%'
      container.style.transform = 'translate(-50%, -50%)'
      break
  }

  // Add to document
  document.body.appendChild(container)

  return container
}

// Show a temporary message
export const showTemporaryMessage = (
  message: string,
  duration: number = 2000,
  position: 'top' | 'bottom' | 'behind-player' = 'top'
): HTMLElement => {
  const messageElement = document.createElement('div')
  messageElement.textContent = message
  messageElement.style.position = 'absolute'
  messageElement.style.padding = '10px 20px'
  messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
  messageElement.style.color = 'white'
  messageElement.style.borderRadius = '5px'
  messageElement.style.fontFamily = 'Arial, sans-serif'
  messageElement.style.fontSize = '18px'
  messageElement.style.textAlign = 'center'
  messageElement.style.zIndex = '1000'
  messageElement.style.transition = 'opacity 0.5s ease-in-out'

  // Position based on parameter
  switch (position) {
    case 'top':
      messageElement.style.top = '100px'
      messageElement.style.left = '50%'
      messageElement.style.transform = 'translateX(-50%)'
      break
    case 'bottom':
      messageElement.style.bottom = '100px'
      messageElement.style.left = '50%'
      messageElement.style.transform = 'translateX(-50%)'
      break
    case 'behind-player':
      messageElement.style.bottom = '25%'
      messageElement.style.left = '50%'
      messageElement.style.transform = 'translateX(-50%)'
      break
  }

  document.body.appendChild(messageElement)

  // Fade out and remove after duration
  setTimeout(() => {
    messageElement.style.opacity = '0'
    setTimeout(() => {
      document.body.removeChild(messageElement)
    }, 500)
  }, duration)

  return messageElement
}
