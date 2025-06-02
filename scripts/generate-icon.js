const { createCanvas } = require("canvas");
const fs = require("node:fs");
const path = require("node:path");

function createOrangeIcon(size = 20, filename = "icon.png") {
  // Create canvas with specified size
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Clear the canvas
  ctx.clearRect(0, 0, size, size);

  // Calculate proportions based on size
  const center = size / 2;
  const radius = size * 0.4;
  const fontSize = size * 0.55;

  // Create gradient from light orange to dark orange
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
  gradient.addColorStop(0, "#FF8C42"); // Light orange
  gradient.addColorStop(1, "#FF6B1A"); // Dark orange

  // Draw circle
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Add white 'C' for Claude
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("C", center, center);

  // Save icon
  const buffer = canvas.toBuffer("image/png");
  const iconPath = path.join(__dirname, "..", filename);
  fs.writeFileSync(iconPath, buffer);

  console.log(`✅ Created ${filename} (${size}x${size})`);
}

function createTemplateIcon() {
  // Create a 20x20 canvas for template icon (black and white)
  const canvas = createCanvas(20, 20);
  const ctx = canvas.getContext("2d");

  // Clear the canvas
  ctx.clearRect(0, 0, 20, 20);

  // Draw black circle outline
  ctx.beginPath();
  ctx.arc(10, 10, 8, 0, 2 * Math.PI);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Add black 'C' for Claude
  ctx.fillStyle = "#000000";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("C", 10, 10);

  // Save template icon
  const buffer = canvas.toBuffer("image/png");
  const iconPath = path.join(__dirname, "..", "assets", "iconTemplate.png");
  fs.writeFileSync(iconPath, buffer);

  console.log("✅ Created iconTemplate.png (20x20)");
}

// Ensure directories exist
const assetsDir = path.join(__dirname, "..", "assets");
const buildDir = path.join(__dirname, "..", "build");
const iconsDir = path.join(buildDir, "icons");

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Generate icons
createOrangeIcon(20, "assets/icon.png");  // Menu bar icon
createOrangeIcon(512, "build/icons/icon.png");  // App icon
createOrangeIcon(1024, "build/icons/icon@2x.png");  // Retina app icon
createTemplateIcon();
