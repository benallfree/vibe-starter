// scripts/generate-icons.ts
// A simple script to generate PNG icons in various sizes for the PWA
// Run with: bun run scripts/generate-icons.ts

import { exec } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// Create the directory if it doesn't exist
const makeDir = (dirPath: string): void => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
    console.log(`Created directory: ${dirPath}`)
  }
  return
}

// We'll use ImageMagick to convert SVG to PNG
// Make sure ImageMagick v7+ is installed on your system
const convertSvgToPng = (svgPath: string, pngPath: string, size: number): void => {
  // Using the modern 'magick' command (ImageMagick v7+)
  // Updated command to properly scale SVG using density and resize parameters
  const command = `magick -background none -density 300 ${svgPath} -resize ${size}x${size} ${pngPath}`

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error converting ${svgPath} to PNG: ${error.message}`)
      console.log('Make sure ImageMagick v7+ is installed on your system.')
      return
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`)
      return
    }
    console.log(`Created icon: ${pngPath}`)
  })
  return
}

// Define the static directory (SvelteKit convention)
const staticDir = join(__dirname, '../public')
const iconsDir = join(staticDir, 'icons')

// Create directories
makeDir(staticDir)
makeDir(iconsDir)

// Define icon sizes needed for PWA
const iconSizes: number[] = [72, 96, 128, 144, 152, 192, 384, 512]

// Source SVG file
const sourceSvg = join(iconsDir, 'apple-touch-icon.svg')

// Generate icons
console.log('Generating PNG icons from SVG...')
iconSizes.forEach((size) => {
  const pngPath = join(iconsDir, `icon-${size}x${size}.png`)
  convertSvgToPng(sourceSvg, pngPath, size)
})

// Also generate the apple-touch-icon
const appleTouchIconPng = join(iconsDir, 'apple-touch-icon.png')
convertSvgToPng(sourceSvg, appleTouchIconPng, 180)

console.log('Icon generation complete!')
console.log('Note: This script requires ImageMagick v7+ with the "magick" command.')
