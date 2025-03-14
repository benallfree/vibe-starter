import * as THREE from 'three'

// Create the player's skier character
export const createSkier = (scene: THREE.Scene) => {
  // Skier settings
  const movementSpeed = 0.2
  const maxHorizontalPosition = 8
  const skierColor = 0x3366cc

  // Skier mesh
  let skierMesh: THREE.Group

  // Current position
  let position = {
    x: 0,
    y: 0,
    z: 0,
  }

  // Create the skier mesh
  const createSkierMesh = () => {
    // Create a group to hold all parts
    const group = new THREE.Group()

    // Create body (torso)
    const bodyGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.3)
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: skierColor })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.8
    body.castShadow = true
    group.add(body)

    // Create head
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16)
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac }) // Skin color
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.y = 1.4
    head.castShadow = true
    group.add(head)

    // Create left ski
    const leftSkiGeometry = new THREE.BoxGeometry(0.2, 0.05, 1.2)
    const skiMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 })
    const leftSki = new THREE.Mesh(leftSkiGeometry, skiMaterial)
    leftSki.position.set(-0.2, 0.025, 0)
    leftSki.castShadow = true
    group.add(leftSki)

    // Create right ski
    const rightSkiGeometry = new THREE.BoxGeometry(0.2, 0.05, 1.2)
    const rightSki = new THREE.Mesh(rightSkiGeometry, skiMaterial)
    rightSki.position.set(0.2, 0.025, 0)
    rightSki.castShadow = true
    group.add(rightSki)

    // Create ski poles
    const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8)
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 })

    // Left pole
    const leftPole = new THREE.Mesh(poleGeometry, poleMaterial)
    leftPole.position.set(-0.4, 0.6, -0.3)
    leftPole.castShadow = true
    group.add(leftPole)

    // Right pole
    const rightPole = new THREE.Mesh(poleGeometry, poleMaterial)
    rightPole.position.set(0.4, 0.6, -0.3)
    rightPole.castShadow = true
    group.add(rightPole)

    return group
  }

  // Initialize the skier
  const initialize = () => {
    // Create skier mesh
    skierMesh = createSkierMesh()
    skierMesh.position.set(position.x, position.y, position.z)

    // Add to scene
    scene.add(skierMesh)
  }

  // Update skier position based on input
  const update = (input: { left: boolean; right: boolean; up: boolean; down: boolean }) => {
    // Move left/right
    if (input.left) {
      position.x -= movementSpeed
    }
    if (input.right) {
      position.x += movementSpeed
    }

    // Clamp horizontal position to prevent going too far off the slope
    position.x = Math.max(-maxHorizontalPosition, Math.min(maxHorizontalPosition, position.x))

    // Apply position to mesh
    if (skierMesh) {
      skierMesh.position.x = position.x

      // Tilt the skier during turns
      const targetRotation = input.left ? 0.2 : input.right ? -0.2 : 0
      skierMesh.rotation.z = THREE.MathUtils.lerp(skierMesh.rotation.z, targetRotation, 0.1)

      // Adjust skier height based on terrain (simplified for now)
      // In a more complex implementation, we would raycast down to find terrain height
      skierMesh.position.y = position.y
    }
  }

  // Reset skier position
  const reset = () => {
    position = { x: 0, y: 0, z: 0 }

    if (skierMesh) {
      skierMesh.position.set(position.x, position.y, position.z)
      skierMesh.rotation.set(0, 0, 0)
    }
  }

  // Get current position for collision detection
  const getPosition = () => {
    return { ...position }
  }

  // Get skier size for collision detection
  const getSize = () => {
    return { width: 0.4, height: 1.6, depth: 0.3 }
  }

  // Return public API
  return {
    initialize,
    update,
    reset,
    getPosition,
    getSize,
  }
}
