import * as THREE from 'three'
import { Obstacle, Position } from './types'
import { createSnowMaterial } from './utils/rendering'

// Available banners for banner jumps
const BANNER_TYPES = ['pocketbase', 'pockethost', 'pocketpages']

// Create and manage obstacles on the ski slope
export const createObstacleManager = (scene: THREE.Scene) => {
  // Obstacle settings
  const maxObstacles = 50
  const obstacleSpawnRange = 100
  const obstacleTypes = ['tree', 'rock', 'jumpRamp', 'hotChocolate', 'bannerJump']
  const jumpFrequency = 0.3 // Reduced to make room for banner jumps
  const bannerJumpFrequency = 0.1 // 10% chance for banner jumps
  const hotChocolateFrequency = 0.05 // 5% for hot chocolate

  // Store active obstacles
  const obstacles: Obstacle[] = []

  // Preload banner textures
  const bannerTextures: Record<string, THREE.Texture> = {}

  const preloadBannerTextures = () => {
    const textureLoader = new THREE.TextureLoader()
    BANNER_TYPES.forEach((banner) => {
      bannerTextures[banner] = textureLoader.load(`/banners/${banner}.webp`)
    })
  }

  // Create a tree obstacle
  const createTree = (position: THREE.Vector3): Obstacle => {
    // Create tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8)
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 }) // Brown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.position.y = 1
    trunk.castShadow = true

    // Add snow on top of trunk
    const snowCapGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.1, 8)
    const snowCapMaterial = createSnowMaterial()
    const snowCap = new THREE.Mesh(snowCapGeometry, snowCapMaterial)
    snowCap.position.y = 2.02
    snowCap.castShadow = true

    // Create tree top (pine style)
    const topGeometry = new THREE.ConeGeometry(1, 3, 8)
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x2d572c }) // Dark green
    const top = new THREE.Mesh(topGeometry, topMaterial)
    top.position.y = 2.5
    top.castShadow = true

    // Create snow on tree branches
    const snowTopGeometry = new THREE.ConeGeometry(0.6, 0.5, 8)
    const snowTopMaterial = createSnowMaterial()
    const snowTop = new THREE.Mesh(snowTopGeometry, snowTopMaterial)
    snowTop.position.y = 3.5
    snowTop.castShadow = true

    // Create group for the tree
    const treeGroup = new THREE.Group()
    treeGroup.add(trunk)
    treeGroup.add(snowCap)
    treeGroup.add(top)
    treeGroup.add(snowTop)
    treeGroup.position.copy(position)

    // Add to scene
    scene.add(treeGroup)

    return {
      mesh: treeGroup,
      type: 'tree',
      position: { x: position.x, y: position.y, z: position.z },
      size: { width: 2, height: 4, depth: 2 },
      isCollidable: true,
    }
  }

  // Create a rock obstacle
  const createRock = (position: THREE.Vector3): Obstacle => {
    // Create rock geometry
    const rockGeometry = new THREE.DodecahedronGeometry(0.8, 1)

    // Randomize rock shape slightly
    const positionAttribute = rockGeometry.attributes.position
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i)
      const y = positionAttribute.getY(i)
      const z = positionAttribute.getZ(i)

      // Add some noise to the vertices
      positionAttribute.setX(i, x + (Math.random() - 0.5) * 0.2)
      positionAttribute.setY(i, y + (Math.random() - 0.5) * 0.2)
      positionAttribute.setZ(i, z + (Math.random() - 0.5) * 0.2)
    }

    rockGeometry.computeVertexNormals()

    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x7d7d7d, // Gray
      roughness: 0.8,
      metalness: 0.2,
    })

    // Create rock
    const rock = new THREE.Mesh(rockGeometry, rockMaterial)
    rock.position.y = 0.4 // Half height above ground
    rock.castShadow = true
    rock.receiveShadow = true

    // Create snow on top of rock
    const snowCapGeometry = new THREE.SphereGeometry(0.7, 8, 4, 0, Math.PI * 2, 0, Math.PI / 4)
    const snowCapMaterial = createSnowMaterial()
    const snowCap = new THREE.Mesh(snowCapGeometry, snowCapMaterial)
    snowCap.position.y = 0.7
    snowCap.castShadow = true

    // Create group for the rock
    const rockGroup = new THREE.Group()
    rockGroup.add(rock)
    rockGroup.add(snowCap)
    rockGroup.position.copy(position)

    // Add to scene
    scene.add(rockGroup)

    return {
      mesh: rockGroup,
      type: 'rock',
      position: { x: position.x, y: position.y, z: position.z },
      size: { width: 1.6, height: 0.8, depth: 1.6 },
      isCollidable: true,
    }
  }

  // Create a jump ramp
  const createJumpRamp = (position: THREE.Vector3): Obstacle => {
    // Create ramp group
    const rampGroup = new THREE.Group()

    // Create main rounded jump ramp
    const jumpGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 16, 1, false, 0, Math.PI)
    jumpGeometry.rotateX(Math.PI / 2)
    jumpGeometry.rotateZ(Math.PI / 2)

    const jumpMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0ff,
      roughness: 0.7,
      metalness: 0.1,
    })

    const jump = new THREE.Mesh(jumpGeometry, jumpMaterial)
    jump.position.y = 0.75
    jump.castShadow = true
    jump.receiveShadow = true

    // Add snow accumulation on top
    const snowTopGeometry = new THREE.CylinderGeometry(1.6, 1.6, 3.2, 16, 1, false, 0, Math.PI)
    snowTopGeometry.rotateX(Math.PI / 2)
    snowTopGeometry.rotateZ(Math.PI / 2)

    const snowTopMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0,
    })

    const snowTop = new THREE.Mesh(snowTopGeometry, snowTopMaterial)
    snowTop.position.y = 0.85
    snowTop.position.z = 0.05
    snowTop.scale.set(0.95, 0.9, 0.2)
    snowTop.castShadow = true
    snowTop.receiveShadow = true

    // Add jump markings
    const markerGeometry = new THREE.PlaneGeometry(2.5, 0.4)
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.8,
    })

    const marker = new THREE.Mesh(markerGeometry, markerMaterial)
    marker.rotation.x = -Math.PI / 2
    marker.position.y = 1.51
    marker.position.z = 0

    // Assemble the jump
    rampGroup.add(jump)
    rampGroup.add(snowTop)
    rampGroup.add(marker)

    // Rotate the entire ramp group 90 degrees around Y-axis (yaw)
    rampGroup.rotation.y = Math.PI / 2

    rampGroup.position.copy(position)

    // Add to scene
    scene.add(rampGroup)

    return {
      mesh: rampGroup,
      type: 'jumpRamp',
      position: { x: position.x, y: position.y, z: position.z },
      size: { width: 3, height: 1.5, depth: 1.5 },
      isCollidable: false, // Jumps don't cause crashes, they're fun!
    }
  }

  // Create a hot chocolate pickup
  const createHotChocolate = (position: THREE.Vector3): Obstacle => {
    // Create hot chocolate group
    const hotChocolateGroup = new THREE.Group()

    // Create mug - make it larger
    const mugGeometry = new THREE.CylinderGeometry(0.4, 0.35, 0.6, 16)
    const mugMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White mug
      roughness: 0.2,
      metalness: 0.1,
    })
    const mug = new THREE.Mesh(mugGeometry, mugMaterial)
    mug.position.y = 0.3
    mug.castShadow = true

    // Create hot chocolate liquid - make color more vibrant
    const liquidGeometry = new THREE.CylinderGeometry(0.37, 0.32, 0.1, 16)
    const liquidMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Brighter brown color for visibility
      roughness: 0.1,
      metalness: 0.1,
      emissive: 0x3a1a00, // Add a slight glow
    })
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial)
    liquid.position.y = 0.65

    // Create handle - make it more visible
    const handleGeometry = new THREE.TorusGeometry(0.25, 0.06, 8, 16, Math.PI)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White handle
      roughness: 0.2,
      metalness: 0.1,
    })
    const handle = new THREE.Mesh(handleGeometry, handleMaterial)
    handle.position.set(0.4, 0.3, 0)
    handle.rotation.y = Math.PI / 2

    // Create steam particles - make them larger and more visible
    const steamGroup = new THREE.Group()

    // Make a few small cloud puffs for steam
    for (let i = 0; i < 4; i++) {
      const puffGeometry = new THREE.SphereGeometry(0.12, 8, 8)
      const puffMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
      })
      const puff = new THREE.Mesh(puffGeometry, puffMaterial)
      puff.position.set((Math.random() - 0.5) * 0.2, 0.7 + i * 0.15, (Math.random() - 0.5) * 0.2)
      steamGroup.add(puff)
    }

    // Add a point light to make the hot chocolate glow and stand out
    const light = new THREE.PointLight(0xff9933, 1, 5)
    light.position.set(0, 0.5, 0)

    // Add a pulsing animation to the light
    const pulseLight = () => {
      // Use current game time instead of Date.now() for consistent speed
      if (typeof (window as any).gameTime !== 'undefined') {
        // Get consistent time from game engine
        const time = Date.now() * 0.002 // Fallback for initial load
        light.intensity = 0.5 + Math.sin(time * 2) * 0.5 // Pulse between 0 and 1
      } else {
        // Fallback if gameTime not available
        const time = Date.now() * 0.002
        light.intensity = 0.5 + Math.sin(time * 2) * 0.5
      }

      if (hotChocolateGroup.parent) {
        requestAnimationFrame(pulseLight)
      }
    }
    pulseLight()

    // Assemble hot chocolate
    hotChocolateGroup.add(mug)
    hotChocolateGroup.add(liquid)
    hotChocolateGroup.add(handle)
    hotChocolateGroup.add(steamGroup)
    hotChocolateGroup.add(light)

    // Create floating animation
    const floatAnimationStart = Math.random() * Math.PI * 2

    // Position and add to scene - float higher above ground
    hotChocolateGroup.position.copy(position)
    hotChocolateGroup.position.y = 1.0 // Float higher above ground for visibility
    scene.add(hotChocolateGroup)

    // Animate the hot chocolate to float more dramatically and rotate
    let animationTime = 0
    const animate = () => {
      // Use game time for consistent animation speed
      if (typeof (window as any).gameTime !== 'undefined') {
        // Increment time by fixed delta time
        animationTime += 0.002 * 60 * ((window as any).gameTime?.getDeltaTime() || 1 / 60)
        hotChocolateGroup.position.y =
          position.y + 1.0 + Math.sin(animationTime + floatAnimationStart) * 0.2
        hotChocolateGroup.rotation.y = animationTime * 0.8
      } else {
        // Fallback if gameTime not available
        const time = Date.now() * 0.002
        hotChocolateGroup.position.y = position.y + 1.0 + Math.sin(time + floatAnimationStart) * 0.2
        hotChocolateGroup.rotation.y = time * 0.8
      }

      // Only continue animation if the object is still in the scene
      if (hotChocolateGroup.parent) {
        requestAnimationFrame(animate)
      }
    }

    // Start animation
    animate()

    return {
      mesh: hotChocolateGroup,
      type: 'hotChocolate',
      position: { x: position.x, y: position.y + 1.0, z: position.z },
      size: { width: 0.8, height: 0.8, depth: 0.8 }, // Increase collision size
      isCollidable: true,
      isPickup: true,
    }
  }

  // Create a banner jump (new obstacle type)
  const createBannerJump = (position: THREE.Vector3): Obstacle => {
    // Select a random banner
    const bannerType = BANNER_TYPES[Math.floor(Math.random() * BANNER_TYPES.length)]

    // Create a group for the banner jump
    const bannerJumpGroup = new THREE.Group()

    // Create a ramp similar to the jump ramp but slightly smaller
    const rampGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16, 1, false, 0, Math.PI)
    rampGeometry.rotateX(Math.PI / 2)
    rampGeometry.rotateZ(Math.PI / 2)

    const rampMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0ff,
      roughness: 0.7,
      metalness: 0.1,
    })

    const ramp = new THREE.Mesh(rampGeometry, rampMaterial)
    ramp.position.y = 0.6
    ramp.castShadow = true
    ramp.receiveShadow = true

    // Create the banner with correct orientation
    const bannerGeometry = new THREE.PlaneGeometry(4, 1) // 4:1 aspect ratio (800x200)
    const bannerMaterial = new THREE.MeshBasicMaterial({
      map: bannerTextures[bannerType],
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: true,
    })

    const banner = new THREE.Mesh(bannerGeometry, bannerMaterial)
    // Position the banner slightly offset in Z to be in front of the posts
    banner.position.set(0, 2.5, 0.01) // Slight z-offset to be in front
    banner.renderOrder = 1 // Higher render order to appear in front

    // First rotate around Y to face the right direction (perpendicular to slope)
    banner.rotation.y = -Math.PI / 2

    // Remove the tilt to make banner perfectly vertical on the posts
    banner.rotation.order = 'YXZ' // Maintain rotation order for consistency
    banner.rotation.x = 0 // No tilt - perfectly vertical

    // Create support posts for the banner
    const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8) // Make posts taller
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 })

    const leftPost = new THREE.Mesh(postGeometry, postMaterial)
    leftPost.position.set(0, 1.5, -2.0) // Moved slightly back from the banner edge
    leftPost.renderOrder = 0 // Lower render order

    const rightPost = new THREE.Mesh(postGeometry, postMaterial)
    rightPost.position.set(0, 1.5, 2.0) // Moved slightly back from the banner edge
    rightPost.renderOrder = 0 // Lower render order

    // Assemble the banner jump
    bannerJumpGroup.add(ramp)
    bannerJumpGroup.add(banner)
    bannerJumpGroup.add(leftPost)
    bannerJumpGroup.add(rightPost)

    // Rotate the entire group 90 degrees around Y-axis to match regular jumps
    bannerJumpGroup.rotation.y = Math.PI / 2

    bannerJumpGroup.position.copy(position)

    // Add to scene
    scene.add(bannerJumpGroup)

    return {
      mesh: bannerJumpGroup,
      type: 'bannerJump',
      position: { x: position.x, y: position.y, z: position.z },
      size: { width: 3, height: 1.8, depth: 1.5 },
      isCollidable: false, // Jumps don't cause crashes
      bannerType,
    }
  }

  // Create a random obstacle
  const createRandomObstacle = (zPosition: number) => {
    // Random position within bounds
    const x = (Math.random() - 0.5) * 16 // -8 to 8
    const z = -zPosition - Math.random() * 5 // Some randomness in depth

    // Random obstacle type with weighted probabilities
    let type: string
    const rand = Math.random()

    if (rand < hotChocolateFrequency) {
      type = 'hotChocolate'
    } else if (rand < hotChocolateFrequency + jumpFrequency) {
      type = 'jumpRamp'
    } else if (rand < hotChocolateFrequency + jumpFrequency + bannerJumpFrequency) {
      type = 'bannerJump'
    } else if (
      rand <
      hotChocolateFrequency +
        jumpFrequency +
        bannerJumpFrequency +
        (1 - hotChocolateFrequency - jumpFrequency - bannerJumpFrequency) / 2
    ) {
      type = 'tree'
    } else {
      type = 'rock'
    }

    // For hot chocolate, make sure it's in a more central position where player is likely to go
    let x_position = x
    if (type === 'hotChocolate') {
      // Make hot chocolate appear in a more central area where player is likely to be
      x_position = (Math.random() - 0.5) * 8 // narrower range (-4 to 4)

      // Log hot chocolate creation for debugging
      console.log('Hot chocolate created at position:', x_position, -zPosition)
    }

    let obstacle: Obstacle

    switch (type) {
      case 'tree':
        obstacle = createTree(new THREE.Vector3(x, 0, z))
        break
      case 'rock':
        obstacle = createRock(new THREE.Vector3(x, 0, z))
        break
      case 'jumpRamp':
        obstacle = createJumpRamp(new THREE.Vector3(x, 0, z))
        break
      case 'bannerJump':
        obstacle = createBannerJump(new THREE.Vector3(x, 0, z))
        break
      case 'hotChocolate':
        obstacle = createHotChocolate(new THREE.Vector3(x_position, 0, z))
        break
      default:
        obstacle = createTree(new THREE.Vector3(x, 0, z)) // Default to tree
    }

    obstacles.push(obstacle)
  }

  // Initialize obstacles
  const initialize = () => {
    // Preload banner textures first
    preloadBannerTextures()

    // Create initial obstacles
    for (let i = 0; i < maxObstacles; i++) {
      // Distribute obstacles along the slope
      const z = 10 + (i * obstacleSpawnRange) / maxObstacles
      createRandomObstacle(z)
    }
  }

  // Update obstacles and check collisions
  const update = (speed: number, playerPosition: Position) => {
    let collision = false
    let jumpCollision = false
    let collisionObstacleType = ''

    // Move all obstacles toward the player
    obstacles.forEach((obstacle) => {
      obstacle.position.z += speed
      if (obstacle.mesh) {
        obstacle.mesh.position.z = obstacle.position.z
      }

      // Check for collision only if obstacle is collidable
      if (obstacle.isCollidable && isColliding(playerPosition, obstacle)) {
        collision = true
        collisionObstacleType = obstacle.type
      }
      // Check for jump collision (both regular and banner jumps)
      else if (
        (obstacle.type === 'jumpRamp' || obstacle.type === 'bannerJump') &&
        isColliding(playerPosition, obstacle)
      ) {
        jumpCollision = true
        collisionObstacleType = obstacle.type
      }
    })

    // Remove obstacles that are behind the player and add new ones
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].position.z > 10) {
        // Remove from scene
        scene.remove(obstacles[i].mesh)

        // Remove from array
        obstacles.splice(i, 1)

        // Create a new obstacle at the far end
        createRandomObstacle(obstacleSpawnRange)
      }
    }

    return {
      collision,
      jumpCollision,
      obstacleType: collisionObstacleType,
    }
  }

  // Check if player is colliding with an obstacle
  const isColliding = (playerPosition: Position, obstacle: Obstacle) => {
    // Simple box collision check
    const playerSize = { width: 0.4, height: 1.6, depth: 0.3 }

    // Collision detection thresholds
    const xThreshold = (playerSize.width + obstacle.size.width) / 2
    const zThreshold = (playerSize.depth + obstacle.size.depth) / 2

    // Simple 2D collision check (ignoring height for simplicity)
    const xDistance = Math.abs(playerPosition.x - obstacle.position.x)
    const zDistance = Math.abs(playerPosition.z - obstacle.position.z)

    return xDistance < xThreshold && zDistance < zThreshold
  }

  // Reset all obstacles
  const reset = () => {
    // Remove all obstacles from scene
    obstacles.forEach((obstacle) => {
      scene.remove(obstacle.mesh)
    })

    // Clear obstacles array
    obstacles.length = 0

    // Reinitialize
    initialize()
  }

  // Return the public API
  return {
    initialize,
    update,
    reset,
    isColliding,
    getObstacles: () => obstacles,
  }
}
