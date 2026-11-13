const keywordField = document.querySelector(".keyword-field");
const keywordMotion = document.querySelector(".keyword-motion");
const canvas = keywordField.querySelector(".keyword-sphere");
const context = canvas.getContext("2d");

if (context) {
  initialiseKeywordSphere(context);
}

function initialiseKeywordSphere(paint) {
  const motionPreference = matchMedia("(prefers-reduced-motion: no-preference)");
  const circle = Math.PI * 2;
  const tilt = 0.34;
  const roll = -0.26;
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);
  const cosRoll = Math.cos(roll);
  const sinRoll = Math.sin(roll);
  const sizes = { large: 0.158, medium: 0.113 };
  const labels = Array.from(keywordField.querySelectorAll(".keyword-list li"), (word) => {
    const style = getComputedStyle(word);
    return {
      text: word.textContent.trim(),
      family: style.fontFamily,
      weight: style.fontWeight,
      colour: style.color,
      size: sizes[word.dataset.size] ?? 0.09,
    };
  });

  // Each band has its own starting longitude and spacing based on the text widths.
  const bands = [
    { latitude: -1.01, phase: -0.17, count: 3 },
    { latitude: -0.50, phase: -1.37, count: 4 },
    { latitude: 0.01, phase: -1.12, count: 5 },
    { latitude: 0.49, phase: -0.31, count: 5 },
    { latitude: 0.98, phase: 0.23, count: 3 },
  ];

  let width = 0;
  let height = 0;
  let radius = 0;
  let angle = 0;
  let frame = null;
  let lastTime = null;
  let inView = false;
  let paused = false;

  function orient(x, y, z) {
    const tippedY = y * cosTilt - z * sinTilt;
    return {
      x: x * cosRoll - tippedY * sinRoll,
      y: x * sinRoll + tippedY * cosRoll,
      z: y * sinTilt + z * cosTilt,
    };
  }

  function traceSurface(positionAt) {
    paint.beginPath();
    let penDown = false;
    for (let step = 0; step <= 64; step += 1) {
      const { x, y, z } = positionAt(step / 64);
      if (z < 0) {
        penDown = false;
        continue;
      }
      if (penDown) {
        paint.lineTo(x * radius, y * radius);
      } else {
        paint.moveTo(x * radius, y * radius);
        penDown = true;
      }
    }
    paint.stroke();
  }

  function drawGuides() {
    paint.lineWidth = 0.75;
    paint.strokeStyle = "rgba(100, 66, 56, .14)";
    for (const latitude of [-0.76, -0.25, 0.25, 0.75]) {
      const horizontal = Math.cos(latitude);
      const y = Math.sin(latitude);
      traceSurface((fraction) => {
        const longitude = fraction * circle;
        return orient(horizontal * Math.sin(longitude), y, horizontal * Math.cos(longitude));
      });
    }

    paint.setLineDash([2, 4]);
    for (let meridian = 0; meridian < 6; meridian += 1) {
      const longitude = angle + meridian * circle / 6;
      const x = Math.sin(longitude);
      const z = Math.cos(longitude);
      traceSurface((fraction) => {
        const latitude = (fraction - 0.5) * Math.PI;
        const horizontal = Math.cos(latitude);
        return orient(horizontal * x, Math.sin(latitude), horizontal * z);
      });
    }
    paint.setLineDash([]);
  }

  function drawLabels() {
    paint.textAlign = "center";
    paint.textBaseline = "middle";

    for (const { horizontal, vertical, words } of bands) {
      for (const word of words) {
        const centre = angle + word.longitude;
        const facing = orient(horizontal * Math.sin(centre), vertical, horizontal * Math.cos(centre)).z;
        const wordOpacity = Math.max(0, Math.min(1, (facing + 0.10) / 0.36));
        if (wordOpacity === 0) continue;

        paint.font = word.font;
        paint.fillStyle = word.colour;
        for (const { letter, offset } of word.glyphs) {
          const longitude = centre + offset;
          const sine = Math.sin(longitude);
          const cosine = Math.cos(longitude);
          const position = orient(horizontal * sine, vertical, horizontal * cosine);
          if (position.z <= 0) continue;

          // The two tangent directions turn and foreshorten each letter on the sphere.
          const across = orient(cosine, 0, -sine);
          const down = orient(-vertical * sine, horizontal, -vertical * cosine);
          paint.globalAlpha = wordOpacity * Math.min(1, position.z / 0.3);
          paint.save();
          paint.transform(across.x, across.y, down.x, down.y, position.x * radius, position.y * radius);
          paint.fillText(letter, 0, 0);
          paint.restore();
        }
      }
    }
    paint.globalAlpha = 1;
  }

  function drawSphere() {
    if (!radius) return;
    paint.clearRect(0, 0, width, height);
    paint.save();
    paint.translate(width / 2, height * 0.48);

    paint.save();
    paint.translate(0, radius * 1.025);
    paint.scale(1, 0.17);
    const shadow = paint.createRadialGradient(0, 0, 0, 0, 0, radius * 0.84);
    shadow.addColorStop(0, "rgba(59, 34, 25, .19)");
    shadow.addColorStop(1, "rgba(59, 34, 25, 0)");
    paint.fillStyle = shadow;
    paint.fillRect(-radius, -radius, radius * 2, radius * 2);
    paint.restore();

    paint.beginPath();
    paint.arc(0, 0, radius, 0, circle);
    const surface = paint.createLinearGradient(-radius * 0.72, -radius * 0.64, radius * 0.78, radius * 0.64);
    surface.addColorStop(0, "#ffffff");
    surface.addColorStop(0.39, "#fbfaf8");
    surface.addColorStop(0.64, "#f4e3db");
    surface.addColorStop(0.84, "#dfa78f");
    surface.addColorStop(1, "#ca8268");
    paint.fillStyle = surface;
    paint.fill();
    paint.strokeStyle = "#78544832";
    paint.lineWidth = 1;
    paint.stroke();
    paint.clip();
    drawGuides();
    drawLabels();
    paint.restore();
  }

  function measureSphere() {
    if (!motionPreference.matches) return;
    width = keywordField.clientWidth;
    height = keywordField.clientHeight;
    radius = Math.min(width * 0.46, height * 0.445);
    if (!radius) return;

    const density = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    paint.setTransform(density, 0, 0, density, 0, 0);

    let start = 0;
    for (const band of bands) {
      band.horizontal = Math.cos(band.latitude);
      band.vertical = Math.sin(band.latitude);
      const ringRadius = radius * band.horizontal;
      band.words = labels.slice(start, start + band.count).map((label) => {
        const font = `${label.weight} ${(label.size * radius).toFixed(2)}px ${label.family}`;
        paint.font = font;
        let wordWidth = 0;
        const glyphs = Array.from(label.text, (letter) => {
          const advance = paint.measureText(letter).width;
          const centre = wordWidth + advance / 2;
          wordWidth += advance;
          return { letter, centre };
        });
        for (const glyph of glyphs) {
          glyph.offset = (glyph.centre - wordWidth / 2) / ringRadius;
        }
        return { font, glyphs, wordWidth, colour: label.colour };
      });
      start += band.count;

      const circumference = circle * ringRadius;
      const occupied = band.words.reduce((total, word) => total + word.wordWidth, 0);
      const gap = (circumference - occupied) / band.words.length;
      let cursor = band.phase * ringRadius - band.words[0].wordWidth / 2;
      for (const word of band.words) {
        word.longitude = (cursor + word.wordWidth / 2) / ringRadius;
        cursor += word.wordWidth + gap;
      }
    }
    drawSphere();
  }

  function animate(time) {
    if (lastTime !== null) {
      angle = (angle + Math.min(time - lastTime, 64) * 0.00017) % circle;
    }
    lastTime = time;
    drawSphere();
    frame = requestAnimationFrame(animate);
  }

  function syncMotion() {
    const playing = motionPreference.matches && inView && !paused && !document.hidden;
    if (playing && frame === null) {
      frame = requestAnimationFrame(animate);
    } else if (!playing && frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
    }
  }

  function updateMotionPreference() {
    keywordField.classList.toggle("is-sphere", motionPreference.matches);
    canvas.hidden = !motionPreference.matches;
    keywordMotion.hidden = !motionPreference.matches;
    measureSphere();
    syncMotion();
  }

  new ResizeObserver(measureSphere).observe(keywordField);

  Promise.all([
    document.fonts.load("800 18px Nunito"),
    document.fonts.load("900 24px Nunito"),
    document.fonts.load("700 18px Quicksand"),
  ]).then(measureSphere, measureSphere);

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncMotion();
  }).observe(keywordField);

  keywordMotion.addEventListener("click", () => {
    paused = !paused;
    keywordMotion.textContent = paused ? "Resume motion" : "Pause motion";
    syncMotion();
  });

  motionPreference.addEventListener("change", updateMotionPreference);
  document.addEventListener("visibilitychange", syncMotion);
  updateMotionPreference();
}
