const { createCanvas } = require("canvas");
const fs = require("node:fs");
const path = require("node:path");

function createOrangeIcon() {
  // Create a 20x20 canvas (standard menu bar icon size)
  const canvas = createCanvas(20, 20);
  const ctx = canvas.getContext("2d");

  // Clear the canvas
  ctx.clearRect(0, 0, 20, 20);

  // Create gradient from light orange to dark orange
  const gradient = ctx.createRadialGradient(10, 10, 0, 10, 10, 8);
  gradient.addColorStop(0, "#FF8C42"); // Light orange
  gradient.addColorStop(1, "#FF6B1A"); // Dark orange

  // Draw circle
  ctx.beginPath();
  ctx.arc(10, 10, 8, 0, 2 * Math.PI);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Add white 'C' for Claude
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("C", 10, 10);

  // Save regular icon
  const buffer = canvas.toBuffer("image/png");
  const iconPath = path.join(__dirname, "..", "assets", "icon.png");
  fs.writeFileSync(iconPath, buffer);

  console.log("✅ Created icon.png (20x20)");
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

// Generate both icons
createOrangeIcon();
createTemplateIcon();
