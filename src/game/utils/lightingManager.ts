import * as THREE from 'three'

export const createLightingManager = (scene: THREE.Scene, renderer: THREE.WebGLRenderer) => {
  // Initialize the lighting setup
  const initialize = () => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    // Directional light (sunlight)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8)
    sunLight.position.set(10, 20, 10)
    sunLight.castShadow = true

    // Configure shadow properties
    sunLight.shadow.mapSize.width = 1024
    sunLight.shadow.mapSize.height = 1024
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 50

    scene.add(sunLight)

    // Enable shadows
    renderer.shadowMap.enabled = true

    return { ambientLight, sunLight }
  }

  return {
    initialize,
  }
}
