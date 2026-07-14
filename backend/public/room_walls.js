(() => {
  const THREE = window.THREE;
  if (!THREE) {
    console.error("THREE.js is not available for room_walls.js");
    return;
  }

  const wallBoxes = [];

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-4.75, 0, -7.8),
      new THREE.Vector3(5.4, 4, -7.7)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-4.85, 0, -7.7),
      new THREE.Vector3(-4.75, 4, 9.75)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-4.75, 0, 9.75),
      new THREE.Vector3(-3, 4, 9.85)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-3, 0, 6.1),
      new THREE.Vector3(-2.9, 4, 9.75)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-2.9, 0, 6),
      new THREE.Vector3(5.4, 4, 6.1)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(5.4, 0, -7.7),
      new THREE.Vector3(5.5, 4, 6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(1.9, 0, -7.7),
      new THREE.Vector3(5.4, 2, -4.9)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(4.8, 0, -4.9),
      new THREE.Vector3(5.4, 2, -2.4)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(1.2, 0, -6.4),
      new THREE.Vector3(1.9, 2, -5.1)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(1.6, 0, -4.3),
      new THREE.Vector3(4, 2, -3)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(2.1, 0, -4.35),
      new THREE.Vector3(2.6, 2, -4.3)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(2.1, 0, -3),
      new THREE.Vector3(2.7, 2, -2.5)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(3.5, 0, -2.4),
      new THREE.Vector3(4.8, 2, -1.6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(3.2, 0, -1.7),
      new THREE.Vector3(3.3, 2, 1.1)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(3, 0, -1.9),
      new THREE.Vector3(3.2, 2, -1.6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(2.7, 0, 0.2),
      new THREE.Vector3(3.2, 2, 0.6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(2.7, 0, 2.2),
      new THREE.Vector3(3.05, 2, 2.6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(2.2, 0, 2),
      new THREE.Vector3(3.15, 2, 2.15)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(4, 0, -1.7),
      new THREE.Vector3(4.5, 2, 3.9)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(3.05, 0, 2),
      new THREE.Vector3(3.15, 2, 4.6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(3.15, 0, 3.9),
      new THREE.Vector3(4.5, 2, 4.6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(4.2, 0, 4.6),
      new THREE.Vector3(4.8, 2, 6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(1.5, 0, 5.8),
      new THREE.Vector3(4.2, 2, 6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(0.8, 0, 5.6),
      new THREE.Vector3(1.5, 2, 6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-3.25, 0, 7.15),
      new THREE.Vector3(-3, 2, 8.8)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-4.75, 0, 7.6),
      new THREE.Vector3(-4.5, 2, 9.3)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-4.75, 0, 6),
      new THREE.Vector3(-4.3, 2, 7.6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-4.75, 0, 3.7),
      new THREE.Vector3(-3.8, 2, 4.4)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-4.75, 0, -1.85),
      new THREE.Vector3(-3.9, 2, 3.7)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-3.9, 0, 0.1),
      new THREE.Vector3(-3.6, 2, 0.3)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-4.75, 0, -2.8),
      new THREE.Vector3(-3.3, 2, -1.85)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-4.75, 0, -4),
      new THREE.Vector3(-3.8, 2, -2.8)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-4.75, 0, -5.8),
      new THREE.Vector3(-4, 2, -4)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-4.75, 0, -7.1),
      new THREE.Vector3(-3.8, 2, -5.8)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-3.8, 0, -6.6),
      new THREE.Vector3(-3.5, 2, -6.2)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-4.75, 0, -7.7),
      new THREE.Vector3(-4.4, 2, -7.1)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-2.05, 0, -7.7),
      new THREE.Vector3(-0.5, 2, -7.2)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-2.4, 0, -5.7),
      new THREE.Vector3(-0.7, 2, -3)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-0.7, 0, -5.7),
      new THREE.Vector3(-0.1, 2, -5)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-2.6, 0, -1.5),
      new THREE.Vector3(-1.4, 2, -1.1)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-2.9, 0, -1.1),
      new THREE.Vector3(-1, 2, -0.7)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-2.7, 0, -0.7),
      new THREE.Vector3(-1.2, 2, -0.3)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-2, 0, -0.3),
      new THREE.Vector3(-1.1, 2, 0.1)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(1.4, 0, -1.9),
      new THREE.Vector3(2, 2, -1.7)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(0.8, 0, -1.7),
      new THREE.Vector3(2.1, 2, -1.3)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(0.6, 0, -1.3),
      new THREE.Vector3(2.4, 2, -0.9)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(0.5, 0, -0.9),
      new THREE.Vector3(2.4, 2, -0.5)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(0.7, 0, -0.5),
      new THREE.Vector3(2.1, 2, -0.1)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(1.2, 0, -0.1),
      new THREE.Vector3(1.9, 2, 0.3)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-0.5, 0, 0.5),
      new THREE.Vector3(0.2, 2, 0.8)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-1.2, 0, 0.8),
      new THREE.Vector3(0.3, 2, 1.2)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-1.1, 0, 1.2),
      new THREE.Vector3(0.6, 2, 1.6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-1.2, 0, 1.6),
      new THREE.Vector3(0.5, 2, 2)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-1.1, 0, 2),
      new THREE.Vector3(0.2, 2, 2.4)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(0.9, 0, 2.7),
      new THREE.Vector3(1.9, 2, 3.1)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(0.8, 0, 3.1),
      new THREE.Vector3(2.1, 2, 3.5)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(0.7, 0, 3.5),
      new THREE.Vector3(2.3, 2, 3.9)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(0.8, 0, 3.9),
      new THREE.Vector3(2.4, 2, 4.3)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(1.3, 0, 4.3),
      new THREE.Vector3(2.1, 2, 4.7)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-2, 0, 3.2),
      new THREE.Vector3(-1.1, 2, 3.6)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-2.5, 0, 3.6),
      new THREE.Vector3(-0.7, 2, 4)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-2.4, 0, 4),
      new THREE.Vector3(-0.8, 2, 4.4)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-2.5, 0, 4.4),
      new THREE.Vector3(-1, 2, 4.8)
    )
  );

  wallBoxes.push(
    new THREE.Box3(
      new THREE.Vector3(-1.9, 0, 4.8),
      new THREE.Vector3(-1.2, 2, 5.1)
    )
  );

  window.roomWalls = wallBoxes;
})();
