import * as THREE from 'three'

// Create and manage obstacles on the ski slope
export const createObstacleManager = (scene: THREE.Scene) => {
  // Obstacle settings
  const maxObstacles = 50
  const obstacleSpawnRange = 100
  const obstacleTypes = ['tree', 'rock', 'jumpRamp']

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

    // Create tree top (pine style)
    const topGeometry = new THREE.ConeGeometry(1, 3, 8)
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x2d572c }) // Dark green
    const top = new THREE.Mesh(topGeometry, topMaterial)
    top.position.y = 2.5
    top.castShadow = true

    // Create group for the tree
    const treeGroup = new THREE.Group()
    treeGroup.add(trunk)
    treeGroup.add(top)
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

    const rock = new THREE.Mesh(rockGeometry, rockMaterial)
    rock.position.copy(position)
    rock.position.y = 0.4 // Half height above ground
    rock.castShadow = true
    rock.receiveShadow = true

    // Add to scene
    scene.add(rock)

    return {
      mesh: rock,
      type: 'rock',
      position: { x: position.x, y: position.y, z: position.z },
      size: { width: 1.6, height: 0.8, depth: 1.6 },
      isCollidable: true,
    }
  }

  // Create a jump ramp
  const createJumpRamp = (position: THREE.Vector3): Obstacle => {
    // Create ramp geometry
    const rampGeometry = new THREE.BoxGeometry(3, 1, 2)
    const rampMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee }) // White snow
    const ramp = new THREE.Mesh(rampGeometry, rampMaterial)

    // Rotate to make it a ramp
    ramp.rotation.x = -Math.PI / 8

    ramp.position.copy(position)
    ramp.position.y = 0.2
    ramp.castShadow = true
    ramp.receiveShadow = true

    // Add to scene
    scene.add(ramp)

    return {
      mesh: ramp,
      type: 'jumpRamp',
      position: { x: position.x, y: position.y, z: position.z },
      size: { width: 3, height: 0.5, depth: 2 },
      isCollidable: false, // Jumps don't cause crashes, they're fun!
    }
  }

  // Create a random obstacle
  const createRandomObstacle = (zPosition: number) => {
    // Random position within bounds
    const x = (Math.random() - 0.5) * 16 // -8 to 8
    const z = -zPosition - Math.random() * 5 // Some randomness in depth

    // Random obstacle type
    const typeIndex = Math.floor(Math.random() * obstacleTypes.length)
    const type = obstacleTypes[typeIndex]

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

    // Move all obstacles toward the player
    obstacles.forEach((obstacle) => {
      obstacle.position.z += speed
      if (obstacle.mesh) {
        obstacle.mesh.position.z = obstacle.position.z
      }

      // Check for collision only if obstacle is collidable
      if (obstacle.isCollidable && isColliding(playerPosition, obstacle)) {
        collision = true
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

    return collision
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
