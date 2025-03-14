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
  const tumblingDuration = 0.5 // in seconds (reduced from 1.0 to make the skier get up faster)
  let lives = 3

  // Jump and flip state
  let isJumping = false
  let jumpTimer = 0
  let jumpDuration = 0.67 // in seconds (was 40 frames at 60fps)
  let jumpHeight = 0
  let doingFlip = false
  let flipCount = 0
  let currentGameSpeed = 0.1 // Track current game speed
  let lastFlipRotation = 0 // Track rotation for multiple flips

  // Floating point indicators
  const maxPointIndicators = 10
  const pointIndicators: Array<{
    mesh: THREE.Object3D
    life: number
    maxLife: number
    yVelocity: number
  }> = []

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
  const updateSnowTrail = (deltaTime: number = 1 / 60) => {
    if (!snowTrail) return

    // Create new particles at the skier's position
    // Scale particle creation rate by deltaTime to maintain consistent density
    if (!isTumbling && Math.random() > 1 - deltaTime * 30) {
      // roughly 50% chance at 60fps
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
          maxLife: Math.random() * 0.5 + 0.33, // Convert to seconds from 20-50 frames at 60fps
        })
      }
    }

    // Update particle positions
    const positions = snowTrail.geometry.attributes.position.array as Float32Array
    const sizes = snowTrail.geometry.attributes.size.array as Float32Array

    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const particle = trailParticles[i]

      // Scale velocity by deltaTime for consistent movement speed
      const scaledVelocity = particle.velocity.clone().multiplyScalar(deltaTime * 60)
      // Update particle position
      particle.position.add(scaledVelocity)
      particle.life += deltaTime

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
      tumblingRotationX = Math.random() > 0.5 ? 0.4 : -0.4 // Increased from 0.2 to 0.4 for faster tumbling
      tumblingRotationZ = Math.random() > 0.5 ? 0.4 : -0.4 // Increased from 0.2 to 0.4 for faster tumbling

      // Decrease lives
      lives--

      return true
    }
    return false
  }

  // Start jump with flip
  const startJump = (speed: number = 0.1) => {
    if (!isTumbling && !isJumping) {
      isJumping = true
      jumpTimer = 0
      doingFlip = true
      flipCount = 0
      lastFlipRotation = 0
      currentGameSpeed = speed

      // Calculate jump duration and height based on speed
      // As speed increases, allow for longer jumps with more air time
      jumpDuration = 0.67 + speed * 1.67 // Converted from frames to seconds (40 + speed * 100) / 60

      // Create +10 point indicator for jumping
      createPointIndicator(10, { ...position })

      return true
    }
    return false
  }

  // Update tumbling animation with proper time scaling
  const updateTumbling = (deltaTime: number = 1 / 60) => {
    if (!isTumbling) return

    // Use actual seconds instead of frame counts
    tumblingTimer += deltaTime

    if (tumblingTimer >= tumblingDuration) {
      // Recover from tumbling
      isTumbling = false

      // Reset rotation
      if (skierMesh) {
        skierMesh.rotation.set(0, 0, 0)
      }

      return
    }

    // Apply tumbling rotation - use radians per second
    if (skierMesh) {
      // Convert to proper radians per second (increased from 0.2 to 0.4 radians per frame at 60fps)
      const rotationSpeed = 0.4 * 60
      skierMesh.rotation.x += tumblingRotationX * rotationSpeed * deltaTime
      skierMesh.rotation.z += tumblingRotationZ * rotationSpeed * deltaTime
    }
  }

  // Update jump animation with proper time scaling
  const updateJump = (deltaTime: number = 1 / 60) => {
    if (!isJumping) return

    // Use actual seconds instead of frame counts
    jumpTimer += deltaTime

    // Calculate jump height - parabolic arc with height based on speed
    const jumpProgress = jumpTimer / jumpDuration
    jumpHeight = (3 + currentGameSpeed * 10) * Math.sin(jumpProgress * Math.PI) // Max height increases with speed

    // Apply jump height to skier position
    position.y = jumpHeight

    // Apply flip rotation with multiple flips possible
    if (doingFlip && skierMesh) {
      // Calculate rotation speed - adjusted for time-based animation
      // Full 360 rotation (2π) scaled by speed and time
      const flipSpeed = (Math.PI * 2 * (1 + currentGameSpeed)) / jumpDuration // radians per second

      // Calculate rotation increment based on deltaTime
      const rotationIncrement = flipSpeed * deltaTime
      const newRotation = lastFlipRotation + rotationIncrement

      // Apply rotation
      skierMesh.rotation.x = newRotation

      // Track last rotation value
      lastFlipRotation = newRotation

      // Check if we completed a new flip
      if (Math.floor(newRotation / (Math.PI * 2)) > flipCount) {
        flipCount++
        // Create +50 point indicator for each flip
        createPointIndicator(50, { ...position, y: position.y + 1 })
      }
    }

    // End jump when timer expires
    if (jumpTimer >= jumpDuration) {
      isJumping = false
      doingFlip = false
      position.y = 0

      // Create final bonus indicator if we did flips
      if (flipCount > 0) {
        createPointIndicator(flipCount * 50, { ...position, y: position.y + 2 })
      }

      // Reset rotation
      if (skierMesh) {
        skierMesh.rotation.set(0, 0, 0)
      }
    }
  }

  // Create floating point indicator
  const createPointIndicator = (points: number, position: { x: number; y: number; z: number }) => {
    // Create text geometry with the points value
    const fontSize = points >= 50 ? 0.5 : 0.3
    const pointsText = points >= 0 ? `+${points}` : `${points}`

    // Create canvas for text
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')

    if (context) {
      context.fillStyle = points >= 50 ? '#ffdd00' : '#ffffff'
      context.font = 'bold 120px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(pointsText, 128, 128)
    }

    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true

    // Create sprite material
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0,
    })

    // Create sprite
    const sprite = new THREE.Sprite(material)
    sprite.position.set(position.x, position.y + 2, position.z)
    sprite.scale.set(fontSize * 3, fontSize * 3, 1)

    // Add to scene
    scene.add(sprite)

    // Add to indicators array - Convert max life to seconds (from 60 frames at 60fps)
    pointIndicators.push({
      mesh: sprite,
      life: 0,
      maxLife: 1.0, // 1 second
      yVelocity: 0.05 / 60, // velocity per second
    })
  }

  // Update point indicators
  const updatePointIndicators = (deltaTime: number = 1 / 60) => {
    for (let i = pointIndicators.length - 1; i >= 0; i--) {
      const indicator = pointIndicators[i]

      // Update life with delta time
      indicator.life += deltaTime

      // Scale movement by delta time
      indicator.mesh.position.y += indicator.yVelocity * deltaTime * 60

      // Fade out
      if (indicator.mesh instanceof THREE.Sprite) {
        const sprite = indicator.mesh as THREE.Sprite
        if (sprite.material instanceof THREE.SpriteMaterial) {
          sprite.material.opacity = 1 - indicator.life / indicator.maxLife
        }
      }

      // Remove when expired
      if (indicator.life >= indicator.maxLife) {
        scene.remove(indicator.mesh)
        pointIndicators.splice(i, 1)
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
  const update = (
    input: { left: boolean; right: boolean; up: boolean; down: boolean },
    speed: number = 0.1
  ) => {
    // Update current game speed
    currentGameSpeed = speed

    // Update tumbling state
    updateTumbling()

    // Update jump state
    updateJump()

    // Update point indicators
    updatePointIndicators()

    // Don't respond to controls while tumbling
    if (isTumbling) return

    // Move left/right (allow while jumping)
    if (input.left) {
      position.x -= movementSpeed * (1 + currentGameSpeed) // Speed affects horizontal movement too
    }
    if (input.right) {
      position.x += movementSpeed * (1 + currentGameSpeed) // Speed affects horizontal movement too
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
  const checkJumpCollision = (obstacleType: string, speed: number = 0.1) => {
    if (obstacleType === 'jumpRamp' && !isJumping && !isTumbling) {
      startJump(speed)
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

  // Get current flip count
  const getFlipCount = () => {
    return flipCount
  }

  // Reset flip count after awarding points
  const resetFlipCount = () => {
    flipCount = 0
  }

  // Add an extra life when hot chocolate is collected (no maximum)
  const gainExtraLife = () => {
    // Always increment life count (no maximum)
    lives++

    console.log(`Life gained! New life count: ${lives}`)

    // Create a visual effect to show life gain
    if (skierMesh) {
      // Create a brief visual highlight effect on the skier
      const originalColor = (skierMesh.children[0] as THREE.Mesh)
        .material as THREE.MeshStandardMaterial
      const originalColorValue = originalColor.color.clone()

      // Flash green briefly
      originalColor.color.set(0x00ff00)
      originalColor.emissive.set(0x00ff00)
      originalColor.emissiveIntensity = 0.5

      // Reset color after a short delay
      setTimeout(() => {
        originalColor.color.copy(originalColorValue)
        originalColor.emissive.set(0x000000)
        originalColor.emissiveIntensity = 0
      }, 300)
    }

    // Always return true since we always gain a life
    return true
  }

  // Return public API
  return {
    initialize,
    update,
    reset,
    resetLives,
    startTumbling,
    startJump,
    checkJumpCollision,
    getPosition,
    getSize,
    getLives,
    getIsTumbling,
    getIsJumping,
    getFlipCount,
    resetFlipCount,
    gainExtraLife,
    createPointIndicator,
  }
}
