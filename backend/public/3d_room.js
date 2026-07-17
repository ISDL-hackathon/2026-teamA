// Three.js Scene Setup
const scene = new THREE.Scene(); 
scene.background = new THREE.Color(0x1a1a1a);

// Camera 
const camera = new THREE.PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000, 
); 
camera.position.set(0, 2.7, 1); 
camera.lookAt(0, 1, 0); 
  
// Renderer 
const canvas = document.getElementById("canvas-3d");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); 
renderer.setSize(window.innerWidth, window.innerHeight); 
renderer.shadowMap.enabled = true; 
const clock = new THREE.Clock(); 

const cameraHint = document.createElement("div");
cameraHint.className = "camera-hint";
cameraHint.textContent = "Esc で元のカメラに戻る";
document.body.appendChild(cameraHint);

const movementHint = document.createElement("div");
movementHint.className = "camera-hint movement-hint";
movementHint.textContent = "W/A/S/D で 前/左/後/右 へ移動";
document.body.appendChild(movementHint);

// Lighting 
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); 
directionalLight.position.set(5, 10, 5); 
scene.add(directionalLight); 

const ambientLight = new THREE.AmbientLight(0xffffff, 1); 
scene.add(ambientLight); 

renderer.outputEncoding = THREE.sRGBEncoding; 
renderer.gammaFactor = 2.2; 

// Load Room GLB Model 
const loader = new THREE.GLTFLoader(); 
loader.load( 
  "/KC104_cropped.glb",
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1); 
    model.position.set(0, 0, 0);
    model.rotation.y = THREE.MathUtils.degToRad(71);
    model.castShadow = true; model.receiveShadow = true;
    
    // Enable shadows for all meshes 
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    scene.add(model);
    console.log("3D Room model loaded successfully");
  },
  undefined,
  (error) => {
    console.error("3Dモデルを読み込めませんでした:", error);
  },
);

// Load Screen GLB Model
let screen1;
loader.load("/Screen.glb", (gltf) => {

    screen1 = gltf.scene;
    screen1.rotation.y = THREE.MathUtils.degToRad(90);
    screen1.scale.set(0.39, 0.57, 0.5);
    screen1.position.set(-4.5, 1.12, 1);

    scene.add(screen1);

});

let screen2;
loader.load("/Screen.glb", (gltf) => {

    screen2 = gltf.scene;
    screen2.rotation.y = THREE.MathUtils.degToRad(90);
    screen2.scale.set(0.39, 0.57, 0.5);
    screen2.position.set(-4.5, 1.12, -5);

    scene.add(screen2);

});

let screen3;
loader.load("/Screen.glb", (gltf) => {

    screen3 = gltf.scene;
    screen3.rotation.y = THREE.MathUtils.degToRad(270);
    screen3.scale.set(0.39, 0.57, 0.5);
    screen3.position.set(4.8, 1.12, -4);

    scene.add(screen3);

});

let screen4;
loader.load("/Screen.glb", (gltf) => {

    screen4 = gltf.scene;
    screen4.rotation.y = THREE.MathUtils.degToRad(180);
    screen4.scale.set(0.39, 0.57, 0.5);
    screen4.position.set(0, 0.12, 5.9);

    scene.add(screen4);

});

function createTitleMaterial(text) {

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  // 半透明の黒背景
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  const paddingX = 20;
const paddingY = 10;

ctx.font = "bold 42px sans-serif";

// 文字の幅を取得
const textWidth = ctx.measureText(text).width;

// 黒背景
ctx.fillStyle = "rgba(0,0,0,0.6)";
ctx.fillRect(
    0,
    0,
    textWidth + paddingX * 2,
    42 + paddingY * 2
);

// 文字
ctx.fillStyle = "white";
ctx.textBaseline = "top";
ctx.fillText(text, paddingX, paddingY);

  const texture = new THREE.CanvasTexture(canvas);

  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true
  });
}

const categoryNames = {
  lab_trip: "旅行",
  conference: "学会",
  event: "イベント",
  other: "その他",
};


// Uploaded photos are stored as data URLs in PortalPhoto and exposed by
// GET /api/v1/photos. Each screen displays only its assigned category.
const emptyPhotoTexture = new THREE.DataTexture(new Uint8Array([17, 17, 17, 255]), 1, 1);
emptyPhotoTexture.needsUpdate = true;

function createPhotoScreenMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      currentTexture: { value: emptyPhotoTexture },
      incomingTexture: { value: emptyPhotoTexture },
      currentAspect: { value: 1 },
      incomingAspect: { value: 1 },
      transitionProgress: { value: 0 },
      transitionDirection: { value: 1 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D currentTexture;
      uniform sampler2D incomingTexture;
      uniform float currentAspect;
      uniform float incomingAspect;
      uniform float transitionProgress;
      uniform float transitionDirection;
      varying vec2 vUv;

      vec3 fittedUv(vec2 uv, float imageAspect) {
        const float screenAspect = 1.3333333;
        if (imageAspect > screenAspect) {
          float visibleHeight = screenAspect / imageAspect;
          float margin = (1.0 - visibleHeight) * 0.5;
          if (uv.y < margin || uv.y > 1.0 - margin) return vec3(0.0, 0.0, 0.0);
          return vec3(uv.x, (uv.y - margin) / visibleHeight, 1.0);
        }

        float visibleWidth = imageAspect / screenAspect;
        float margin = (1.0 - visibleWidth) * 0.5;
        if (uv.x < margin || uv.x > 1.0 - margin) return vec3(0.0, 0.0, 0.0);
        return vec3((uv.x - margin) / visibleWidth, uv.y, 1.0);
      }

      void main() {
        float shiftedX = vUv.x + transitionDirection * transitionProgress;
        vec3 fittedSample;
        vec4 color;
        if (shiftedX < 0.0) {
          fittedSample = fittedUv(vec2(shiftedX + 1.0, vUv.y), incomingAspect);
          color = fittedSample.z > 0.5 ? texture2D(incomingTexture, fittedSample.xy) : vec4(0.066, 0.066, 0.066, 1.0);
        } else if (shiftedX > 1.0) {
          fittedSample = fittedUv(vec2(shiftedX - 1.0, vUv.y), incomingAspect);
          color = fittedSample.z > 0.5 ? texture2D(incomingTexture, fittedSample.xy) : vec4(0.066, 0.066, 0.066, 1.0);
        } else {
          fittedSample = fittedUv(vec2(shiftedX, vUv.y), currentAspect);
          color = fittedSample.z > 0.5 ? texture2D(currentTexture, fittedSample.xy) : vec4(0.066, 0.066, 0.066, 1.0);
        }
        gl_FragColor = vec4(color.rgb, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}

const photoScreenPanels = [
  { category: "lab_trip", position: [-4.48, 1.95, 1], rotationY: 90 },
  { category: "conference", position: [-4.48, 1.95, -5], rotationY: 90 },
  { category: "event", position: [4.78, 1.95, -4], rotationY: -90 },
  { category: "other", position: [0, 0.95, 5.88], rotationY: 180 },
].map(({ category, position, rotationY }) => {
  const material = createPhotoScreenMaterial();
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.5), material);
  panel.position.set(...position);
  panel.rotation.y = THREE.MathUtils.degToRad(rotationY);
  panel.userData.photoScreen = {
    basePosition: panel.position.clone(),
    category,
    currentIndex: 0,
    images: [],
    requestId: 0,
    transition: null,
  };
  const title = new THREE.Mesh(
  new THREE.PlaneGeometry(0.7, 0.18),
  createTitleMaterial(categoryNames[category])
);

// 写真Planeと同じ位置
title.position.copy(panel.position);

// パネルの向きを取得
const normal = new THREE.Vector3(0, 0, 1);
normal.applyAxisAngle(
  new THREE.Vector3(0, 1, 0),
  THREE.MathUtils.degToRad(rotationY)
);

// 写真よりほんの少し前へ（Z-fighting防止）
title.position.add(normal.multiplyScalar(0.005));

// 左上へ移動
const right = new THREE.Vector3(1, 0, 0);
right.applyAxisAngle(
  new THREE.Vector3(0, 1, 0),
  THREE.MathUtils.degToRad(rotationY)
);

title.position.add(right.multiplyScalar(-0.6)); // 左
title.position.y += 0.55;                       // 上

// 向きは写真と同じ
title.rotation.copy(panel.rotation);

scene.add(title);
  scene.add(panel);
  return panel;
});

let photoScreenLoadId = 0;
const photoScreenTransitionDuration = 460;

function loadPhotoTexture(imageData) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(imageData, resolve, undefined, reject);
  });
}

function textureAspect(texture) {
  const image = texture.image;
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  return width && height ? width / height : 1;
}

async function showPhotoOnScreen(panel, photo, direction = 0) {
  const state = panel.userData.photoScreen;
  const requestId = ++state.requestId;
  try {
    const texture = await loadPhotoTexture(photo.image_data);
    if (requestId !== state.requestId) {
      texture.dispose();
      return;
    }

    texture.encoding = THREE.sRGBEncoding;
    const aspect = textureAspect(texture);
    if (state.transition?.incomingTexture) state.transition.incomingTexture.dispose();

    const material = panel.material;
    if (direction === 0 || material.uniforms.currentTexture.value === emptyPhotoTexture) {
      const previousTexture = material.uniforms.currentTexture.value;
      state.transition = null;
      material.uniforms.currentTexture.value = texture;
      material.uniforms.incomingTexture.value = emptyPhotoTexture;
      material.uniforms.currentAspect.value = aspect;
      material.uniforms.incomingAspect.value = 1;
      material.uniforms.transitionProgress.value = 0;
      if (previousTexture !== emptyPhotoTexture) previousTexture.dispose();
      return;
    }

    state.transition = {
      direction,
      incomingTexture: texture,
      incomingAspect: aspect,
      outgoingTexture: material.uniforms.currentTexture.value,
      startedAt: performance.now(),
    };
    material.uniforms.incomingTexture.value = texture;
    material.uniforms.incomingAspect.value = aspect;
    material.uniforms.transitionDirection.value = direction;
    material.uniforms.transitionProgress.value = 0;
  } catch {
    console.warn("Failed to load an uploaded photo for the room screen");
  }
}

function cyclePhotoScreen(panel, step) {
  const state = panel.userData.photoScreen;
  if (state.images.length < 2 || state.transition) return;

  state.currentIndex = (state.currentIndex + step + state.images.length) % state.images.length;
  // A positive step enters from the right; a negative step enters from the left.
  showPhotoOnScreen(panel, state.images[state.currentIndex], step);
}

function updatePhotoScreenTransitions(now) {
  photoScreenPanels.forEach((panel) => {
    const state = panel.userData.photoScreen;
    const transition = state.transition;
    if (!transition) return;

    const progress = Math.min((now - transition.startedAt) / photoScreenTransitionDuration, 1);
    panel.material.uniforms.transitionProgress.value = progress;

    if (progress === 1) {
      panel.material.uniforms.currentTexture.value = transition.incomingTexture;
      panel.material.uniforms.incomingTexture.value = emptyPhotoTexture;
      panel.material.uniforms.currentAspect.value = transition.incomingAspect;
      panel.material.uniforms.incomingAspect.value = 1;
      panel.material.uniforms.transitionProgress.value = 0;
      transition.outgoingTexture?.dispose();
      state.transition = null;
    }
  });
}

function shuffledPhotos(photos) {
  const shuffled = [...photos];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

async function refreshRoomPhotos() {
  const loadId = ++photoScreenLoadId;
  try {
    const response = await fetch("/api/v1/photos");
    if (!response.ok) throw new Error(`Photo request failed: ${response.status}`);

    const data = await response.json();
    const photos = Array.isArray(data.photos) ? data.photos : [];
    photoScreenPanels.forEach((panel) => {
      const state = panel.userData.photoScreen;
      state.images = shuffledPhotos(photos.filter((photo) => photo.category === state.category));
      state.currentIndex = 0;
      if (state.images[0]?.image_data && loadId === photoScreenLoadId) {
        showPhotoOnScreen(panel, state.images[0]);
      }
    });
  } catch (error) {
    console.warn("Failed to refresh room photos", error);
  }
}

window.refreshRoomPhotos = refreshRoomPhotos;
refreshRoomPhotos();

// ルーレット表示
let avatar = null;
let avatarMixer = null; 
let avatarActions = [];
let currentAvatarAction = null;
let avatarShadow = null;
let roomRouletteMesh = null;
let roomRouletteTexture = null;
let roomRouletteCanvas = null;
let roomRouletteContext = null;
let roomRouletteState = {
  phase: "idle",
  message: "選曲ルーレット待機中",
  selected_user_id: null,
  selected_user: null,
  selected_track: null,
  roulette_candidates: []
};
let roomRouletteAngle = 0;
let roomRouletteTargetAngle = null;
let lastRoomRouletteRenderTime = 0;

function createRoomRouletteBoard() {
  roomRouletteCanvas = document.createElement("canvas");
  roomRouletteCanvas.width = 1024;
  roomRouletteCanvas.height = 768;
  roomRouletteContext = roomRouletteCanvas.getContext("2d");
  roomRouletteTexture = new THREE.CanvasTexture(roomRouletteCanvas);
  roomRouletteTexture.encoding = THREE.sRGBEncoding;

  const material = new THREE.MeshBasicMaterial({
    map: roomRouletteTexture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  roomRouletteMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.42), material);
  roomRouletteMesh.position.set(3, 1.90, -7.55);// ルーレットの位置
  roomRouletteMesh.rotation.y = THREE.MathUtils.degToRad(-3); // ルーレットの向き
  scene.add(roomRouletteMesh);
  drawRoomRoulette();
}

function drawRoomRoulette() {
  if (!roomRouletteContext || !roomRouletteTexture) return;

  const ctx = roomRouletteContext;
  const width = roomRouletteCanvas.width;
  const height = roomRouletteCanvas.height;
  const candidates = Array.isArray(roomRouletteState.roulette_candidates)
    ? roomRouletteState.roulette_candidates
    : [];
  const colors = ["#38bdf8", "#22c55e", "#facc15", "#f472b6", "#a78bfa", "#fb7185", "#2dd4bf", "#f97316"];

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
  roundRect(ctx, 0, 0, width, height, 28);
  ctx.fill();

  ctx.fillStyle = "#e0f2fe";
  ctx.font = "700 55px sans-serif";
  ctx.fillText("選曲ルーレット", 54, 72);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 34px sans-serif";
  const showSelectedUser = roomRouletteState.phase !== "settling";
  ctx.fillText(showSelectedUser ? (roomRouletteState.selected_user || "待機中") : "抽選中", 54, 128);

  ctx.fillStyle = "#bae6fd";
  ctx.font = "28px sans-serif";
  wrapText(ctx, roomRouletteState.selected_track || roomRouletteState.message || "開始でルーレット開始", 54, 174, 420, 34);

  const displayTrack = roomRouletteState.selected_track || roomRouletteState.track_name || roomRouletteState.track;
  const displayUser = roomRouletteState.selected_user || roomRouletteState.user_name;
  if (roomRouletteState.phase === "playing" && displayTrack) {
    ctx.fillStyle = "rgba(34, 197, 94, 0.14)";
    roundRect(ctx, 42, 236, 470, 116, 18);
    ctx.fill();
    ctx.fillStyle = "#86efac";
    ctx.font = "700 24px sans-serif";
    ctx.fillText("再生中", 62, 276);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 28px sans-serif";
    wrapText(ctx, displayTrack, 62, 314, 420, 32);
    if (displayUser) {
      ctx.fillStyle = "#bae6fd";
      ctx.font = "22px sans-serif";
      ctx.fillText(`当選者: ${displayUser}`, 62, 378);
    }
  }

  const cx = 700;
  const cy = 360;
  const radius = 220;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(roomRouletteAngle);

  if (candidates.length === 0) {
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const total = candidates.reduce((sum, candidate) => sum + Number(candidate.week_minutes || 1), 0) || candidates.length;
    let start = -Math.PI / 2;
    candidates.forEach((candidate, index) => {
      const weight = Number(candidate.week_minutes || 1);
      const angle = (weight / total) * Math.PI * 2;
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, start + angle);
      ctx.closePath();
      ctx.fill();
      start += angle;
    });
  }

  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(-5, -radius + 22, 10, 92);

  ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
  ctx.beginPath();
  ctx.arc(0, 0, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.5)";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius + 18);
  ctx.lineTo(cx - 24, cy - radius - 36);
  ctx.lineTo(cx + 24, cy - radius - 36);
  ctx.closePath();
  ctx.fill();

  ctx.font = "24px sans-serif";
  candidates.slice(0, 6).forEach((candidate, index) => {
    const y = 520 + index * 34;
    ctx.fillStyle = colors[index % colors.length];
    ctx.beginPath();
    ctx.arc(66, y - 7, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = Number(candidate.user_id) === Number(roomRouletteState.selected_user_id) ? "#fef08a" : "#dbeafe";
    ctx.fillText(`${candidate.name} ${Number(candidate.week_minutes || 0).toFixed(1)}分`, 90, y);
  });

  roomRouletteTexture.needsUpdate = true;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split("");
  let line = "";
  let currentY = y;
  words.forEach((word) => {
    const testLine = line + word;
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  });
  ctx.fillText(line, x, currentY);
}

function roomRouletteRanges(candidates) {
  const total = candidates.reduce((sum, candidate) => sum + (Number(candidate.week_minutes) || 1), 0) || candidates.length;
  let cursor = 0;
  return candidates.map((candidate, index) => {
    const weight = Number(candidate.week_minutes) || 1;
    const end = index === candidates.length - 1 ? Math.PI * 2 : cursor + (weight / total) * Math.PI * 2;
    const range = { start: cursor, end };
    cursor = end;
    return range;
  });
}

function roomRouletteStopAngle(state) {
  const candidates = Array.isArray(state.roulette_candidates) ? state.roulette_candidates : [];
  if (candidates.length === 0 || !state.selected_user_id) return null;

  const winnerIndex = candidates.findIndex((candidate) => Number(candidate.user_id) === Number(state.selected_user_id));
  if (winnerIndex < 0) return null;

  const ranges = roomRouletteRanges(candidates);
  const targetRange = ranges[winnerIndex];
  const targetAngle = Number.isFinite(Number(state.roulette_stop_angle))
    ? THREE.MathUtils.degToRad(Number(state.roulette_stop_angle))
    : (targetRange.start + targetRange.end) / 2;
  const currentBase = positiveModulo(roomRouletteAngle, Math.PI * 2);
  const targetRotation = positiveModulo(-targetAngle, Math.PI * 2);
  const deltaToTarget = positiveModulo(targetRotation - currentBase, Math.PI * 2);

  return roomRouletteAngle + deltaToTarget;
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

window.updateRoomRoulette = (state) => {
  const incomingState = state || {};
  const selectedTrack =
    incomingState.selected_track ||
    incomingState.track_name ||
    incomingState.track ||
    incomingState.song_name ||
    null;

  roomRouletteState = {
    ...roomRouletteState,
    ...incomingState,
    selected_track: selectedTrack,
  };
  if (roomRouletteState.phase === "settling") {
    roomRouletteTargetAngle = roomRouletteStopAngle(roomRouletteState);
  } else if (roomRouletteState.phase === "spinning") {
    roomRouletteTargetAngle = null;
  } else if (roomRouletteState.phase === "result" || roomRouletteState.phase === "playing" || roomRouletteState.phase === "error" || roomRouletteState.phase === "stopped") {
    roomRouletteTargetAngle = null;
  }
  drawRoomRoulette();
};

window.updateRoomNowPlaying = (trackState) => {
  roomRouletteState = {
    ...roomRouletteState,
    ...trackState,
    phase: "playing",
  };
  roomRouletteTargetAngle = null;
  drawRoomRoulette();
};

// Load Avatar GLB Model 
loader.load( 
  "animal-chick.glb",
  (gltf) => {
    avatar = gltf.scene;
    avatar.scale.set(0.5, 0.5, 0.5);
    avatar.position.set(-0.5, 0, -0.5);
    scene.add(avatar);

    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });

    avatarShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 32),
      shadowMaterial,
    );
    avatarShadow.rotation.x = -Math.PI / 2;
    avatarShadow.position.set(avatar.position.x, 0.05, avatar.position.z);
    scene.add(avatarShadow);
    
    avatarMixer = new THREE.AnimationMixer(avatar);
    avatarActions = gltf.animations || []; 
    
    if (avatarActions.length > 0) {
      playAvatarAnimationByName("idle");
    }
    
  }
);

createRoomRouletteBoard();

//Animateion function to play avatar animations by name
function playAvatarAnimationByName(name) {

  if (!avatarMixer) return;

  const clip = avatarActions.find((clip) => clip.name === name);

  if (!clip) return;

  const action = avatarMixer.clipAction(clip);

  if (currentAvatarAction === action) return;

  if (currentAvatarAction) {
    currentAvatarAction.fadeOut(0.2);
  }

  currentAvatarAction = action;

  currentAvatarAction
    .reset()
    .fadeIn(0.2)
    .play();
}


// Wall
const walls = window.roomWalls || [];

// Handle window resize 
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight; 
  camera.aspect = width / height; 
  camera.updateProjectionMatrix(); 
  renderer.setSize(width, height);
 }
);

const defaultCameraPosition = new THREE.Vector3(0, 2.7, 2);
const defaultCameraTarget = new THREE.Vector3(0, 1, 0);
const screenCameraViews = {
  screen1: {
    position: new THREE.Vector3(-2.5, 1.2, 1.7),
    target: new THREE.Vector3(-4.5, 1.5, 1.3),
  },
  screen2: {
    position: new THREE.Vector3(-2.5, 1.2, -4.3),
    target: new THREE.Vector3(-4.5, 1.9, -5),
  },
  screen3: {
    position: new THREE.Vector3(2.7, 1.2, -3.3),
    target: new THREE.Vector3(5, 1.5, -4),
  },
  screen4: {
    position: new THREE.Vector3(0, 1.2, 4.4),
    target: new THREE.Vector3(0, 0.8, 5.9),
  },
};
const rouletteCameraPosition = new THREE.Vector3(1.8, 1.3, -6);
const rouletteCameraTarget = new THREE.Vector3(2.3, 1.4, -7.2);

let cameraFollowEnabled = true;
let activeCameraMode = "default";
let cameraTransitionProgress = 1;
const cameraTransitionSpeed = 0.04;
let cameraStartPosition = defaultCameraPosition.clone();
let cameraStartLookAt = defaultCameraTarget.clone();
let cameraEndPosition = defaultCameraPosition.clone();
let cameraEndLookAt = defaultCameraTarget.clone();
let cameraLookAtTarget = defaultCameraTarget.clone();
let autoMoveDirection = null;
let autoMoveSteps = 0;
let movementEnabled = true;
let movementHintTimer = null;
const movementHintDelay = 1000;

function updateCameraHint() {
  cameraHint.classList.toggle(
    "is-visible",
    activeCameraMode.startsWith("screen") || activeCameraMode === "roulette"
  );
  movementHint.classList.toggle(
    "is-visible",
    activeCameraMode === "default" && movementHintTimer !== null
  );
}

function resetMovementHintTimer() {
  clearTimeout(movementHintTimer);
  movementHint.classList.remove("is-visible");
  movementHintTimer = window.setTimeout(() => {
    if (activeCameraMode === "default") {
      movementHint.classList.add("is-visible");
    }
  }, movementHintDelay);
}

resetMovementHintTimer();

function resetCameraToDefault() {
  cameraFollowEnabled = true;
  activeCameraMode = "default";
  movementEnabled = true;
  cameraTransitionProgress = 0;
  cameraStartPosition.copy(camera.position);
  cameraStartLookAt.copy(cameraLookAtTarget);
  cameraEndPosition.copy(defaultCameraPosition);
  cameraEndLookAt.copy(defaultCameraTarget);
  updateCameraHint();
}

function activateCameraToTarget(position, target, mode) {
  if (!avatar) {
    return;
  }
  if (!movementEnabled) {
    return;
  }
  if (activeCameraMode === mode) {
    return;
  }

  cameraFollowEnabled = false;
  activeCameraMode = mode;
  movementEnabled = false;
  cameraTransitionProgress = 0;
  cameraStartPosition.copy(camera.position);
  cameraStartLookAt.copy(cameraLookAtTarget);
  cameraEndPosition.copy(position);
  cameraEndLookAt.copy(target);

  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
  updateCameraHint();
}

function activateScreen1Camera() {
  if (activeCameraMode === "screen1") {
    return;
  }

  activateCameraToTarget(screenCameraViews.screen1.position, screenCameraViews.screen1.target, "screen1");
  avatar.position.set(-1.5, 0, 1);
  autoMoveDirection = new THREE.Vector3(-1, 0, 0);
  autoMoveSteps = 70;
}

function activateScreen2Camera() {
  if (activeCameraMode === "screen2") {
    return;
  }

  activateCameraToTarget(screenCameraViews.screen2.position, screenCameraViews.screen2.target, "screen2");
  avatar.position.set(-1, 0, -6);
  autoMoveDirection = new THREE.Vector3(-1, 0, 0);
  autoMoveSteps = 100;
}

function activateScreen3Camera() {
  if (activeCameraMode === "screen3") {
    return;
  }

  activateCameraToTarget(screenCameraViews.screen3.position, screenCameraViews.screen3.target, "screen3");
  avatar.position.set(3, 0, -4.6);
  autoMoveDirection = new THREE.Vector3(1, 0, 0);
  autoMoveSteps = 80;
}

function activateScreen4Camera() {
  if (activeCameraMode === "screen4") {
    return;
  }

  activateCameraToTarget(screenCameraViews.screen4.position, screenCameraViews.screen4.target, "screen4");
  avatar.position.set(0, 0, 2.8);
  autoMoveDirection = new THREE.Vector3(0, 0, 1);
  autoMoveSteps = 80;
}

function activateRouletteCamera() {
  if (activeCameraMode === "roulette") {
    return;
  }

  activateCameraToTarget(rouletteCameraPosition, rouletteCameraTarget, "roulette");
  avatar.position.set(0, 0, -7.2);
  autoMoveDirection = new THREE.Vector3(1, 0, 0);
  autoMoveSteps = 70;
}

function updateCameraLookAt() {
  if (!avatar) {
    return;
  }

  const activeCameraView = activeCameraMode === "roulette"
    ? { position: rouletteCameraPosition, target: rouletteCameraTarget }
    : screenCameraViews[activeCameraMode];
  const desiredLookAt = cameraFollowEnabled
    ? avatar.position.clone().add(new THREE.Vector3(0, 1.2, 0))
    : activeCameraView.target.clone();

  if (cameraFollowEnabled) {
    cameraEndPosition.copy(defaultCameraPosition);
    cameraEndLookAt.copy(desiredLookAt);
  } else {
    cameraEndPosition.copy(activeCameraView.position);
    cameraEndLookAt.copy(activeCameraView.target);
  }

  if (cameraTransitionProgress < 1) {
    cameraTransitionProgress = Math.min(1, cameraTransitionProgress + cameraTransitionSpeed);
    camera.position.lerpVectors(cameraStartPosition, cameraEndPosition, cameraTransitionProgress);
    cameraLookAtTarget.lerpVectors(cameraStartLookAt, cameraEndLookAt, cameraTransitionProgress);
    camera.lookAt(cameraLookAtTarget);
    return;
  }

  camera.position.copy(cameraEndPosition);
  cameraLookAtTarget.copy(cameraEndLookAt);
  camera.lookAt(cameraLookAtTarget);
}

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();

  const zoomSpeed = 0.3;
  const direction = camera.position.clone().normalize();

  if (e.deltaY > 0) {
    camera.position.addScaledVector(direction, zoomSpeed);
  } else {
    camera.position.addScaledVector(direction, -zoomSpeed);
  }
});

function isObjectInHierarchy(object, ancestor) {
  let current = object;
  while (current) {
    if (current === ancestor) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function screenLocalBounds(screenModel) {
  if (screenModel.userData.interactionBounds) return screenModel.userData.interactionBounds;

  screenModel.updateMatrixWorld(true);
  const screenWorldInverse = new THREE.Matrix4().copy(screenModel.matrixWorld).invert();
  const bounds = new THREE.Box3();
  screenModel.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;

    child.geometry.computeBoundingBox();
    if (!child.geometry.boundingBox) return;

    const childBounds = child.geometry.boundingBox.clone();
    const childToScreen = new THREE.Matrix4().multiplyMatrices(screenWorldInverse, child.matrixWorld);
    bounds.union(childBounds.applyMatrix4(childToScreen));
  });
  screenModel.userData.interactionBounds = bounds;
  return bounds;
}

function screenEdgeStep(screenModel, hitPoint) {
  const bounds = screenLocalBounds(screenModel);
  const width = bounds.max.x - bounds.min.x;
  if (width <= 0) return 0;

  const localPoint = screenModel.worldToLocal(hitPoint.clone());
  const horizontalPosition = (localPoint.x - bounds.min.x) / width;
  if (horizontalPosition <= 0.04) return -1;
  if (horizontalPosition >= 0.96) return 1;
  return 0;
}

//Screen and roulette board click handling
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener("click", (event) => {
  if (![screen1, screen2, screen3, screen4].some(Boolean) && !roomRouletteMesh) {
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const screenModels = [screen1, screen2, screen3, screen4];
  const intersects = raycaster.intersectObjects([...screenModels, roomRouletteMesh].filter(Boolean), true);

  if (intersects.length === 0) {
    return;
  }

  const hit = intersects[0];
  const hitObject = hit.object;
  if (isObjectInHierarchy(hitObject, roomRouletteMesh)) {
    activateRouletteCamera();
    return;
  }

  const screenIndex = screenModels.findIndex((screenModel) => isObjectInHierarchy(hitObject, screenModel));
  if (screenIndex < 0) return;

  const step = screenEdgeStep(screenModels[screenIndex], hit.point);
  if (step !== 0) {
    cyclePhotoScreen(photoScreenPanels[screenIndex], step);
    return;
  }

  [activateScreen1Camera, activateScreen2Camera, activateScreen3Camera, activateScreen4Camera][screenIndex]();
});

//collision detection
const keys = {};
const speed = 0.03;
const avatarCollisionHalfSize = new THREE.Vector3(0.25, 0.8, 0.25);

function getAvatarCollisionBox(position) {
  return new THREE.Box3(
    new THREE.Vector3(
      position.x - avatarCollisionHalfSize.x,
      position.y,
      position.z - avatarCollisionHalfSize.z,
    ),
    new THREE.Vector3(
      position.x + avatarCollisionHalfSize.x,
      position.y + avatarCollisionHalfSize.y,
      position.z + avatarCollisionHalfSize.z,
    ),
  );
}

function isAvatarColliding(position) {
  const collisionBox = getAvatarCollisionBox(position);
  return walls.some((wall) => collisionBox.intersectsBox(wall));
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (key === "escape") {
    resetCameraToDefault();
    return;
  }

  if (!movementEnabled && ["w", "a", "s", "d"].includes(key)) {
    return;
  }

  keys[key] = true;
  resetMovementHintTimer();
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
  resetMovementHintTimer();
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  updatePhotoScreenTransitions(performance.now());
  
  if (avatarMixer) {
    avatarMixer.update(clock.getDelta());
  }
  
  if (!avatar) {
    return;
  } 

  const isMoving = movementEnabled && (keys["w"] || keys["s"] || keys["a"] || keys["d"]);

  if (autoMoveDirection && autoMoveSteps > 0) {
    const proposedPosition = avatar.position.clone().add(autoMoveDirection.clone().multiplyScalar(speed));

    if (!isAvatarColliding(proposedPosition)) {
      avatar.position.copy(proposedPosition);
      avatar.rotation.y = Math.atan2(autoMoveDirection.x, autoMoveDirection.z);
      playAvatarAnimationByName("walk");
      autoMoveSteps -= 1;
    } else {
      playAvatarAnimationByName("idle");
      autoMoveSteps = 0;
    }
  } else if (isMoving) {
    playAvatarAnimationByName("walk");
  } else {
    playAvatarAnimationByName("idle");
  }

  const cameraToAvatar = new THREE.Vector3(
    avatar.position.x - camera.position.x,
    0,
    avatar.position.z - camera.position.z,
  );

  if (cameraToAvatar.lengthSq() > 0) {
    cameraToAvatar.normalize();
  }

  const moveDirection = new THREE.Vector3();

  if (movementEnabled) {
    if (keys["w"]) {
      moveDirection.add(cameraToAvatar);
    }

    if (keys["s"]) {
      moveDirection.add(cameraToAvatar.clone().multiplyScalar(-1));
    }

    if (keys["a"]) {
      moveDirection.add(
        new THREE.Vector3(cameraToAvatar.z, 0, -cameraToAvatar.x),
      );
    }

    if (keys["d"]) {
      moveDirection.add(
        new THREE.Vector3(-cameraToAvatar.z, 0, cameraToAvatar.x),
      );
    }

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();

      const deltaX = moveDirection.x * speed;
      const deltaZ = moveDirection.z * speed;
      const nextPosition = avatar.position.clone();
      const actualMove = new THREE.Vector3();

      if (Math.abs(deltaX) > 0) {
        const xOnlyPosition = nextPosition.clone();
        xOnlyPosition.x += deltaX;

        if (!isAvatarColliding(xOnlyPosition)) {
          nextPosition.x += deltaX;
          actualMove.x = deltaX;
        }
      }

      if (Math.abs(deltaZ) > 0) {
        const zOnlyPosition = nextPosition.clone();
        zOnlyPosition.z += deltaZ;

        if (!isAvatarColliding(zOnlyPosition)) {
          nextPosition.z += deltaZ;
          actualMove.z = deltaZ;
        }
      }

      if (actualMove.lengthSq() > 0) {
        avatar.position.copy(nextPosition);
        avatar.rotation.y = Math.atan2(actualMove.x, actualMove.z);
        playAvatarAnimationByName("walk");
      } else {
        playAvatarAnimationByName("idle");
      }
    } else {
      playAvatarAnimationByName("idle");
    }
  } else {
    playAvatarAnimationByName("idle");
  }

  if (avatarShadow) {
    avatarShadow.position.set(avatar.position.x, 0.05, avatar.position.z);
  }

  if (roomRouletteState.phase === "spinning") {
    roomRouletteAngle += 0.12;
    drawRoomRoulette();
  } else if (roomRouletteTargetAngle !== null) {
    roomRouletteAngle += (roomRouletteTargetAngle - roomRouletteAngle) * 0.045;
    if (Math.abs(roomRouletteTargetAngle - roomRouletteAngle) < 0.002) {
      roomRouletteAngle = roomRouletteTargetAngle;
      roomRouletteTargetAngle = null;
    }
    drawRoomRoulette();
  } else if (roomRouletteState.phase === "playing") {
    const now = performance.now();
    if (now - lastRoomRouletteRenderTime > 500) {
      lastRoomRouletteRenderTime = now;
      if (roomRouletteMesh) roomRouletteMesh.visible = true;
      drawRoomRoulette();
    }
  }

  updateCameraLookAt();
  renderer.render(scene, camera);
  
}

animate();
