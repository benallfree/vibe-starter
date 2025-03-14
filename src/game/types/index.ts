import * as THREE from 'three'

// Common interfaces and types used across the game

// Game time interface used in multiple components
export interface GameTime {
  getDeltaTime: () => number
  getSpeed: () => number
}

// Obstacle interface
export interface Obstacle {
  mesh: THREE.Object3D
  type: string
  position: { x: number; y: number; z: number }
  size: { width: number; height: number; depth: number }
  isCollidable: boolean
  isPickup?: boolean
  bannerType?: string
}

// Position interface
export interface Position {
  x: number
  y: number
  z: number
}

// Size interface
export interface Size {
  width: number
  height: number
  depth: number
}

// Input state interface
export interface InputState {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}
