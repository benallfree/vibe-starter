import * as THREE from 'three'

// Interface for game time - must match the one in skiGame.ts
interface GameTime {
  getDeltaTime: () => number
  getSpeed: () => number
}

// Create and manage obstacles on the ski slope
export const createObstacleManager = (scene: THREE.Scene) => {
  // Obstacle settings
  const maxObstacles = 50
  const obstacleSpawnRange = 100
  const obstacleTypes = ['tree', 'rock', 'jumpRamp', 'hotChocolate']
  const jumpFrequency = 0.4 // Increased probability of jumps (40%)
  const hotChocolateFrequency = 0.05 // Significantly increase hot chocolate frequency (20%)
  const bannerFrequency = 0.01 // Replace approximately 1% of trees with banners (roughly every 100th tree)
  const maxVisibleBanners = 2 // Maximum number of banners visible at once

  // Fence settings
  const fenceSegmentLength = 5
  const fenceHeight = 1.2
  const trackWidth = 16 // Total width of the track
  const fenceDistance = trackWidth / 2 + 3 // Position fences further out from the edge of the track
  const maxFenceSegments = 30 // Number of fence segments to maintain
  const bannerOnFenceFrequency = 0.6 // 60% chance for a fence segment to have a banner

  // Store active obstacles
  const obstacles: Obstacle[] = []

  // Store fence segments
  const fenceSegments: FenceSegment[] = []

  // Store available banners
  const bannerImages = ['pockethost.webp', 'pocketbase.webp', 'pocketpages.webp'] // All banner filenames in public/banners/
  let treeCounter = 0 // Counter to track how many trees have been created

  // Store visible banners (both standalone and on fences)
  const visibleBanners = {
    standalone: [] as Obstacle[],
    onFence: [] as THREE.Group[],
    getCount: () => visibleBanners.standalone.length + visibleBanners.onFence.length,
  }

  // Precache resources for performance
  const precachedResources = {
    // Precached geometries
    geometries: {
      bannerPlane: new THREE.PlaneGeometry(12, 3), // 4:1 aspect ratio (6x larger than original)
      bannerPole: new THREE.CylinderGeometry(0.15, 0.15, 10, 8),
      fencePost: new THREE.CylinderGeometry(0.1, 0.1, fenceHeight * 1.2, 8),
      fenceBar: new THREE.BoxGeometry(0.08, 0.08, fenceSegmentLength),
    },
    // Precached materials
    materials: {
      wood: new THREE.MeshStandardMaterial({ color: 0x8b4513 }), // Brown
      bannerMaterials: [] as THREE.MeshStandardMaterial[],
    },
    // Cache for banner textures
    textures: [] as THREE.Texture[],
    // Object pools for reuse
    objectPools: {
      bannerGroups: [] as THREE.Group[],
      activeBannerGroups: new Set<THREE.Group>(),
    },
  }

  // Preload all banner textures
  const preloadTextures = () => {
    const textureLoader = new THREE.TextureLoader()
    bannerImages.forEach((image, index) => {
      const texture = textureLoader.load(`/banners/${image}`)
      precachedResources.textures[index] = texture

      // Create material for this texture
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        emissive: 0xffffff,
        emissiveIntensity: 0.2,
        emissiveMap: texture,
      })
      precachedResources.materials.bannerMaterials[index] = material
    })
  }

  // Create reusable banner groups
  const createBannerObjectPool = (poolSize: number) => {
    for (let i = 0; i < poolSize; i++) {
      // For each banner image, create some reusable groups
      bannerImages.forEach((_, imageIndex) => {
        // Create group for the banner
        const bannerGroup = new THREE.Group()

        // Create pole
        const pole = new THREE.Mesh(
          precachedResources.geometries.bannerPole,
          precachedResources.materials.wood
        )
        pole.castShadow = true
        bannerGroup.add(pole)

        // Create banner mesh
        const bannerMesh = new THREE.Mesh(
          precachedResources.geometries.bannerPlane,
          precachedResources.materials.bannerMaterials[imageIndex]
        )
        bannerMesh.castShadow = true
        bannerGroup.add(bannerMesh)

        // Add to pool but not to scene yet
        bannerGroup.visible = false
        scene.add(bannerGroup)
        precachedResources.objectPools.bannerGroups.push(bannerGroup)
      })
    }
  }

  // Get a banner from the pool
  const getBannerFromPool = (
    imageIndex: number,
    side: 'left' | 'right'
  ): THREE.Group | undefined => {
    // Check if we're already at max banners
    if (visibleBanners.getCount() >= maxVisibleBanners) {
      return undefined
    }

    // Find a banner with the right image that's not currently active
    for (const bannerGroup of precachedResources.objectPools.bannerGroups) {
      if (!precachedResources.objectPools.activeBannerGroups.has(bannerGroup)) {
        // Check if this banner has the right material
        const bannerMesh = bannerGroup.children[1] as THREE.Mesh
        if (bannerMesh.material === precachedResources.materials.bannerMaterials[imageIndex]) {
          // Configure the banner for the correct side
          const pole = bannerGroup.children[0]
          pole.position.set(0, 5, 0) // Half of poleHeight

          const banner = bannerGroup.children[1]
          const bannerHeight = 9 // poleHeight - 1
          // Position banners to extend further inward toward the playing field
          const bannerOffset = side === 'left' ? 4 : -4
          banner.position.set(bannerOffset, bannerHeight, 0)

          // Rotate banner to face the track (inward)
          if (side === 'left') {
            banner.rotation.y = Math.PI / 2 // Left side fence banners face right (inward)
          } else {
            banner.rotation.y = -Math.PI / 2 // Right side fence banners face left (inward)
          }

          // Mark as active
          bannerGroup.visible = true
          precachedResources.objectPools.activeBannerGroups.add(bannerGroup)
          visibleBanners.onFence.push(bannerGroup)
          return bannerGroup
        }
      }
    }
    return undefined // No available banner found
  }

  // Return banner to pool
  const returnBannerToPool = (bannerGroup?: THREE.Group) => {
    if (!bannerGroup) return

    bannerGroup.visible = false
    precachedResources.objectPools.activeBannerGroups.delete(bannerGroup)

    // Remove from visible banners
    const index = visibleBanners.onFence.indexOf(bannerGroup)
    if (index !== -1) {
      visibleBanners.onFence.splice(index, 1)
    }
  }

  // Obstacle interface
  interface Obstacle {
    mesh: THREE.Object3D
    type: string
    position: { x: number; y: number; z: number }
    size: { width: number; height: number; depth: number }
    isCollidable: boolean
    isPickup?: boolean
    isBanner?: boolean
  }

  // Fence segment interface
  interface FenceSegment {
    mesh: THREE.Object3D
    position: { x: number; y: number; z: number }
    side: 'left' | 'right'
    hasBanner: boolean
    bannerGroup?: THREE.Group
  }

  // Create a banner sign obstacle
  const createBannerSign = (position: THREE.Vector3): Obstacle => {
    // Create sign post
    const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8)
    const post = new THREE.Mesh(postGeometry, precachedResources.materials.wood)
    post.position.y = 1.5
    post.castShadow = true

    // Randomly select a banner image
    const randomBannerIndex = Math.floor(Math.random() * bannerImages.length)

    // Create banner plane
    const bannerGeometry = new THREE.PlaneGeometry(4, 1) // 4:1 aspect ratio for 800x200 images

    const banner = new THREE.Mesh(
      bannerGeometry,
      precachedResources.materials.bannerMaterials[randomBannerIndex]
    )
    banner.position.y = 2.5 // Place above the post
    banner.castShadow = true

    // Create group for the sign
    const signGroup = new THREE.Group()
    signGroup.add(post)
    signGroup.add(banner)

    // Face the banner toward the player
    signGroup.rotation.y = Math.PI / 2

    signGroup.position.copy(position)

    // Add to scene
    scene.add(signGroup)

    const obstacle = {
      mesh: signGroup,
      type: 'tree', // Consider it a tree for collision purposes
      position: { x: position.x, y: position.y, z: position.z },
      size: { width: 4, height: 3.5, depth: 0.5 },
      isCollidable: true,
      isBanner: true,
    }

    // Add to visible banners
    visibleBanners.standalone.push(obstacle)

    return obstacle
  }

  // Create a fence segment
  const createFenceSegment = (position: THREE.Vector3, side: 'left' | 'right'): FenceSegment => {
    // Create a group for the fence segment
    const fenceGroup = new THREE.Group()

    // Create posts
    const createPost = (z: number) => {
      const post = new THREE.Mesh(
        precachedResources.geometries.fencePost,
        precachedResources.materials.wood
      )
      post.position.set(0, fenceHeight / 2, z)
      post.castShadow = true
      return post
    }

    // Add start and end posts (along Z-axis for parallel down the slope)
    fenceGroup.add(createPost(-fenceSegmentLength / 2))
    fenceGroup.add(createPost(fenceSegmentLength / 2))

    // Create horizontal bars (2 bars)
    for (let i = 0; i < 2; i++) {
      const barHeight = (fenceHeight * (i + 1)) / 3 // Position at 1/3 and 2/3 of fence height
      const bar = new THREE.Mesh(
        precachedResources.geometries.fenceBar,
        precachedResources.materials.wood
      )
      bar.position.set(0, barHeight, 0)
      bar.castShadow = true
      fenceGroup.add(bar)
    }

    // Determine if this fence segment should have a banner
    const hasBanner = Math.random() < bannerOnFenceFrequency
    let bannerGroup: THREE.Group | undefined = undefined

    if (hasBanner) {
      // Randomly select a banner image
      const randomBannerIndex = Math.floor(Math.random() * bannerImages.length)

      // Get a banner from the pool
      bannerGroup = getBannerFromPool(randomBannerIndex, side)

      // If we got a banner, add it to our fence group
      if (bannerGroup) {
        bannerGroup.position.copy(position)
        // We don't need to add it to the scene as it's already there
      }
    }

    // Position the fence segment
    fenceGroup.position.copy(position)

    // Add to scene
    scene.add(fenceGroup)

    return {
      mesh: fenceGroup,
      position: { x: position.x, y: position.y, z: position.z },
      side,
      hasBanner,
      bannerGroup,
    }
  }

  // Create a tree obstacle
  const createTree = (position: THREE.Vector3): Obstacle => {
    // Create tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8)
    const trunk = new THREE.Mesh(trunkGeometry, precachedResources.materials.wood)
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
    } else if (
      rand <
      hotChocolateFrequency + jumpFrequency + (1 - hotChocolateFrequency - jumpFrequency) / 2
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
        treeCounter++
        // Every 100th tree (approximately), create a banner sign instead
        // Only create a banner if we're under the maximum visible banners
        if (
          treeCounter % 100 === 0 &&
          bannerImages.length > 0 &&
          visibleBanners.getCount() < maxVisibleBanners
        ) {
          obstacle = createBannerSign(new THREE.Vector3(x, 0, z))
        } else {
          obstacle = createTree(new THREE.Vector3(x, 0, z))
        }
        break
      case 'rock':
        obstacle = createRock(new THREE.Vector3(x, 0, z))
        break
      case 'jumpRamp':
        obstacle = createJumpRamp(new THREE.Vector3(x, 0, z))
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
    // Preload resources
    preloadTextures()

    // Create object pools
    // Calculate pool size based on max segments and banner frequency
    const estimatedMaxBanners = Math.ceil(maxFenceSegments * 2 * bannerOnFenceFrequency * 1.5) // 2 sides, with 50% extra for safety
    createBannerObjectPool(estimatedMaxBanners)

    // Create initial obstacles
    for (let i = 0; i < maxObstacles; i++) {
      // Distribute obstacles along the slope
      const z = 10 + (i * obstacleSpawnRange) / maxObstacles
      createRandomObstacle(z)
    }

    // Create initial fence segments on both sides
    for (let i = 0; i < maxFenceSegments; i++) {
      const z = -fenceSegmentLength * i

      // Left side fence
      const leftPosition = new THREE.Vector3(-fenceDistance, 0, z - fenceSegmentLength / 2)
      fenceSegments.push(createFenceSegment(leftPosition, 'left'))

      // Right side fence
      const rightPosition = new THREE.Vector3(fenceDistance, 0, z - fenceSegmentLength / 2)
      fenceSegments.push(createFenceSegment(rightPosition, 'right'))
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

    // Move all fence segments toward the player
    fenceSegments.forEach((segment) => {
      segment.position.z += speed
      if (segment.mesh) {
        segment.mesh.position.z = segment.position.z
      }

      // Move associated banner group if present
      if (segment.bannerGroup) {
        segment.bannerGroup.position.z = segment.position.z
      }
    })

    // Remove obstacles that are behind the player and add new ones
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].position.z > 10) {
        // If this was a banner, remove it from visible banners
        if (obstacles[i].isBanner) {
          const index = visibleBanners.standalone.indexOf(obstacles[i])
          if (index !== -1) {
            visibleBanners.standalone.splice(index, 1)
          }
        }

        // Remove from scene
        scene.remove(obstacles[i].mesh)

        // Remove from array
        obstacles.splice(i, 1)

        // Create a new obstacle at the far end
        createRandomObstacle(obstacleSpawnRange)
      }
    }

    // Remove fence segments that are behind the player and add new ones
    for (let i = fenceSegments.length - 1; i >= 0; i--) {
      if (fenceSegments[i].position.z + fenceSegmentLength / 2 > 10) {
        // Return banner to pool if this segment has one
        if (fenceSegments[i].bannerGroup) {
          returnBannerToPool(fenceSegments[i].bannerGroup)
        }

        // Remove from scene
        scene.remove(fenceSegments[i].mesh)

        // Get the side of the removed segment
        const side = fenceSegments[i].side

        // Remove from array
        fenceSegments.splice(i, 1)

        // Find the furthest fence segment of the same side
        let furthestZ = 0
        fenceSegments.forEach((segment) => {
          if (segment.side === side && segment.position.z < furthestZ) {
            furthestZ = segment.position.z
          }
        })

        // Create a new fence segment at the far end
        const newZ = furthestZ - fenceSegmentLength
        const x = side === 'left' ? -fenceDistance : fenceDistance
        const newPosition = new THREE.Vector3(x, 0, newZ)
        fenceSegments.push(createFenceSegment(newPosition, side))
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

    // Return all banners to pool
    fenceSegments.forEach((segment) => {
      if (segment.bannerGroup) {
        returnBannerToPool(segment.bannerGroup)
      }
      scene.remove(segment.mesh)
    })

    // Clear fence segments array
    fenceSegments.length = 0

    // Clear visible banners arrays
    visibleBanners.standalone.length = 0
    visibleBanners.onFence.length = 0

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
