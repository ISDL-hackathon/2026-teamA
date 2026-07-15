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
let screen;

loader.load("/Screen.glb", (gltf) => {

    screen = gltf.scene;
    screen.rotation.y = THREE.MathUtils.degToRad(90);
    screen.scale.set(0.7, 0.6, 0.5);
    screen.position.set(-4.5, 1, 1);

    scene.add(screen);

});

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
  selected_user: null,
  selected_track: null,
  roulette_candidates: []
};
let roomRouletteAngle = 0;
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
  ctx.fillText(roomRouletteState.selected_user || "待機中", 54, 128);

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
  ctx.moveTo(cx, cy - radius - 36);
  ctx.lineTo(cx - 24, cy - radius + 18);
  ctx.lineTo(cx + 24, cy - radius + 18);
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
const screenCameraPosition = new THREE.Vector3(-2.5, 1.2, 1.7);
const screenCameraTarget = new THREE.Vector3(-4.5, 1.5, 1.3);
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
    activeCameraMode === "screen" || activeCameraMode === "roulette"
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

function activateScreenCamera() {
  activateCameraToTarget(screenCameraPosition, screenCameraTarget, "screen");
  avatar.position.set(-1.5, 0, 1);
  autoMoveDirection = new THREE.Vector3(-1, 0, 0);
  autoMoveSteps = 70;
}

function activateRouletteCamera() {
  activateCameraToTarget(rouletteCameraPosition, rouletteCameraTarget, "roulette");
  avatar.position.set(0, 0, -7.2);
  autoMoveDirection = new THREE.Vector3(1, 0, 0);
  autoMoveSteps = 70;
}

function updateCameraLookAt() {
  if (!avatar) {
    return;
  }

  const desiredLookAt = cameraFollowEnabled
    ? avatar.position.clone().add(new THREE.Vector3(0, 1.2, 0))
    : activeCameraMode === "roulette"
      ? rouletteCameraTarget.clone()
      : screenCameraTarget.clone();

  if (cameraFollowEnabled) {
    cameraEndPosition.copy(defaultCameraPosition);
    cameraEndLookAt.copy(desiredLookAt);
  } else {
    cameraEndPosition.copy(activeCameraMode === "roulette" ? rouletteCameraPosition : screenCameraPosition);
    cameraEndLookAt.copy(activeCameraMode === "roulette" ? rouletteCameraTarget : screenCameraTarget);
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

//Screen and roulette board click handling
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener("click", (event) => {
  if (!screen && !roomRouletteMesh) {
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects([screen, roomRouletteMesh].filter(Boolean), true);

  if (intersects.length === 0) {
    return;
  }

  const hitObject = intersects[0].object;
  if (isObjectInHierarchy(hitObject, roomRouletteMesh)) {
    activateRouletteCamera();
  } else if (isObjectInHierarchy(hitObject, screen)) {
    activateScreenCamera();
  }
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
