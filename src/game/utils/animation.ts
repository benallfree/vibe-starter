import * as THREE from 'three'

// Animate snow particles falling
export const animateSnowParticles = (
  particles: THREE.Points,
  deltaTime: number = 1 / 60,
  windSpeed: number = 0.1,
  fallSpeed: number = 0.5
): void => {
  if (!particles || !particles.geometry.attributes.position) return

  const positions = particles.geometry.attributes.position.array as Float32Array

  // Update each snowflake position
  for (let i = 0; i < positions.length; i += 3) {
    // Add some horizontal drift (wind effect)
    positions[i] += Math.sin(Date.now() * 0.001 + i) * windSpeed * deltaTime

    // Move snow downward
    positions[i + 1] -= fallSpeed * deltaTime

    // If snow goes below a certain point, reset it to the top with random x/z
    if (positions[i + 1] < -10) {
      positions[i] = (Math.random() - 0.5) * 50 // Random x position
      positions[i + 1] = 20 + Math.random() * 10 // Reset to above camera
      positions[i + 2] = (Math.random() - 0.5) * 80 - 20 // Random z position
    }
  }

  // Update geometry
  particles.geometry.attributes.position.needsUpdate = true
}

// Update trail particles
export const updateTrailParticles = (
  particles: THREE.Points,
  particleData: Array<{
    position: THREE.Vector3
    velocity: THREE.Vector3
    size: number
    life: number
    maxLife: number
  }>,
  deltaTime: number = 1 / 60
): void => {
  if (!particles || !particles.geometry.attributes.position) return

  const positions = particles.geometry.attributes.position.array as Float32Array
  const sizes = particles.geometry.attributes.size.array as Float32Array

  // Update each particle
  for (let i = 0; i < particleData.length; i++) {
    const particle = particleData[i]

    // Skip inactive particles
    if (particle.life <= 0) continue

    // Update life
    particle.life -= deltaTime

    // Update position
    particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

    // Apply gravity
    particle.velocity.y -= 9.8 * deltaTime

    // Slow down horizontal movement due to friction
    particle.velocity.x *= 0.98
    particle.velocity.z *= 0.98

    // Calculate fade factor
    const fadeFactor = particle.life / particle.maxLife

    // Update particle size
    const index = i
    sizes[index] = particle.size * fadeFactor

    // Update particle position
    const posIndex = i * 3
    positions[posIndex] = particle.position.x
    positions[posIndex + 1] = particle.position.y
    positions[posIndex + 2] = particle.position.z
  }

  // Update geometry
  particles.geometry.attributes.position.needsUpdate = true
  particles.geometry.attributes.size.needsUpdate = true
}

// Animate floaty score indicators
export const updateFloatingIndicators = (
  indicators: Array<{
    mesh: THREE.Object3D
    life: number
    maxLife: number
    yVelocity: number
  }>,
  deltaTime: number = 1 / 60
): void => {
  // Update each indicator
  for (let i = 0; i < indicators.length; i++) {
    const indicator = indicators[i]

    // Skip inactive indicators
    if (indicator.life <= 0) continue

    // Update life
    indicator.life -= deltaTime

    // Move upward
    indicator.mesh.position.y += indicator.yVelocity * deltaTime

    // Slow down velocity
    indicator.yVelocity *= 0.97

    // Fade out as life depletes
    const fadeFactor = Math.min(1, indicator.life / indicator.maxLife)

    // Apply opacity to material
    if (indicator.mesh.children.length > 0) {
      indicator.mesh.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.opacity = fadeFactor
        }
      })
    }
  }

  // Remove dead indicators
  for (let i = indicators.length - 1; i >= 0; i--) {
    if (indicators[i].life <= 0) {
      // Remove from scene
      indicators[i].mesh.parent?.remove(indicators[i].mesh)
      // Remove from array
      indicators.splice(i, 1)
    }
  }
}
