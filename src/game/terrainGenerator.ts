import * as THREE from 'three'

// Create the terrain generator
export const createTerrainGenerator = (scene: THREE.Scene) => {
  // Terrain settings
  const segmentSize = 20
  const segmentDepth = 20
  const maxSegments = 10
  const snowColor = 0xf0f0ff

  // Store terrain segments
  const segments: THREE.Mesh[] = []

  // Generate a heightmap for a terrain segment
  const generateHeightMap = (width: number, depth: number, roughness: number) => {
    const size = width * depth
    const data = new Float32Array(size)

    // Set random heights for corners
    const cornerHeight = 0 // Keep flat at edges for easier tiling

    // Use simplex noise to generate terrain heights
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        // Create hills with sine waves for a ski slope effect
        // Steeper in the middle, flatter on sides
        const xPos = (x / width) * 2 - 1 // -1 to 1
        const slopeGradient = (-z / depth) * 2 // Downward slope
        const hilliness = Math.sin(z / 10) * Math.cos(x / 5) * roughness

        // Side edges should be higher to create a valley effect
        const valleyEffect = 1 - Math.pow(Math.abs(xPos), 2)

        // Combine effects
        data[z * width + x] = slopeGradient - hilliness * valleyEffect
      }
    }

    return data
  }

  // Create a terrain segment
  const createSegment = (position: THREE.Vector3, roughness: number = 0.5) => {
    // Create geometry
    const geometry = new THREE.PlaneGeometry(
      segmentSize,
      segmentDepth,
      segmentSize / 2, // subdivisions
      segmentDepth / 2 // subdivisions
    )

    // Generate heightmap
    const heightMap = generateHeightMap(segmentSize / 2 + 1, segmentDepth / 2 + 1, roughness)

    // Apply heightmap to geometry
    const vertices = geometry.attributes.position
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i)
      const z = vertices.getZ(i)

      // Map to heightmap coordinates
      const hx = Math.floor(((x + segmentSize / 2) / segmentSize) * (segmentSize / 2))
      const hz = Math.floor(((z + segmentDepth / 2) / segmentDepth) * (segmentDepth / 2))

      // Get height from heightmap
      const index = hz * (segmentSize / 2 + 1) + hx
      const height = heightMap[index] || 0

      // Set vertex height
      vertices.setY(i, height)
    }

    geometry.computeVertexNormals()

    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: snowColor,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: false,
    })

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2 // Rotate to be horizontal
    mesh.position.copy(position)
    mesh.receiveShadow = true

    // Add to scene
    scene.add(mesh)

    return mesh
  }

  // Create initial terrain segments
  const initialize = () => {
    reset()
  }

  // Update terrain
  const update = (speed: number) => {
    // Move all segments toward the camera
    segments.forEach((segment) => {
      segment.position.z += speed
    })

    // Check if we need to recycle the farthest segment
    if (segments.length > 0 && segments[0].position.z > 10) {
      const oldSegment = segments.shift()
      if (oldSegment) {
        // Remove from scene
        scene.remove(oldSegment)

        // Create new segment at the far end
        const lastSegment = segments[segments.length - 1]
        const newZ = lastSegment.position.z - segmentDepth
        const newSegment = createSegment(
          new THREE.Vector3(0, 0, newZ),
          0.5 + Math.random() * 0.5 // Vary roughness for variety
        )

        segments.push(newSegment)
      }
    }
  }

  // Reset the terrain
  const reset = () => {
    // Remove old segments
    segments.forEach((segment) => {
      scene.remove(segment)
    })
    segments.length = 0

    // Create initial segments
    for (let i = 0; i < maxSegments; i++) {
      const z = -i * segmentDepth
      const segment = createSegment(new THREE.Vector3(0, 0, z), 0.5 + Math.random() * 0.5)
      segments.push(segment)
    }
  }

  // Return public API
  return {
    initialize,
    update,
    reset,
  }
}
