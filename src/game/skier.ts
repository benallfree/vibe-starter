import * as THREE from 'three'

// Create the player's skier character
export const createSkier = (scene: THREE.Scene) => {
  // Skier settings
  const movementSpeed = 0.2
  const maxHorizontalPosition = 8
  const skierColor = 0x2244aa // Darker blue for winter jacket

  // Skier mesh
  let skierMesh: THREE.Group

  // Snow trail particles
  let snowTrail: THREE.Points | null = null
  const maxTrailParticles = 50
  const trailParticles: Array<{
    position: THREE.Vector3
    velocity: THREE.Vector3
    size: number
    life: number
    maxLife: number
  }> = []

  // Current position
  let position = {
    x: 0,
    y: 0,
    z: 0,
  }

  // Skier state
  let isTumbling = false
  let tumblingTimer = 0
  const tumblingDuration = 60 // frames
  let lives = 3

  // Jump and flip state
  let isJumping = false
  let jumpTimer = 0
  const jumpDuration = 40 // frames
  let jumpHeight = 0
  let doingFlip = false

  // Tumbling animation properties
  let tumblingRotationX = 0
  let tumblingRotationZ = 0

  // Create snow trail system
  const createSnowTrail = () => {
    // Create geometry for particles
    const trailGeometry = new THREE.BufferGeometry()
    const trailPositions = new Float32Array(maxTrailParticles * 3)
    const trailSizes = new Float32Array(maxTrailParticles)

    // Initialize positions (off-screen)
    for (let i = 0; i < maxTrailParticles; i++) {
      trailPositions[i * 3] = 0
      trailPositions[i * 3 + 1] = -10
      trailPositions[i * 3 + 2] = 0
      trailSizes[i] = 0.1
    }

    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
    trailGeometry.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1))

    // Create texture for snow particles
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const context = canvas.getContext('2d')
    if (context) {
      context.beginPath()
      context.arc(16, 16, 8, 0, Math.PI * 2)
      context.fillStyle = 'white'
      context.fill()
    }

    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true

    // Create material
    const trailMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      map: texture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    })

    // Create points
    snowTrail = new THREE.Points(trailGeometry, trailMaterial)
    scene.add(snowTrail)
  }

  // Update snow trail
  const updateSnowTrail = () => {
    if (!snowTrail) return

    // Create new particles at the skier's position
    if (!isTumbling && Math.random() > 0.5) {
      if (trailParticles.length < maxTrailParticles) {
        trailParticles.push({
          position: new THREE.Vector3(
            position.x + (Math.random() - 0.5) * 0.3,
            0.05,
            position.z + (Math.random() - 0.5) * 0.3
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            Math.random() * 0.02 + 0.01,
            (Math.random() - 0.5) * 0.01
          ),
          size: Math.random() * 0.2 + 0.1,
          life: 0,
          maxLife: Math.random() * 30 + 20,
        })
      }
    }

    // Update particle positions
    const positions = snowTrail.geometry.attributes.position.array as Float32Array
    const sizes = snowTrail.geometry.attributes.size.array as Float32Array

    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const particle = trailParticles[i]

      // Update particle position
      particle.position.add(particle.velocity)
      particle.life++

      // Fade out as they age
      const opacity = 1 - particle.life / particle.maxLife

      // Update vertex data
      positions[i * 3] = particle.position.x
      positions[i * 3 + 1] = particle.position.y
      positions[i * 3 + 2] = particle.position.z
      sizes[i] = particle.size * opacity

      // Remove dead particles
      if (particle.life >= particle.maxLife) {
        trailParticles.splice(i, 1)
      }
    }

    // Set remaining particles to be invisible
    for (let i = trailParticles.length; i < maxTrailParticles; i++) {
      positions[i * 3 + 1] = -10 // Move below ground
      sizes[i] = 0
    }

    snowTrail.geometry.attributes.position.needsUpdate = true
    snowTrail.geometry.attributes.size.needsUpdate = true
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

    // Create hat
    const hatGeometry = new THREE.ConeGeometry(0.28, 0.4, 16)
    const hatMaterial = new THREE.MeshStandardMaterial({ color: 0xdd3333 }) // Red hat
    const hat = new THREE.Mesh(hatGeometry, hatMaterial)
    hat.position.y = 1.65
    hat.castShadow = true
    group.add(hat)

    // Create hat pom-pom
    const pomGeometry = new THREE.SphereGeometry(0.1, 8, 8)
    const pomMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff }) // White pom-pom
    const pom = new THREE.Mesh(pomGeometry, pomMaterial)
    pom.position.y = 1.85
    pom.castShadow = true
    group.add(pom)

    // Create scarf
    const scarfGeometry = new THREE.BoxGeometry(0.5, 0.15, 0.35)
    const scarfMaterial = new THREE.MeshStandardMaterial({ color: 0xdd3333 }) // Red scarf
    const scarf = new THREE.Mesh(scarfGeometry, scarfMaterial)
    scarf.position.y = 1.2
    scarf.castShadow = true
    group.add(scarf)

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

  // Start tumbling animation
  const startTumbling = () => {
    if (!isTumbling && !isJumping) {
      isTumbling = true
      tumblingTimer = 0

      // Set random rotation directions for tumbling
      tumblingRotationX = Math.random() > 0.5 ? 0.2 : -0.2
      tumblingRotationZ = Math.random() > 0.5 ? 0.2 : -0.2

      // Decrease lives
      lives--

      return true
    }
    return false
  }

  // Start jump with flip
  const startJump = () => {
    if (!isTumbling && !isJumping) {
      isJumping = true
      jumpTimer = 0
      doingFlip = true
      return true
    }
    return false
  }

  // Update tumbling animation
  const updateTumbling = () => {
    if (!isTumbling) return

    tumblingTimer++

    if (tumblingTimer >= tumblingDuration) {
      // Recover from tumbling
      isTumbling = false

      // Reset rotation
      if (skierMesh) {
        skierMesh.rotation.set(0, 0, 0)
      }

      return
    }

    // Apply tumbling rotation
    if (skierMesh) {
      skierMesh.rotation.x += tumblingRotationX
      skierMesh.rotation.z += tumblingRotationZ
    }
  }

  // Update jump animation
  const updateJump = () => {
    if (!isJumping) return

    jumpTimer++

    // Calculate jump height - parabolic arc
    const jumpProgress = jumpTimer / jumpDuration
    jumpHeight = 3 * Math.sin(jumpProgress * Math.PI) // Max height of 3 units

    // Apply jump height to skier position
    position.y = jumpHeight

    // Apply flip rotation (one full 360 flip)
    if (doingFlip && skierMesh) {
      // Rotate around X axis (forward flip)
      skierMesh.rotation.x = jumpProgress * Math.PI * 2
    }

    // End jump when timer expires
    if (jumpTimer >= jumpDuration) {
      isJumping = false
      doingFlip = false
      position.y = 0

      // Reset rotation
      if (skierMesh) {
        skierMesh.rotation.set(0, 0, 0)
      }
    }
  }

  // Initialize the skier
  const initialize = () => {
    // Create skier mesh
    skierMesh = createSkierMesh()
    scene.add(skierMesh)

    // Create snow trail
    createSnowTrail()

    // Reset position
    reset()
  }

  // Update skier position and animation
  const update = (input: { left: boolean; right: boolean; up: boolean; down: boolean }) => {
    // Update tumbling state
    updateTumbling()

    // Update jump state
    updateJump()

    // Don't respond to controls while tumbling
    if (isTumbling) return

    // Move left/right (allow while jumping)
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
      skierMesh.position.y = position.y

      // Only tilt when not jumping
      if (!isJumping) {
        // Tilt the skier during turns
        const targetRotation = input.left ? 0.2 : input.right ? -0.2 : 0
        skierMesh.rotation.z = THREE.MathUtils.lerp(skierMesh.rotation.z, targetRotation, 0.1)
      }
    }

    // Update snow trail (only when not jumping)
    if (!isJumping) {
      updateSnowTrail()
    }
  }

  // Check for collision with jump
  const checkJumpCollision = (obstacleType: string) => {
    if (obstacleType === 'jumpRamp' && !isJumping && !isTumbling) {
      startJump()
      return true
    }
    return false
  }

  // Reset skier position
  const reset = () => {
    position = { x: 0, y: 0, z: 0 }
    isTumbling = false
    tumblingTimer = 0
    isJumping = false
    jumpTimer = 0
    jumpHeight = 0

    if (skierMesh) {
      skierMesh.position.set(position.x, position.y, position.z)
      skierMesh.rotation.set(0, 0, 0)
    }
  }

  // Reset lives to 3
  const resetLives = () => {
    lives = 3
  }

  // Get current position for collision detection
  const getPosition = () => {
    return { ...position }
  }

  // Get skier size for collision detection
  const getSize = () => {
    return { width: 0.4, height: 1.6, depth: 0.3 }
  }

  // Get current lives
  const getLives = () => {
    return lives
  }

  // Check if skier is currently tumbling
  const getIsTumbling = () => {
    return isTumbling
  }

  // Check if skier is currently jumping
  const getIsJumping = () => {
    return isJumping
  }

  // Return public API
  return {
    initialize,
    update,
    reset,
    resetLives,
    startTumbling,
    checkJumpCollision,
    getPosition,
    getSize,
    getLives,
    getIsTumbling,
    getIsJumping,
  }
}
