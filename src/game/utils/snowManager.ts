import * as THREE from 'three'

// Snow particles manager factory
export const createSnowManager = (scene: THREE.Scene) => {
  let snowParticles: THREE.Points | null = null
  let snowCount = 2000 // Default snow count, can be changed

  // Create snow particles
  const createSnowParticles = () => {
    // Remove any existing snow particles
    if (snowParticles) {
      scene.remove(snowParticles)
    }

    // Create snow particles
    const snowGeometry = new THREE.BufferGeometry()
    const snowPositions = new Float32Array(snowCount * 3)
    const snowSizes = new Float32Array(snowCount)

    for (let i = 0; i < snowCount; i++) {
      // Random position in a wide area around the player
      snowPositions[i * 3] = (Math.random() - 0.5) * 50 // x
      snowPositions[i * 3 + 1] = Math.random() * 30 // y
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 80 - 20 // z

      // Random sizes between 0.1 and 0.3
      snowSizes[i] = Math.random() * 0.2 + 0.1
    }

    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3))
    snowGeometry.setAttribute('size', new THREE.BufferAttribute(snowSizes, 1))

    // Create snow material with custom shader
    const snowMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      map: createSnowflakeTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    // Create snow points
    snowParticles = new THREE.Points(snowGeometry, snowMaterial)
    scene.add(snowParticles)

    return snowParticles
  }

  // Create a texture for snowflakes
  const createSnowflakeTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64

    const context = canvas.getContext('2d')
    if (!context) return new THREE.Texture()

    // Draw a white circle with soft edges
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = canvas.width / 4

    context.beginPath()
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false)

    // Create gradient
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    context.fillStyle = gradient
    context.fill()

    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    return texture
  }

  // Update snow particles
  const update = (deltaTime: number, speed: number) => {
    if (!snowParticles) return

    const positions = snowParticles.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < snowCount; i++) {
      // Make snow fall downward and slightly to the side (wind effect)
      positions[i * 3 + 1] -= Math.random() * 0.1 + 0.05 // y (fall speed)
      positions[i * 3] += (Math.random() - 0.5) * 0.05 // x (slight drift)
      positions[i * 3 + 2] += speed * 0.5 * deltaTime // z (move with player)

      // Reset if out of view
      if (positions[i * 3 + 1] < -5) {
        positions[i * 3 + 1] = 20 + Math.random() * 10
        positions[i * 3] = (Math.random() - 0.5) * 50
        positions[i * 3 + 2] = -40 + (Math.random() - 0.5) * 40
      }

      // Reset if too far behind
      if (positions[i * 3 + 2] > 15) {
        positions[i * 3 + 2] = -40 + Math.random() * 10
      }
    }

    snowParticles.geometry.attributes.position.needsUpdate = true
  }

  // Set snow count and recreate particles
  const setSnowCount = (count: number) => {
    snowCount = count
    createSnowParticles()
  }

  return {
    createSnowParticles,
    update,
    setSnowCount,
  }
}
