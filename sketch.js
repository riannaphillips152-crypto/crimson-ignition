let angerInstance; // Global variable to hold our Anger class instance
let capture; // Variable for webcam

// --- Color Palettes: Reds, Blacks, Dark Oranges (intense, agitated) ---
const palette1 = {
  bg: '#1A0505', // Very dark, almost black-red background
  shards: [
    '#FF0000', // Bright Red
    '#DC143C', // Crimson
    '#FF4500', // OrangeRed
    '#8B0000', // Dark Red
    '#330000', // Very dark red (for tension)
  ],
  pressureGlow: '#FF6347', // Tomato for the center glow
};

const palette2 = {
  bg: '#0F0A0F', // Slightly different very dark background
  shards: [
    '#FF2400', // Scarlet
    '#E4000F', // Darker Red
    '#FF8C00', // Dark Orange
    '#A52A2A', // Brownish Red
    '#200020', // Very dark purple-black
  ],
  pressureGlow: '#FF7F50', // Coral for the center glow
};

// --- UI Logic ---
function toggleInfo() {
    const infoBox = document.getElementById('interaction-instructions');
    const icon = document.getElementById('toggle-icon');
    
    // Toggle the class
    infoBox.classList.toggle('collapsed');

    // Update icon text
    if (infoBox.classList.contains('collapsed')) {
        icon.innerText = "+";
    } else {
        icon.innerText = "−"; // minus sign
    }
}

// --- MAIN SETUP & DRAW ---

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // --- FIX: Performance Optimization ---
  pixelDensity(1);

  // --- VIDEO CAPTURE SETUP ---
  capture = createCapture(VIDEO);
  capture.size(320, 240); 
  capture.hide(); 

  // Attach the event listener to the info box
  const infoBox = document.getElementById('interaction-instructions');
  if (infoBox) {
      infoBox.addEventListener('click', toggleInfo);
  }

  angerInstance = new Anger();
  angerInstance.setup();
}

function draw() {
  angerInstance.draw();

  // --- DRAW VIDEO CAPTURE (Bottom Left) ---
  if (capture && capture.loadedmetadata) {
      let vidWidth = 230; // Matches info box width
      let vidHeight = (capture.height / capture.width) * vidWidth; 
      
      let x = 20; // Left margin
      let y = height - vidHeight - 20; // Bottom margin
      
      push();
      // Draw video
      image(capture, x, y, vidWidth, vidHeight);
      
      // Border styling matching the Anger theme (Crimson/Red)
      // noFill();
      // stroke(220, 20, 60, 150); // Crimson, semi-transparent
      // strokeWeight(2); // Slightly thicker for aggression
      // rect(x, y, vidWidth, vidHeight);
      pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  angerInstance.onResize();
  background(angerInstance.backgroundColor);
}

function mousePressed(event) {
  // Prevent interaction if clicking inside the interaction box
  if (event && event.target.closest('#interaction-instructions')) return;

  angerInstance.mousePressed();
}

class Anger {
  constructor() {
    this.shards = [];
    this.backgroundColor = color(palette1.bg);
    this.currentPalette = palette1;

    // Central pressure point properties
    this.pressureSize = 0;
    this.pressureAlpha = 0;
    this.pressureColor; // p5.js color object
    this.pressureTargetSize = 100;
    this.pressureTargetAlpha = 200;

    // Interaction controls
    this.intensity = 1; // Controlled by mouseY (speed, frequency of bursts)
    this.spread = 1; // Controlled by mouseX (chaos vs. focus)
    this.outburstCounter = 0; // Timer for click effect
  }

  setup() {
    this.applyPalette(this.currentPalette);
    background(this.backgroundColor);

    // Initial shards for simmering tension
    for (let i = 0; i < 50; i++) {
      this.shards.push(new AngerShard(random(width), random(height), this.currentPalette.shards));
    }
  }

  draw() {
    // Redraw background. No fading here for a more stark, tense feeling.
    // Or a very, very slight fade to show movement but keep intensity
    noStroke();
    fill(red(this.backgroundColor), green(this.backgroundColor), blue(this.backgroundColor), 10); 
    rect(0, 0, width, height);

    // --- INTERACTIVITY: Mouse Y for Intensity (Speed, Burst Frequency) ---
    this.intensity = map(mouseY, height, 0, 0.5, 3.0, true); // Simmering at bottom, explosive at top

    // --- INTERACTIVITY: Mouse X for Spread (Chaos vs. Focus) ---
    this.spread = map(mouseX, 0, width, 0.5, 2.5, true); // Focused left, chaotic right

    // --- Update Central Pressure Point ---
    let pulseFactor = sin(frameCount * 0.1 * this.intensity); // Faster pulse with higher intensity
    this.pressureSize = lerp(this.pressureSize, this.pressureTargetSize + pulseFactor * 30, 0.15 * this.intensity);
    this.pressureAlpha = lerp(this.pressureAlpha, this.pressureTargetAlpha + pulseFactor * 50, 0.15 * this.intensity);
    this.pressureAlpha = constrain(this.pressureAlpha, 100, 255);

    // Draw central pressure point (a pulsating, hot core)
    fill(red(this.pressureColor), green(this.pressureColor), blue(this.pressureColor), this.pressureAlpha);
    noStroke();
    ellipse(width / 2, height / 2, this.pressureSize, this.pressureSize);
    
    // Draw an inner, brighter core
    fill(red(this.pressureColor), green(this.pressureColor), blue(this.pressureColor), 255);
    ellipse(width / 2, height / 2, this.pressureSize * 0.5, this.pressureSize * 0.5);


    // Spawn new shards from the center based on intensity
    if (random(1) < 0.05 * this.intensity) { // More frequent spawning with higher intensity
      let newShard = new AngerShard(width / 2, height / 2, this.currentPalette.shards);
      newShard.applyBurstEffect(this.intensity, this.spread); // Give initial burst velocity
      this.shards.push(newShard);
    }

    // Handle click outburst
    if (this.outburstCounter > 0) {
      for (let i = 0; i < 15; i++) { // Spawn many shards quickly
        let newShard = new AngerShard(width / 2, height / 2, this.currentPalette.shards);
        newShard.applyBurstEffect(4.0, 3.0); // Very high intensity/spread for outburst
        this.shards.push(newShard);
      }
      this.outburstCounter--;
    }

    // Safety Cap for Performance
    if (this.shards.length > 200) {
        this.shards.splice(0, this.shards.length - 200);
    }

    // Update and display shards
    for (let i = this.shards.length - 1; i >= 0; i--) {
      let s = this.shards[i];
      s.update(this.intensity, this.spread);
      s.display();
      if (s.isOffscreen() || s.life <= 0) {
        this.shards.splice(i, 1);
      }
    }
  }

  applyPalette(palette) {
    this.currentPalette = palette;
    this.backgroundColor = color(palette.bg);
    this.pressureColor = color(palette.pressureGlow);
    this.shardColors = palette.shards.map(c => color(c)); // Convert hex strings to p5.Color objects
  }

  onResize() {
    // Re-initialize for a fresh start on resize
    this.shards = [];
    background(this.backgroundColor);
    for (let i = 0; i < 50; i++) {
        this.shards.push(new AngerShard(random(width), random(height), this.currentPalette.shards));
    }
  }

  mousePressed() {
    // Toggle between palettes
    if (this.currentPalette === palette1) {
      this.applyPalette(palette2);
    } else {
      this.applyPalette(palette1);
    }
    background(this.backgroundColor); // Redraw background with new color

    this.outburstCounter = 10; // Activate outburst for a short duration
  }
}

// Class for an "Anger Shard"
class AngerShard {
  constructor(x, y, colors) {
    this.x = x;
    this.y = y;
    this.initialAngle = random(TWO_PI); // Random direction
    this.speed = random(3, 8); // Fast initial speed
    this.len = random(20, 60); // Length of the shard line
    this.thickness = random(2, 6); // Thickness
    this.color = random(colors); // Pick from provided palette colors
    this.life = 255; // For fading out
    this.rotationSpeed = random(-0.1, 0.1); // Slight rotation
  }

  update(intensity, spread) {
    // Move outwards and drift, affected by intensity and spread
    this.x += cos(this.initialAngle) * this.speed * intensity * spread;
    this.y += sin(this.initialAngle) * this.speed * intensity * spread;

    // Add some random "jitter" for agitation
    this.x += random(-1, 1) * intensity;
    this.y += random(-1, 1) * intensity;

    // Slow down over time (dissipate energy)
    this.speed *= 0.96;
    this.len *= 0.98; // Shrink as it dissipates
    this.thickness *= 0.98;

    // Rotate
    this.initialAngle += this.rotationSpeed * intensity;

    // Fade over time
    this.life -= 5 * intensity; // Fade faster with higher intensity
    this.life = constrain(this.life, 0, 255);
  }

  display() {
    let alphaValue = map(this.life, 0, 255, 0, alpha(this.color));
    stroke(red(this.color), green(this.color), blue(this.color), alphaValue);
    strokeWeight(this.thickness);

    push();
    translate(this.x, this.y);
    rotate(this.initialAngle);
    line(-this.len / 2, 0, this.len / 2, 0); // Draw a horizontal line then rotate it
    pop();
  }

  isOffscreen() {
    // Remove if too far or too small/thin
    return this.life <= 0 || this.len < 1 || this.thickness < 0.5 || dist(this.x, this.y, width / 2, height / 2) > max(width, height) * 0.8;
  }

  applyBurstEffect(burstIntensity, burstSpread) {
    this.speed = random(8, 15) * burstIntensity; // Much faster
    this.len = random(40, 80); // Longer
    this.thickness = random(4, 8); // Thicker
    this.life = 255; // Full life
    this.initialAngle = random(TWO_PI); // New random direction
    this.rotationSpeed = random(-0.2, 0.2); // More rotation
  }
}