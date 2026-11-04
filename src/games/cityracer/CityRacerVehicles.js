// CityRacerVehicles.js - High-Quality 3D Vehicle Models & Traffic Simulation
// Features the Player's Audi-Style Monster Police Coupe (with massive knobby off-road tires,
// Audi 4-ring rear badge, dual chrome exhausts, suspension springs, and flashing police lights)
// and diverse traffic vehicles (Red Tuner with flame vinyls, White Rally car, Purple Buggy, Taxi).
import * as THREE from 'three';

/**
 * Creates a high-detail 3D Monster Truck Wheel with deep-dish chrome rim,
 * heavy off-road chevron knobby treads, and visible suspension coil spring.
 */
function createMonsterWheel(radius = 0.62, width = 0.52) {
  const wheelGroup = new THREE.Group();

  // 1. Heavy Rubber Tire Core
  const tireMat = new THREE.MeshStandardMaterial({
    color: '#141414',
    roughness: 0.9,
    metalness: 0.1,
  });
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 22),
    tireMat
  );
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  tire.receiveShadow = true;
  wheelGroup.add(tire);

  // 2. Heavy 3D Knobby All-Terrain Treads (Protruding Chunky Lug Blocks)
  const treadCount = 14;
  const lugMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.95 });
  const lugGeo = new THREE.BoxGeometry(width * 0.96, 0.1, 0.16);

  for (let i = 0; i < treadCount; i++) {
    const angle = (i / treadCount) * Math.PI * 2;
    const lug = new THREE.Mesh(lugGeo, lugMat);
    lug.position.set(
      0,
      Math.sin(angle) * (radius + 0.04),
      Math.cos(angle) * (radius + 0.04)
    );
    lug.rotation.x = angle;
    wheelGroup.add(lug);
  }

  // 3. Deep-Dish Chrome Alloy Rim with Center Lug Hub
  const rimMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.2,
    metalness: 0.9,
  });
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, width + 0.02, 16),
    rimMat
  );
  rim.rotation.z = Math.PI / 2;
  wheelGroup.add(rim);

  // Rim Lip Ring
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.6, 0.03, 8, 20),
    rimMat
  );
  lip.rotation.y = Math.PI / 2;
  lip.position.x = width / 2 + 0.01;
  wheelGroup.add(lip);

  // 4. Red Brake Caliper & Slotted Disc
  const discMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8, roughness: 0.3 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.44, radius * 0.44, width * 0.3, 12), discMat);
  disc.rotation.z = Math.PI / 2;
  wheelGroup.add(disc);

  const caliper = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.35, 0.18, 0.22),
    new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.3 })
  );
  caliper.position.set(0, radius * 0.3, 0);
  wheelGroup.add(caliper);

  return wheelGroup;
}

/**
 * Creates Civilian Traffic Wheel
 */
function createTrafficWheel(radius = 0.36, width = 0.28) {
  const wheelGroup = new THREE.Group();

  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 18),
    new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.85 })
  );
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  wheelGroup.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width + 0.02, 14),
    new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.2, metalness: 0.85 })
  );
  rim.rotation.z = Math.PI / 2;
  wheelGroup.add(rim);

  return wheelGroup;
}

/**
 * Creates Player's Audi-Style Monster Police Interceptor
 * Exactly matches the reference image:
 * - Sleek metallic silver/slate coupe body with glossy specular highlights
 * - Audi fastback glass, Audi 4-rings rear trunk emblem, dual exhaust
 * - Rooftop Police Lightbar with active flashing blue/red lights
 * - 4 massive chunky monster truck wheels with wide stance
 * - No front cone reflection meshes!
 */
export function createMonsterPoliceCar() {
  const car = new THREE.Group();

  // Root Chassis group to allow 3D suspension pitch, roll, and bobbing
  const chassis = new THREE.Group();
  car.add(chassis);

  // --- 1. Metallic Coupe Body Materials ---
  const bodyPaintMat = new THREE.MeshStandardMaterial({
    color: '#8fa0bc', // Glossy Slate/Silver Metallic Audi Paint
    roughness: 0.2,
    metalness: 0.85,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.4,
    metalness: 0.6,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: '#18181b',
    roughness: 0.5,
    metalness: 0.4,
  });

  // --- 2. Lower Main Body / Monocoque ---
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.42, 3.8), bodyPaintMat);
  lowerBody.position.set(0, 0.75, 0);
  lowerBody.castShadow = true;
  lowerBody.receiveShadow = true;
  chassis.add(lowerBody);

  // Sculpted Side Skirts & Rocker Panels
  [-0.86, 0.86].forEach((x) => {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 2.6), darkTrimMat);
    skirt.position.set(x, 0.62, 0);
    chassis.add(skirt);
  });

  // --- 3. Audi Fastback Cabin & Tinted Glass Canopy ---
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#090d16',
    roughness: 0.08,
    metalness: 0.95,
  });

  // Greenhouse Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.44, 2.0), glassMat);
  cabin.position.set(0, 1.14, -0.2);
  cabin.castShadow = true;
  chassis.add(cabin);

  // Roof Panel
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.06, 1.3), bodyPaintMat);
  roof.position.set(0, 1.38, -0.15);
  chassis.add(roof);

  // Sloping Fastback Rear Window
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.9), glassMat);
  rearGlass.rotation.x = -Math.PI / 4.5;
  rearGlass.position.set(0, 1.15, -1.05);
  chassis.add(rearGlass);

  // --- 4. Front Hood, Sloping Nose & Audi Hexagonal Grille ---
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.32, 0.85), bodyPaintMat);
  hood.position.set(0, 0.72, 1.95);
  hood.castShadow = true;
  chassis.add(hood);

  // Hexagonal Grille Mesh
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.28, 0.06), carbonMat);
  grille.position.set(0, 0.72, 2.39);
  chassis.add(grille);

  // Front Splitter Lip
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.06, 0.35), carbonMat);
  splitter.position.set(0, 0.55, 2.25);
  chassis.add(splitter);

  // Front LED Headlight Lenses (Clear Blue Xenon Glow)
  const headlightMat = new THREE.MeshBasicMaterial({ color: '#7dd3fc' });
  [-0.62, 0.62].forEach((x) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.05), headlightMat);
    hl.position.set(x, 0.78, 2.37);
    chassis.add(hl);
  });

  // --- 5. High-Detail Rear Fascia (Matches View in Screenshot) ---
  // Rear Bumper Diffuser
  const rearDiffuser = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.28, 0.18), darkTrimMat);
  rearDiffuser.position.set(0, 0.62, -1.9);
  chassis.add(rearDiffuser);

  // Rear Ducktail Spoiler Lip
  const rearSpoiler = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 0.2), bodyPaintMat);
  rearSpoiler.position.set(0, 0.98, -1.88);
  chassis.add(rearSpoiler);

  // Audi 4-Rings Chrome Emblem on Trunk Lid
  const chromeMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', metalness: 0.95, roughness: 0.1 });
  [-0.15, -0.05, 0.05, 0.15].forEach((rx) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 14), chromeMat);
    ring.position.set(rx, 0.88, -1.91);
    chassis.add(ring);
  });

  // License Plate (POLICE 911)
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.18, 0.02),
    new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5 })
  );
  plate.position.set(0, 0.68, -1.91);
  chassis.add(plate);

  // Dual Stainless Steel Polished Exhausts
  const pipeMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.95, roughness: 0.1 });
  const exhaustPipes = [];
  [-0.52, 0.52].forEach((x) => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 12), pipeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(x, 0.58, -1.96);
    chassis.add(pipe);
    exhaustPipes.push(pipe);
  });

  // Wide Audi Red LED Taillights
  const tailLightMat = new THREE.MeshBasicMaterial({ color: '#ff1744' });
  const leftTail = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.11, 0.04), tailLightMat);
  leftTail.position.set(-0.55, 0.86, -1.91);
  chassis.add(leftTail);

  const rightTail = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.11, 0.04), tailLightMat);
  rightTail.position.set(0.55, 0.86, -1.91);
  chassis.add(rightTail);

  // Center connecting taillight light bar
  const centerTail = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.04), tailLightMat);
  centerTail.position.set(0, 0.86, -1.91);
  chassis.add(centerTail);

  // --- 6. Rooftop Police Lightbar with Flashing Red/Blue Domes ---
  const sirenBar = new THREE.Group();
  sirenBar.position.set(0, 1.45, -0.15);

  const sirenMount = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.16), darkTrimMat);
  sirenBar.add(sirenMount);

  // Left Blue Strobe Pod
  const blueMat = new THREE.MeshBasicMaterial({ color: '#0284c7' });
  const blueLight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.16), blueMat);
  blueLight.position.set(-0.24, 0.08, 0);
  sirenBar.add(blueLight);

  // Right Red Strobe Pod
  const redMat = new THREE.MeshBasicMaterial({ color: '#dc2626' });
  const redLight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.16), redMat);
  redLight.position.set(0.24, 0.08, 0);
  sirenBar.add(redLight);

  // Dynamic Point Light for Atmospheric Siren Illumination
  const sirenPointLight = new THREE.PointLight('#38bdf8', 2.5, 20);
  sirenPointLight.position.set(0, 0.35, 0);
  sirenBar.add(sirenPointLight);

  chassis.add(sirenBar);

  // --- 7. Visible 3D Suspension Springs & Axles Under Monster Chassis ---
  const springMat = new THREE.MeshStandardMaterial({ color: '#ef4444', metalness: 0.8, roughness: 0.3 });
  const axleMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.7 });

  const wheelPositions = [
    [-1.22, 0.62, 1.3],   // Front-Left
    [1.22, 0.62, 1.3],    // Front-Right
    [-1.22, 0.62, -1.3],  // Rear-Left
    [1.22, 0.62, -1.3],   // Rear-Right
  ];

  wheelPositions.forEach(([x, y, z]) => {
    // Heavy Suspension Spring Column
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8), springMat);
    spring.position.set(x * 0.72, y + 0.18, z);
    chassis.add(spring);

    // Lateral Axle Shaft
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, Math.abs(x) * 0.75, 8), axleMat);
    axle.rotation.z = Math.PI / 2;
    axle.position.set(x * 0.5, y, z);
    chassis.add(axle);
  });

  // --- 8. 4 Massive Monster Truck Wheels ---
  const wheels = [];
  wheelPositions.forEach(([x, y, z]) => {
    const wheel = createMonsterWheel(0.62, 0.52);
    wheel.position.set(x, y, z);
    car.add(wheel);
    wheels.push(wheel);
  });

  // --- 9. Nitro Exhaust Flames (Animated 3D Blue Jets on NOS) ---
  const flameMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    transparent: true,
    opacity: 0.0,
  });
  const leftFlame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 8), flameMat);
  leftFlame.rotation.x = Math.PI / 2;
  leftFlame.position.set(-0.52, 0.58, -2.4);
  chassis.add(leftFlame);

  const rightFlame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 8), flameMat);
  rightFlame.rotation.x = Math.PI / 2;
  rightFlame.position.set(0.52, 0.58, -2.4);
  chassis.add(rightFlame);

  return {
    mesh: car,
    chassis,
    wheels,
    sirenBar,
    blueLight,
    redLight,
    blueMat,
    redMat,
    sirenPointLight,
    tailLightMat,
    leftFlame,
    rightFlame,
    flameMat,
  };
}

/**
 * Creates Traffic Vehicles (Exact Match to Reference Photo)
 */
export function createTrafficCar(type = 'red_tuner') {
  const group = new THREE.Group();
  let width = 1.6;
  let height = 0.55;
  let length = 3.7;

  if (type === 'red_tuner') {
    // Red Sports Coupe with Black Flame Vinyl & High Rear Spoiler (Matches left car in screenshot)
    const redMat = new THREE.MeshStandardMaterial({
      color: '#e11d48', // Vibrant Racing Crimson
      roughness: 0.18,
      metalness: 0.75,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 3.7), redMat);
    body.position.set(0, 0.42, 0);
    body.castShadow = true;
    group.add(body);

    // Black Flame Vinyl on Rear Quarter Panels
    const flameMat = new THREE.MeshBasicMaterial({ color: '#09090b' });
    [-0.82, 0.82].forEach((x) => {
      const flame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 1.9), flameMat);
      flame.position.set(x, 0.48, -0.25);
      group.add(flame);
    });

    // Dark Fastback Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.24, 0.4, 1.8),
      new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.1, metalness: 0.9 })
    );
    cabin.position.set(0, 0.78, -0.2);
    group.add(cabin);

    // High Downforce Rear Spoiler Wing
    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.06, 0.35), redMat);
    spoilerWing.position.set(0, 0.92, -1.75);
    group.add(spoilerWing);

    [-0.55, 0.55].forEach((x) => {
      const stanchion = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.35, 0.12),
        new THREE.MeshStandardMaterial({ color: '#18181b' })
      );
      stanchion.position.set(x, 0.72, -1.75);
      group.add(stanchion);
    });

  } else if (type === 'white_rally') {
    // White Rally Coupe
    const whiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25, metalness: 0.4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.48, 3.6), whiteMat);
    body.position.set(0, 0.44, 0);
    group.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.26, 0.42, 1.9),
      new THREE.MeshStandardMaterial({ color: '#1e293b' })
    );
    cabin.position.set(0, 0.82, -0.15);
    group.add(cabin);

    // Roof Scoop
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.45), whiteMat);
    scoop.position.set(0, 1.08, 0.1);
    group.add(scoop);

  } else if (type === 'purple_buggy') {
    // Purple Neon Buggy
    const purpleMat = new THREE.MeshStandardMaterial({ color: '#9333ea', roughness: 0.25, metalness: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.45, 3.3), purpleMat);
    body.position.set(0, 0.44, 0);
    group.add(body);

    const rollCage = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.52, 1.6),
      new THREE.MeshStandardMaterial({ color: '#09090b', metalness: 0.8 })
    );
    rollCage.position.set(0, 0.84, -0.2);
    group.add(rollCage);

  } else {
    // Yellow City Sedan / Taxi
    const yellowMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.35 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.48, 3.8), yellowMat);
    body.position.set(0, 0.44, 0);
    group.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.26, 0.42, 1.9),
      new THREE.MeshStandardMaterial({ color: '#0f172a' })
    );
    cabin.position.set(0, 0.82, -0.1);
    group.add(cabin);

    const taxiSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.14, 0.18),
      new THREE.MeshBasicMaterial({ color: '#ffffff' })
    );
    taxiSign.position.set(0, 1.08, -0.1);
    group.add(taxiSign);
  }

  // Glowing Headlights & Taillights
  [-0.58, 0.58].forEach((x) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.04), new THREE.MeshBasicMaterial({ color: '#fef08a' }));
    hl.position.set(x, 0.48, 1.86);
    group.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.04), new THREE.MeshBasicMaterial({ color: '#ef4444' }));
    tl.position.set(x, 0.48, -1.86);
    group.add(tl);
  });

  // 4 Standard Traffic Wheels
  const wheels = [];
  [
    [-0.88, 0.36, 1.15],
    [0.88, 0.36, 1.15],
    [-0.88, 0.36, -1.15],
    [0.88, 0.36, -1.15],
  ].forEach(([wx, wy, wz]) => {
    const wheel = createTrafficWheel(0.36, 0.28);
    wheel.position.set(wx, wy, wz);
    group.add(wheel);
    wheels.push(wheel);
  });

  return {
    mesh: group,
    wheels,
    width,
    length,
    type,
  };
}

/**
 * TrafficManager - Manages Highway Traffic AI and Keeps the Red Tuner in the Left Lane
 */
export class TrafficManager {
  constructor(scene) {
    this.scene = scene;
    this.vehicles = [];

    // 4 Highway Lanes:
    // Left lane next to barrier: 9.5 (Screen Left)
    // Left inner lane: 3.5
    // Right inner lane: -3.5
    // Right outer lane: -9.5 (Screen Right)
    this.lanes = [9.5, 3.5, -3.5, -9.5];

    this.maxCars = 15;
    this.initPool();
  }

  initPool() {
    // Car 0: The Featured Red Tuner in the Left Lane alongside player (Matching Screenshot!)
    const redTuner = createTrafficCar('red_tuner');
    redTuner.lane = 9.5; // Left lane next to concrete barrier
    redTuner.targetLane = 9.5;
    redTuner.speedKmh = 88;
    redTuner.mesh.position.set(9.5, 0, 18);
    this.scene.add(redTuner.mesh);
    this.vehicles.push(redTuner);
    this.featuredRedTuner = redTuner;

    const carTypes = ['white_rally', 'purple_buggy', 'red_tuner', 'yellow_taxi'];

    for (let i = 1; i < this.maxCars; i++) {
      const type = carTypes[i % carTypes.length];
      const carObj = createTrafficCar(type);

      const lane = this.lanes[i % this.lanes.length];
      carObj.lane = lane;
      carObj.targetLane = lane;
      carObj.speedKmh = 72 + Math.random() * 50;
      carObj.laneChangeTimer = 3 + Math.random() * 8;

      const startZ = 45 + i * 26;
      carObj.mesh.position.set(lane, 0, startZ);

      this.scene.add(carObj.mesh);
      this.vehicles.push(carObj);
    }
  }

  reset() {
    this.featuredRedTuner.mesh.position.set(9.5, 0, 18);
    this.featuredRedTuner.speedKmh = 88;

    for (let i = 1; i < this.vehicles.length; i++) {
      const carObj = this.vehicles[i];
      const lane = this.lanes[i % this.lanes.length];
      carObj.lane = lane;
      carObj.targetLane = lane;
      carObj.speedKmh = 72 + Math.random() * 50;
      carObj.mesh.position.set(lane, 0, 45 + i * 26);
    }
  }

  update(playerZ, playerSpeedKmh, dt) {
    for (let i = 0; i < this.vehicles.length; i++) {
      const car = this.vehicles[i];
      const speedMps = (car.speedKmh * 1000) / 3600;

      // Move forward along Z
      car.mesh.position.z += speedMps * dt;

      // Spin wheels
      const spin = (speedMps / 0.36) * dt;
      car.wheels.forEach((w) => {
        w.rotation.x += spin;
      });

      // Regular traffic cars lane-change occasionally (keep Red Tuner in left lane mostly)
      if (car !== this.featuredRedTuner) {
        car.laneChangeTimer -= dt;
        if (car.laneChangeTimer <= 0) {
          car.laneChangeTimer = 5 + Math.random() * 8;
          const curIdx = this.lanes.indexOf(car.targetLane);
          if (curIdx !== -1) {
            const shift = Math.random() < 0.5 ? -1 : 1;
            const nextIdx = Math.max(0, Math.min(this.lanes.length - 1, curIdx + shift));
            car.targetLane = this.lanes[nextIdx];
          }
        }

        car.mesh.position.x = THREE.MathUtils.lerp(
          car.mesh.position.x,
          car.targetLane,
          dt * 2.2
        );
      }

      // Recycle cars that fall behind
      if (car.mesh.position.z < playerZ - 35) {
        car.mesh.position.z = playerZ + 240 + Math.random() * 80;
        if (car === this.featuredRedTuner) {
          car.mesh.position.x = 9.5; // Left lane
        } else {
          const newLane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
          car.lane = newLane;
          car.targetLane = newLane;
          car.mesh.position.x = newLane;
        }
        car.speedKmh = 70 + Math.random() * 55;
      }
    }
  }

  checkPlayerInteractions(playerPos) {
    let collision = null;
    let nearMiss = false;

    for (let i = 0; i < this.vehicles.length; i++) {
      const car = this.vehicles[i];
      const dx = Math.abs(playerPos.x - car.mesh.position.x);
      const dz = Math.abs(playerPos.z - car.mesh.position.z);

      // Direct Crash
      if (dx < 1.6 && dz < 3.4) {
        collision = car;
        break;
      }

      // Near-Miss Overtake
      if (!car.hasNearMissed && dx < 2.6 && dx >= 1.6 && dz < 4.0) {
        car.hasNearMissed = true;
        nearMiss = true;
      }

      if (dz > 14) {
        car.hasNearMissed = false;
      }
    }

    return { collision, nearMiss };
  }
}
