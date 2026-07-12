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
camera.position.set(0, 2.75, 0); 
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
  "/KC104.glb",
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1); 
    model.position.set(0, 0, 0);
    model.rotation.y = THREE.MathUtils.degToRad(100);
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
    avatar.position.set(-1.5, 0, 3);
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
    avatar.position.x += moveDirection.x * speed;
    avatar.position.z += moveDirection.z * speed;
    avatar.rotation.y = Math.atan2(moveDirection.x, moveDirection.z);
  }

  if (avatarShadow) {
    avatarShadow.position.set(avatar.position.x, 0.05, avatar.position.z);
  }

  updateCameraLookAt();
  renderer.render(scene, camera);
  
}

animate();