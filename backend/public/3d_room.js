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
    console.error("Error loading model:", error);
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

let avatar = null;
let avatarMixer = null; 
let avatarActions = [];
let currentAvatarAction = null;
let avatarShadow = null;

// Load Avatar GLB Model 
loader.load( 
  "animal-chick.glb",
  (gltf) => {
    avatar = gltf.scene;
    avatar.scale.set(0.5, 0.5, 0.5);
    avatar.position.set(-0.5, 0, -2);
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

const defaultCameraPosition = new THREE.Vector3(0, 2.7, 1);
const defaultCameraTarget = new THREE.Vector3(0, 1, 0);
const screenCameraPosition = new THREE.Vector3(-2.5, 1.2, 1.7);
const screenCameraTarget = new THREE.Vector3(-4.5, 1.5, 1.3);

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

function resetCameraToDefault() {
  cameraFollowEnabled = true;
  activeCameraMode = "default";
  movementEnabled = true;
  cameraTransitionProgress = 0;
  cameraStartPosition.copy(camera.position);
  cameraStartLookAt.copy(cameraLookAtTarget);
  cameraEndPosition.copy(defaultCameraPosition);
  cameraEndLookAt.copy(defaultCameraTarget);
}

function activateScreenCamera() {
  if (!avatar) {
    return;
  }

  cameraFollowEnabled = false;
  activeCameraMode = "screen";
  movementEnabled = false;
  cameraTransitionProgress = 0;
  cameraStartPosition.copy(camera.position);
  cameraStartLookAt.copy(cameraLookAtTarget);
  cameraEndPosition.copy(screenCameraPosition);
  cameraEndLookAt.copy(screenCameraTarget);

  avatar.position.set(-1.5, 0, 1);
  autoMoveDirection = new THREE.Vector3(-1, 0, 0);
  autoMoveSteps = 70;
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
}

function updateCameraLookAt() {
  if (!avatar) {
    return;
  }

  const desiredLookAt = cameraFollowEnabled
    ? avatar.position.clone().add(new THREE.Vector3(0, 1.2, 0))
    : screenCameraTarget.clone();

  if (cameraFollowEnabled) {
    cameraEndPosition.copy(defaultCameraPosition);
    cameraEndLookAt.copy(desiredLookAt);
  } else {
    cameraEndPosition.copy(screenCameraPosition);
    cameraEndLookAt.copy(screenCameraTarget);
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

//Screen click event to open a new window with the screen content
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener("click", (event) => {
  if (!screen) {
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(screen, true);

  if (intersects.length > 0) {
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
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
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

  updateCameraLookAt();
  renderer.render(scene, camera);
  
}

animate();