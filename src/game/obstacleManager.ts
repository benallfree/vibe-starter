import * as THREE from 'three'

// Create and manage obstacles on the ski slope
export const createObstacleManager = (scene: THREE.Scene) => {
  // Obstacle settings
  const maxObstacles = 50
  const obstacleSpawnRange = 100
  const obstacleTypes = ['tree', 'rock', 'jumpRamp']
  const jumpFrequency = 0.4 // Increased probability of jumps (40%)

  // Store active obstacles
  const obstacles: Obstacle[] = []

  // Obstacle interface
  interface Obstacle {
    mesh: THREE.Object3D
    type: string
    position: { x: number; y: number; z: number }
    size: { width: number; height: number; depth: number }
    isCollidable: boolean
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
    const snowCapMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
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
    const snowTopMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
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
    const snowCapMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })
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

  // Create a random obstacle
  const createRandomObstacle = (zPosition: number) => {
    // Random position within bounds
    const x = (Math.random() - 0.5) * 16 // -8 to 8
    const z = -zPosition - Math.random() * 5 // Some randomness in depth

    // Random obstacle type with higher jump probability
    let type: string
    const rand = Math.random()

    if (rand < jumpFrequency) {
      type = 'jumpRamp'
    } else if (rand < jumpFrequency + (1 - jumpFrequency) / 2) {
      type = 'tree'
    } else {
      type = 'rock'
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
      default:
        obstacle = createTree(new THREE.Vector3(x, 0, z)) // Default to tree
    }

    obstacles.push(obstacle)
  }

  // Initialize obstacles
  const initialize = () => {
    // Create initial obstacles
    for (let i = 0; i < maxObstacles; i++) {
      // Distribute obstacles along the slope
      const z = 10 + (i * obstacleSpawnRange) / maxObstacles
      createRandomObstacle(z)
    }
  }

  // Update obstacles and check collisions
  const update = (speed: number, playerPosition: { x: number; y: number; z: number }) => {
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
      // Check for jump collision
      else if (obstacle.type === 'jumpRamp' && isColliding(playerPosition, obstacle)) {
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
  const isColliding = (playerPosition: { x: number; y: number; z: number }, obstacle: Obstacle) => {
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
  }
}
