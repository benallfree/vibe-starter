import * as THREE from 'three'
import { createCircleTexture, createParticleMaterial } from './rendering'

// Create a particle system for snow
export const createSnowParticles = (
  count: number = 2000,
  range: { x: number; y: number; z: number } = { x: 50, y: 30, z: 80 }
): THREE.Points => {
  // Create geometry
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  // Initialize with random positions
  for (let i = 0; i < count; i++) {
    // Random position in a wide area around the player
    positions[i * 3] = (Math.random() - 0.5) * range.x // x
    positions[i * 3 + 1] = Math.random() * range.y // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * range.z - 20 // z

    // Random sizes between 0.1 and 0.3
    sizes[i] = Math.random() * 0.2 + 0.1
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  // Create texture and material
  const snowTexture = createCircleTexture('white')
  const material = createParticleMaterial(0xffffff, 0.5, snowTexture)

  // Create particle system
  return new THREE.Points(geometry, material)
}

// Create a particle system for snow trails
export const createTrailParticles = (maxParticles: number = 50): THREE.Points => {
  // Create geometry for particles
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(maxParticles * 3)
  const sizes = new Float32Array(maxParticles)

  // Initialize positions (off-screen)
  for (let i = 0; i < maxParticles; i++) {
    positions[i * 3] = 0
    positions[i * 3 + 1] = -10
    positions[i * 3 + 2] = 0
    sizes[i] = 0.1
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  // Create texture for snow particles
  const texture = createCircleTexture('white')
  const material = createParticleMaterial(0xffffff, 0.2, texture)

  // Create particle system
  return new THREE.Points(geometry, material)
}

// Create a floating score indicator
export const createScoreIndicator = (
  position: THREE.Vector3,
  value: number,
  color: number = 0xffdd00
): THREE.Group => {
  // Create a group for the score indicator
  const group = new THREE.Group()
  group.position.copy(position)

  // Create text with the score value
  const valueString = `+${value}`

  // Create a canvas for the text
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64

  const context = canvas.getContext('2d')
  if (!context) return group

  // Draw the text
  context.fillStyle = 'transparent'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.font = 'bold 48px Arial'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = `#${color.toString(16).padStart(6, '0')}`
  context.fillText(valueString, canvas.width / 2, canvas.height / 2)

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas)

  // Create material and geometry
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  const geometry = new THREE.PlaneGeometry(1, 0.5)
  const mesh = new THREE.Mesh(geometry, material)

  // Make the indicator face the camera
  mesh.rotation.x = -Math.PI / 4

  // Add to group
  group.add(mesh)

  return group
}

// Add a particle to a trail
export const addTrailParticle = (
  position: THREE.Vector3,
  particles: Array<{
    position: THREE.Vector3
    velocity: THREE.Vector3
    size: number
    life: number
    maxLife: number
  }>,
  size: number = 0.2,
  life: number = 0.5,
  velocityFactor: number = 0.5
): void => {
  // Find an inactive particle or use the oldest one
  let oldestParticleIndex = 0
  let oldestParticleLife = Infinity

  for (let i = 0; i < particles.length; i++) {
    if (particles[i].life <= 0) {
      oldestParticleIndex = i
      break
    }

    if (particles[i].life < oldestParticleLife) {
      oldestParticleLife = particles[i].life
      oldestParticleIndex = i
    }
  }

  // Random velocity
  const velocity = new THREE.Vector3(
    (Math.random() - 0.5) * velocityFactor,
    Math.random() * velocityFactor,
    (Math.random() - 0.5) * velocityFactor
  )

  // Reset the particle
  particles[oldestParticleIndex] = {
    position: position.clone(),
    velocity,
    size,
    life,
    maxLife: life,
  }
}
