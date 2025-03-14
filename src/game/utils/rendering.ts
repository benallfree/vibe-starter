import * as THREE from 'three'

// Create a texture from a canvas with a circle/dot
export const createCircleTexture = (
  color: string = 'white',
  size: number = 32,
  radius: number = 8
): THREE.Texture => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')

  if (context) {
    context.beginPath()
    context.arc(size / 2, size / 2, radius, 0, Math.PI * 2)
    context.fillStyle = color
    context.fill()
  }

  const texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  return texture
}

// Create a material for particles
export const createParticleMaterial = (
  color: number = 0xffffff,
  size: number = 0.5,
  texture?: THREE.Texture
): THREE.PointsMaterial => {
  const options: THREE.PointsMaterialParameters = {
    color,
    size,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  }

  if (texture) {
    options.map = texture
  }

  return new THREE.PointsMaterial(options)
}

// Create a standard material with common properties
export const createSnowMaterial = (
  color: number = 0xffffff,
  roughness: number = 0.8,
  metalness: number = 0.1,
  map?: THREE.Texture
): THREE.MeshStandardMaterial => {
  const options: THREE.MeshStandardMaterialParameters = {
    color,
    roughness,
    metalness,
    flatShading: false,
  }

  if (map) {
    options.map = map
  }

  return new THREE.MeshStandardMaterial(options)
}
