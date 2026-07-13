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

// Load GLB Model 
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
let avatar = null;
let avatarMixer = null; 
let avatarActions = [];
let currentAvatarAction = null;
let avatarShadow = null;

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

// Wall
const walls = [];

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-4.75, 0, -7.8),
    new THREE.Vector3(5.4, 4, -7.7)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-4.85, 0, -7.7),
    new THREE.Vector3(-4.75, 4, 9.75)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-4.75, 0, 9.75),
    new THREE.Vector3(-3, 4, 9.85)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-3, 0, 6.1),
    new THREE.Vector3(-2.9, 4, 9.75)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-2.9, 0, 6),
    new THREE.Vector3(5.4, 4, 6.1)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(5.4, 0, -7.7),
    new THREE.Vector3(5.5, 4, 6)
  )
);

// Objects
walls.push(
  new THREE.Box3(
    new THREE.Vector3(1.9, 0, -7.7),
    new THREE.Vector3(5.4, 2, -4.9)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(4.8, 0, -4.9),
    new THREE.Vector3(5.4, 2, -2.4)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(1.2, 0, -6.4),
    new THREE.Vector3(1.9, 2, -5.1)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(1.6, 0, -4.3),
    new THREE.Vector3(4, 2, -3)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(2.1, 0, -4.35),
    new THREE.Vector3(2.6, 2, -4.3)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(2.1, 0, -3),
    new THREE.Vector3(2.7, 2, -2.5)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(3.5, 0, -2.4),
    new THREE.Vector3(4.8, 2, -1.6)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(3.2, 0, -1.7),
    new THREE.Vector3(3.3, 2, 1.1)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(3, 0, -1.9),
    new THREE.Vector3(3.2, 2, -1.6)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(2.7, 0, 0.2),
    new THREE.Vector3(3.2, 2, 0.6)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(2.7, 0, 2.2),
    new THREE.Vector3(3.05, 2, 2.6)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(2.2, 0, 2),
    new THREE.Vector3(3.15, 2, 2.15)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(4, 0, -1.7),
    new THREE.Vector3(4.5, 2, 3.9)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(3.05, 0, 2),
    new THREE.Vector3(3.15, 2, 4.6)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(3.15, 0, 3.9),
    new THREE.Vector3(4.5, 2, 4.6)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(4.2, 0, 4.6),
    new THREE.Vector3(4.8, 2, 6)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(1.5, 0, 5.8),
    new THREE.Vector3(4.2, 2, 6)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(0.8, 0, 5.6),
    new THREE.Vector3(1.5, 2, 6)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-3.25, 0, 7.15),
    new THREE.Vector3(-3, 2, 8.8)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-4.75, 0, 7.6),
    new THREE.Vector3(-4.5, 2, 9.3)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-4.75, 0, 6),
    new THREE.Vector3(-4.3, 2, 7.6)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-4.75, 0, 3.7),
    new THREE.Vector3(-3.8, 2, 4.4)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-4.75, 0, -1.85),
    new THREE.Vector3(-3.9, 2, 3.7)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-3.9, 0, 0.1),
    new THREE.Vector3(-3.6, 2, 0.3)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-4.75, 0, -2.8),
    new THREE.Vector3(-3.3, 2, -1.85)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-4.75, 0, -4),
    new THREE.Vector3(-3.8, 2, -2.8)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-4.75, 0, -5.8),
    new THREE.Vector3(-4, 2, -4)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-4.75, 0, -7.1),
    new THREE.Vector3(-3.8, 2, -5.8)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-3.8, 0, -6.6),
    new THREE.Vector3(-3.5, 2, -6.2)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-4.75, 0, -7.7),
    new THREE.Vector3(-4.4, 2, -7.1)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-2.05, 0, -7.7),
    new THREE.Vector3(-0.5, 2, -7.2)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-2.4, 0, -5.7),
    new THREE.Vector3(-0.7, 2, -3)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-0.7, 0, -5.7),
    new THREE.Vector3(-0.1, 2, -5)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-2.6, 0, -1.5),
    new THREE.Vector3(-1.4, 2, -1.1)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-2.9, 0, -1.1),
    new THREE.Vector3(-1, 2, -0.7)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-2.7, 0, -0.7),
    new THREE.Vector3(-1.2, 2, -0.3)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-2, 0, -0.3),
    new THREE.Vector3(-1.1, 2, 0.1)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(1.4, 0, -1.9),
    new THREE.Vector3(2, 2, -1.7)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(0.8, 0, -1.7),
    new THREE.Vector3(2.1, 2, -1.3)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(0.6, 0, -1.3),
    new THREE.Vector3(2.4, 2, -0.9)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(0.5, 0, -0.9),
    new THREE.Vector3(2.4, 2, -0.5)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(0.7, 0, -0.5),
    new THREE.Vector3(2.1, 2, -0.1)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(1.2, 0, -0.1),
    new THREE.Vector3(1.9, 2, 0.3)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-0.5, 0, 0.5),
    new THREE.Vector3(0.2, 2, 0.8)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-1.2, 0, 0.8),
    new THREE.Vector3(0.3, 2, 1.2)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-1.1, 0, 1.2),
    new THREE.Vector3(0.6, 2, 1.6)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-1.2, 0, 1.6),
    new THREE.Vector3(0.5, 2, 2)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-1.1, 0, 2),
    new THREE.Vector3(0.2, 2, 2.4)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(0.9, 0, 2.7),
    new THREE.Vector3(1.9, 2, 3.1)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(0.8, 0, 3.1),
    new THREE.Vector3(2.1, 2, 3.5)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(0.7, 0, 3.5),
    new THREE.Vector3(2.3, 2, 3.9)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(0.8, 0, 3.9),
    new THREE.Vector3(2.4, 2, 4.3)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(1.3, 0, 4.3),
    new THREE.Vector3(2.1, 2, 4.7)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-2, 0, 3.2),
    new THREE.Vector3(-1.1, 2, 3.6)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-2.5, 0, 3.6),
    new THREE.Vector3(-0.7, 2, 4)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-2.4, 0, 4),
    new THREE.Vector3(-0.8, 2, 4.4)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-2.5, 0, 4.4),
    new THREE.Vector3(-1, 2, 4.8)
  )
);

walls.push(
  new THREE.Box3(
    new THREE.Vector3(-1.9, 0, 4.8),
    new THREE.Vector3(-1.2, 2, 5.1)
  )
);

/*
// Wall helpers
function addWallHelpers(boxes) {
  boxes.forEach((wall) => {
    const helper = new THREE.Box3Helper(wall);
    scene.add(helper);
  });
}
addWallHelpers(walls);
*/

// Handle window resize 
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight; 
  camera.aspect = width / height; 
  camera.updateProjectionMatrix(); 
  renderer.setSize(width, height);
 }
);

// Camera stays fixed in place and only changes its viewing direction.
function updateCameraLookAt() {
  if (!avatar) {
    return;
  }

  const lookAtTarget = avatar.position.clone().add(new THREE.Vector3(0, 1.2, 0));
  camera.lookAt(lookAtTarget);
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
  keys[e.key.toLowerCase()] = true;
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

  const isMoving = keys["w"] || keys["s"] || keys["a"] || keys["d"];

  if (isMoving) {
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

  if (avatarShadow) {
    avatarShadow.position.set(avatar.position.x, 0.05, avatar.position.z);
  }

  updateCameraLookAt();
  renderer.render(scene, camera);
  
}

animate();