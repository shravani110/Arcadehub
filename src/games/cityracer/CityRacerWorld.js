// CityRacerWorld.js - Enhanced 3D Night City Highway Environment
// Features illuminated high-rise buildings, glowing storefronts, concrete jersey barriers,
// overhead traffic gantries with red/green lights, and chunk-based endless scrolling.
import * as THREE from 'three';

export class CityRacerWorld {
  constructor(scene) {
    this.scene = scene;
    this.chunks = [];
    this.chunkLength = 120; // 120m per chunk
    this.totalChunks = 5;   // 600m render distance

    // Shared Materials
    this.roadMat = new THREE.MeshStandardMaterial({
      color: '#131924',
      roughness: 0.65,
      metalness: 0.2,
    });

    this.concreteMat = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      roughness: 0.7,
      metalness: 0.15,
    });

    this.barrierDarkMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.8,
    });

    this.yellowLineMat = new THREE.MeshBasicMaterial({ color: '#facc15' });
    this.whiteLineMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
    this.reflectorMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });

    // Procedural Window Canvas Texture for City Buildings
    this.buildingCanvasTexture = this.createBuildingFacadeTexture();

    this.buildingMat = new THREE.MeshStandardMaterial({
      map: this.buildingCanvasTexture,
      roughness: 0.45,
      metalness: 0.25,
    });

    this.initChunks();
  }

  /**
   * Generates high-contrast procedural canvas texture with illuminated night office & apartment windows
   * and ground-floor brightly lit shopping storefronts (Exact Match to Reference Photo!)
   */
  createBuildingFacadeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark slate architectural facade
    ctx.fillStyle = '#171f2c';
    ctx.fillRect(0, 0, 512, 512);

    // Floor Spandrels & Vertical Mullions
    ctx.strokeStyle = '#0f141d';
    ctx.lineWidth = 4;
    for (let y = 0; y < 512; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Window Grid (Warm gold, bright amber, pale mint, cool cyan, and dark unlit offices)
    const windowCols = 14;
    const windowRows = 11;
    const colWidth = 512 / windowCols;
    const rowHeight = (512 - 75) / windowRows;

    const litColors = ['#fef08a', '#fef9c3', '#facc15', '#a7f3d0', '#e0f2fe', '#ffd166'];

    for (let r = 0; r < windowRows; r++) {
      for (let c = 0; c < windowCols; c++) {
        const x = c * colWidth + 6;
        const y = r * rowHeight + 8;
        const w = colWidth - 12;
        const h = rowHeight - 12;

        if (Math.random() < 0.72) {
          ctx.fillStyle = litColors[Math.floor(Math.random() * litColors.length)];
          ctx.fillRect(x, y, w, h);

          // Internal window frame / blinds
          if (Math.random() < 0.45) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(x, y, w, h * 0.4);
          }
        } else {
          // Unlit office
          ctx.fillStyle = '#0a0d14';
          ctx.fillRect(x, y, w, h);
        }
      }
    }

    // Ground Floor: Brightly illuminated commercial storefronts
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 437, 512, 75);

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(8, 447, 150, 55);
    ctx.fillRect(175, 447, 160, 55);
    ctx.fillRect(352, 447, 150, 55);

    // Black shopframe border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 447, 150, 55);
    ctx.strokeRect(175, 447, 160, 55);
    ctx.strokeRect(352, 447, 150, 55);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }

  createChunk(zOffset) {
    const chunk = new THREE.Group();
    chunk.position.z = zOffset;

    const roadWidth = 26; // 4 wide traffic lanes

    // 1. Asphalt Road Surface
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(roadWidth, this.chunkLength),
      this.roadMat
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0;
    road.receiveShadow = true;
    chunk.add(road);

    // 2. Road Markings
    // Double Yellow Center Divider Line (At X = 0)
    [-0.32, 0.32].forEach((offset) => {
      const yellowLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, this.chunkLength),
        this.yellowLineMat
      );
      yellowLine.rotation.x = -Math.PI / 2;
      yellowLine.position.set(offset, 0.015, 0);
      chunk.add(yellowLine);
    });

    // White Dashed Lane Dividers (Between lanes)
    [-6.5, 6.5].forEach((xLane) => {
      const dashCount = Math.floor(this.chunkLength / 8);
      for (let d = 0; d < dashCount; d++) {
        const dash = new THREE.Mesh(
          new THREE.PlaneGeometry(0.22, 4.8),
          this.whiteLineMat
        );
        dash.rotation.x = -Math.PI / 2;
        const zPos = -this.chunkLength / 2 + d * 8 + 4;
        dash.position.set(xLane, 0.015, zPos);
        chunk.add(dash);
      }
    });

    // Outer Solid White Road Shoulder Lines
    [-roadWidth / 2 + 0.3, roadWidth / 2 - 0.3].forEach((xSide) => {
      const edgeLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, this.chunkLength),
        this.whiteLineMat
      );
      edgeLine.rotation.x = -Math.PI / 2;
      edgeLine.position.set(xSide, 0.015, 0);
      chunk.add(edgeLine);
    });

    // 3. Concrete Jersey Barriers with Chamfer & Reflectors (Matching Left Barrier in Reference Photo!)
    // Left barrier (Screen Left at +X):
    const leftBarrierX = roadWidth / 2 + 0.45;
    const rightBarrierX = -roadWidth / 2 - 0.45;

    [leftBarrierX, rightBarrierX].forEach((xSide) => {
      // Barrier Base
      const barrierBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.8, this.chunkLength),
        this.concreteMat
      );
      barrierBase.position.set(xSide, 0.4, 0);
      barrierBase.castShadow = true;
      barrierBase.receiveShadow = true;
      chunk.add(barrierBase);

      // Barrier Top Chamfer Cap
      const barrierTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.45, this.chunkLength),
        this.concreteMat
      );
      barrierTop.position.set(xSide, 0.95, 0);
      barrierTop.castShadow = true;
      barrierTop.receiveShadow = true;
      chunk.add(barrierTop);

      // Amber Reflectors along barrier every 12m
      for (let rz = -this.chunkLength / 2 + 6; rz < this.chunkLength / 2; rz += 12) {
        const reflector = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.15, 0.25),
          this.reflectorMat
        );
        reflector.position.set(xSide - Math.sign(xSide) * 0.44, 0.75, rz);
        chunk.add(reflector);
      }
    });

    // 4. City Buildings Lining the Highway
    const buildingDepth = 36;
    const buildingsPerSide = Math.floor(this.chunkLength / buildingDepth);

    [-1, 1].forEach((side) => {
      for (let b = 0; b < buildingsPerSide; b++) {
        const height = 22 + Math.floor(Math.random() * 32); // 22m to 54m
        const bZ = -this.chunkLength / 2 + b * buildingDepth + buildingDepth / 2;
        const bX = side * (roadWidth / 2 + 7 + 12);

        // Main Skyscraper Mesh
        const building = new THREE.Mesh(
          new THREE.BoxGeometry(24, height, buildingDepth - 2),
          this.buildingMat
        );
        building.position.set(bX, height / 2, bZ);
        building.castShadow = true;
        building.receiveShadow = true;
        chunk.add(building);

        // Roof Overhang / Cornice Parapet
        const roofTrim = new THREE.Mesh(
          new THREE.BoxGeometry(25.2, 0.8, buildingDepth - 1),
          this.concreteMat
        );
        roofTrim.position.set(bX, height + 0.4, bZ);
        chunk.add(roofTrim);

        // Rooftop Penthouse & Blinking Aircraft Warning Beacon
        if (Math.random() < 0.7) {
          const roofBox = new THREE.Mesh(
            new THREE.BoxGeometry(9, 4.5, 11),
            this.barrierDarkMat
          );
          roofBox.position.set(bX, height + 2.6, bZ);
          chunk.add(roofBox);

          // Blinking Red Aircraft Beacon
          const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 8, 8),
            new THREE.MeshBasicMaterial({ color: '#ef4444' })
          );
          beacon.position.set(bX, height + 5.2, bZ);
          chunk.add(beacon);
        }
      }
    });

    // 5. Overhead Highway Sign Gantries with Red/Green Traffic Lights
    if (Math.random() < 0.65) {
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, 0);

      // Steel Posts
      const postMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.85, roughness: 0.2 });
      [-roadWidth / 2 - 0.4, roadWidth / 2 + 0.4].forEach((px) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.55, 7.8, 0.55), postMat);
        post.position.set(px, 3.9, 0);
        gantryGroup.add(post);
      });

      // Overhead Steel Truss Crossbar
      const truss = new THREE.Mesh(
        new THREE.BoxGeometry(roadWidth + 1.8, 0.95, 0.65),
        postMat
      );
      truss.position.set(0, 7.5, 0);
      gantryGroup.add(truss);

      // Traffic Signal Pods (Above each of the 4 lanes)
      [-9.5, -3.5, 3.5, 9.5].forEach((lx) => {
        const signalBox = new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 1.35, 0.35),
          this.barrierDarkMat
        );
        signalBox.position.set(lx, 6.4, 0.35);
        gantryGroup.add(signalBox);

        // Red light
        const redL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), new THREE.MeshBasicMaterial({ color: '#ef4444' }));
        redL.position.set(lx, 6.7, 0.55);
        gantryGroup.add(redL);

        // Green light
        const greenL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), new THREE.MeshBasicMaterial({ color: '#22c55e' }));
        greenL.position.set(lx, 6.1, 0.55);
        gantryGroup.add(greenL);
      });

      // Overhead Green Destination Sign ("DOWNTOWN / AIRPORT")
      const signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(7.2, 1.8, 0.1),
        new THREE.MeshStandardMaterial({ color: '#047857', roughness: 0.4 })
      );
      signBoard.position.set(0, 7.5, 0.35);
      gantryGroup.add(signBoard);

      const signBorder = new THREE.Mesh(
        new THREE.BoxGeometry(7.4, 2.0, 0.08),
        new THREE.MeshBasicMaterial({ color: '#ffffff' })
      );
      signBorder.position.set(0, 7.5, 0.34);
      gantryGroup.add(signBorder);

      chunk.add(gantryGroup);
    }

    // 6. Streetlight Poles with Warm Light Pools
    [-roadWidth / 2, roadWidth / 2].forEach((sx) => {
      for (let sz = -this.chunkLength / 2 + 18; sz < this.chunkLength / 2; sz += 38) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.16, 8.5, 8),
          this.concreteMat
        );
        pole.position.set(sx, 4.25, sz);
        chunk.add(pole);

        const arm = new THREE.Mesh(
          new THREE.BoxGeometry(2.0, 0.12, 0.12),
          this.concreteMat
        );
        arm.position.set(sx - Math.sign(sx) * 0.9, 8.4, sz);
        chunk.add(arm);

        const lampHead = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.18, 0.4),
          new THREE.MeshBasicMaterial({ color: '#fef08a' })
        );
        lampHead.position.set(sx - Math.sign(sx) * 1.6, 8.35, sz);
        chunk.add(lampHead);
      }
    });

    this.scene.add(chunk);
    return chunk;
  }

  initChunks() {
    for (let i = 0; i < this.totalChunks; i++) {
      const zOffset = i * this.chunkLength;
      const chunk = this.createChunk(zOffset);
      this.chunks.push(chunk);
    }
  }

  reset() {
    this.chunks.forEach((chunk, i) => {
      chunk.position.z = i * this.chunkLength;
    });
  }

  update(playerZ) {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      if (chunk.position.z < playerZ - this.chunkLength) {
        let maxZ = chunk.position.z;
        for (let j = 0; j < this.chunks.length; j++) {
          if (this.chunks[j].position.z > maxZ) {
            maxZ = this.chunks[j].position.z;
          }
        }
        chunk.position.z = maxZ + this.chunkLength;
      }
    }
  }
}
