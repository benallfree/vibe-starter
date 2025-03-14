import * as THREE from 'three'
import { createSnowMaterial } from './utils/rendering'

// Create the terrain generator
export const createTerrainGenerator = (scene: THREE.Scene) => {
  // Terrain settings
  const segmentSize = 20
  const segmentDepth = 20
  const maxSegments = 10
  const snowColor = 0xf8f9ff // Slightly bluer white for snow

  // Store terrain segments
  const segments: THREE.Mesh[] = []

  // Create snow texture
  const createSnowTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512

    const context = canvas.getContext('2d')
    if (!context) return new THREE.Texture()

    // Fill with base snow color
    context.fillStyle = '#f8f9ff'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Add subtle noise patterns for snow texture
    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const radius = Math.random() * 1.5 + 0.5

      // Vary the brightness slightly
      const brightness = Math.random() * 10 + 245
      const color = `rgb(${brightness}, ${brightness}, ${brightness + 5})`

      context.beginPath()
      context.arc(x, y, radius, 0, Math.PI * 2)
      context.fillStyle = color
      context.fill()
    }

    // Add sparkle effect for snow crystals
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const radius = Math.random() * 0.8 + 0.2

      context.beginPath()
      context.arc(x, y, radius, 0, Math.PI * 2)
      context.fillStyle = '#ffffff'
      context.fill()
    }

    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    return texture
  }

  // Generate a heightmap for a terrain segment
  const generateHeightMap = (width: number, depth: number, roughness: number) => {
    const size = width * depth
    const data = new Float32Array(size)

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

        // Add small random bumps for snow drifts
        const snowDrifts = Math.sin(x * 0.8) * Math.cos(z * 0.7) * 0.3 * roughness

        // Combine effects
        data[z * width + x] = slopeGradient - hilliness * valleyEffect + snowDrifts
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

    // Create snow texture
    const snowTexture = createSnowTexture()
    snowTexture.wrapS = THREE.RepeatWrapping
    snowTexture.wrapT = THREE.RepeatWrapping
    snowTexture.repeat.set(4, 4)

    // Create material using our utility
    const material = createSnowMaterial(snowColor, 0.8, 0.1, snowTexture)

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

  // Update terrain position
  const update = (speed: number) => {
    // Move all segments forward
    for (let i = 0; i < segments.length; i++) {
      segments[i].position.z += speed

      // If segment is behind the camera, move it to the front
      if (segments[i].position.z > 10) {
        // Move to the back
        const lastZ = segments[segments.length - 1].position.z
        segments[i].position.z = lastZ - segmentDepth

        // Randomize terrain roughness for variety
        const roughness = 0.3 + Math.random() * 0.4

        // Regenerate geometry with new heights
        const newGeometry = new THREE.PlaneGeometry(
          segmentSize,
          segmentDepth,
          segmentSize / 2,
          segmentDepth / 2
        )

        // Apply heightmap to new geometry
        const heightMap = generateHeightMap(segmentSize / 2 + 1, segmentDepth / 2 + 1, roughness)

        const vertices = newGeometry.attributes.position
        for (let v = 0; v < vertices.count; v++) {
          const x = vertices.getX(v)
          const z = vertices.getZ(v)

          // Map to heightmap coordinates
          const hx = Math.floor(((x + segmentSize / 2) / segmentSize) * (segmentSize / 2))
          const hz = Math.floor(((z + segmentDepth / 2) / segmentDepth) * (segmentDepth / 2))

          // Get height from heightmap
          const index = hz * (segmentSize / 2 + 1) + hx
          const height = heightMap[index] || 0

          // Set vertex height
          vertices.setY(v, height)
        }

        newGeometry.computeVertexNormals()

        // Replace the geometry
        segments[i].geometry.dispose()
        segments[i].geometry = newGeometry
      }
    }
  }

  // Reset terrain
  const reset = () => {
    // Remove all terrain segments
    segments.forEach((segment) => {
      scene.remove(segment)
      segment.geometry.dispose()
      if (segment.material instanceof THREE.MeshStandardMaterial) {
        segment.material.dispose()
      }
    })

    // Clear segments array
    segments.length = 0

    // Create new segments
    for (let i = 0; i < maxSegments; i++) {
      const position = new THREE.Vector3(0, 0, -segmentDepth * i)
      const roughness = 0.3 + Math.random() * 0.4 // Vary roughness for each segment
      segments.push(createSegment(position, roughness))
    }
  }

  // Get the chunk size
  const getChunkSize = () => {
    return {
      width: segmentSize,
      depth: segmentDepth,
    }
  }

  // Return public API
  return {
    initialize,
    update,
    reset,
    getChunkSize,
  }
}
