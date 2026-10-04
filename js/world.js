/**
 * THE PENGUIN: BEYOND THE DOOR
 * Multi-Zone World Engine
 * Procedurally generates and seamlessly connects:
 * 1. Primeval Forest (Trees, bushes, winding dirt path, sun rays, spore particles)
 * 2. The Ancient Monolith Door (Glowing geometric runes, portal rift)
 * 3. The Backrooms Level 0 (Yellow wallpaper, damp carpet, fluorescent fixtures)
 * 4. Megalophobia Colossal Void (150m Giant Door, 80m Titan Colossus, Infinite Pillars)
 * 5. The Submerged Poolrooms (Cyan tile basins, shallow wading water, arches)
 * 6. The Celestial Exit Portal
 */

class WorldBuilder {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.interactables = [];
    this.lights = [];
    this.particles = [];
    this.floatingGeometries = [];
    this.doors = [];

    // Current zone tracking
    this.activeZone = 'forest';

    // Zones coordinates offset
    this.zones = {
      forest: { x: 0, y: 0, z: 0 },
      backrooms: { x: 0, y: -200, z: 0 },
      megalopolis: { x: 0, y: -400, z: 0 },
      poolrooms: { x: 0, y: -600, z: 0 }
    };

    // Specific object references
    this.ancientDoorMesh = null;
    this.ancientDoorPortal = null;
    this.finalExitPortal = null;
    this.waterPlanes = [];
    this.doorOpening = false;
    this.doorOpenProgress = 0;

    this.initLightingAndFog();
    this.buildForestZone();
    this.buildAncientDoor();
    this.buildBackroomsZone();
    this.buildMegalopolisZone();
    this.buildPoolroomsZone();
    this.initAtmosphericParticles();
  }

  initLightingAndFog() {
    // Initial Forest Atmosphere
    this.scene.fog = new THREE.FogExp2(0x1a2618, 0.018);

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xd4e4bc, 0.65);
    this.scene.add(this.ambientLight);

    // Directional Sunlight with Cascaded-style Shadow Map
    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    this.sunLight.position.set(45, 80, 45);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 250;
    this.sunLight.shadow.camera.left = -60;
    this.sunLight.shadow.camera.right = 60;
    this.sunLight.shadow.camera.top = 60;
    this.sunLight.shadow.camera.bottom = -60;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
  }

  // --- 1. THE PRIMEVAL FOREST ---

  buildForestZone() {
    const textures = window.gameTextures;

    // Ground plane (240m x 240m)
    const groundGeo = new THREE.PlaneGeometry(240, 240, 64, 64);
    groundGeo.rotateX(-Math.PI / 2);

    // Add gentle rolling terrain height
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      // Keep dirt path clear in middle (along Z axis from -80 to +80)
      const distFromCenterPath = Math.abs(vx - Math.sin(vz * 0.05) * 6);
      if (distFromCenterPath > 6) {
        const hill = Math.sin(vx * 0.08) * Math.cos(vz * 0.08) * 1.5;
        pos.setY(i, Math.max(0, hill));
      }
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: textures.getDirtPathTexture(),
      roughness: 0.85,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.colliders.push(ground);

    // Distant mountain backdrop silhouettes
    this.buildDistantMountains();

    // Trees (Pines and Deciduous)
    this.populateForestTrees();

    // Forest Rocks & Fallen Logs
    this.populateForestDetails();

    // Volumetric Sunlight Shafts
    this.createSunRays();
  }

  buildDistantMountains() {
    const mountainGeo = new THREE.ConeGeometry(80, 90, 8);
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x141f17,
      roughness: 0.95
    });

    const positions = [
      [-140, 0, -140], [0, 0, -170], [140, 0, -140],
      [-160, 0, 0], [160, 0, 0],
      [-130, 0, 140], [130, 0, 140]
    ];

    positions.forEach(p => {
      const m = new THREE.Mesh(mountainGeo, mountainMat);
      m.position.set(p[0], 35, p[2]);
      m.scale.set(1.0 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 1.0 + Math.random() * 0.4);
      this.scene.add(m);
    });
  }

  populateForestTrees() {
    const textures = window.gameTextures;

    const barkMat = new THREE.MeshStandardMaterial({
      map: textures.getBarkTexture(),
      roughness: 0.85
    });

    const foliageMat = new THREE.MeshStandardMaterial({
      map: textures.getFoliageTexture(),
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    // Generate ~140 dense trees flanking the winding path
    const numTrees = 140;
    for (let i = 0; i < numTrees; i++) {
      // Pick position off the central path
      let tx = (Math.random() - 0.5) * 180;
      let tz = -80 + Math.random() * 160;

      // Keep path clear
      const pathX = Math.sin(tz * 0.05) * 6;
      if (Math.abs(tx - pathX) < 6) {
        tx += (tx > pathX ? 7 : -7);
      }

      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0, tz);

      const treeHeight = 10 + Math.random() * 8;
      const trunkRadius = 0.4 + Math.random() * 0.25;

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, treeHeight, 10);
      trunkGeo.translate(0, treeHeight / 2, 0);
      const trunk = new THREE.Mesh(trunkGeo, barkMat);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // Multi-tier Pine Foliage Cones
      const tiers = 4;
      for (let t = 0; t < tiers; t++) {
        const tierHeight = treeHeight * 0.45;
        const tierRadius = (trunkRadius * 4.5) * (1 - t * 0.18);
        const coneGeo = new THREE.ConeGeometry(tierRadius, tierHeight, 10);
        const cone = new THREE.Mesh(coneGeo, foliageMat);
        cone.position.y = (treeHeight * 0.5) + t * (tierHeight * 0.55);
        cone.castShadow = true;
        cone.receiveShadow = true;
        treeGroup.add(cone);
      }

      this.scene.add(treeGroup);

      // Add solid trunk collider
      const treeCollider = new THREE.Mesh(
        new THREE.CylinderGeometry(trunkRadius * 1.2, trunkRadius * 1.2, treeHeight, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      treeCollider.position.set(tx, treeHeight / 2, tz);
      this.scene.add(treeCollider);
      this.colliders.push(treeCollider);
    }
  }

  populateForestDetails() {
    // Rocks and Fallen logs
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x47494f,
      roughness: 0.9,
      metalness: 0.1
    });

    for (let i = 0; i < 35; i++) {
      const rx = (Math.random() - 0.5) * 160;
      const rz = (Math.random() - 0.5) * 160;
      const rockGeo = new THREE.DodecahedronGeometry(0.8 + Math.random() * 1.4);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(rx, 0.4, rz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.scale.set(1 + Math.random() * 0.5, 0.7 + Math.random() * 0.4, 1 + Math.random() * 0.5);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.colliders.push(rock);
    }

    // Mossy fallen logs
    const logMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1f,
      roughness: 0.85
    });
    for (let i = 0; i < 18; i++) {
      const lx = (Math.random() - 0.5) * 150;
      const lz = (Math.random() - 0.5) * 150;
      const logGeo = new THREE.CylinderGeometry(0.35, 0.45, 6 + Math.random() * 4, 8);
      logGeo.rotateZ(Math.PI / 2);
      const log = new THREE.Mesh(logGeo, logMat);
      log.position.set(lx, 0.35, lz);
      log.rotation.y = Math.random() * Math.PI;
      log.castShadow = true;
      this.scene.add(log);
      this.colliders.push(log);
    }
  }

  createSunRays() {
    // Translucent light shafts through the canopy
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    for (let i = 0; i < 8; i++) {
      const rayGeo = new THREE.CylinderGeometry(0.4, 4.5, 35, 8, 1, true);
      rayGeo.rotateX(Math.PI / 6);
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(
        -30 + Math.random() * 60,
        15,
        -50 + Math.random() * 100
      );
      this.scene.add(ray);
    }
  }

  // --- 2. THE ANCIENT DIMENSIONAL DOOR (Deep in Forest at z = 75) ---

  buildAncientDoor() {
    const textures = window.gameTextures;

    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 0, 75);

    // Basalt Arch Frame (6.5m tall, 4.2m wide)
    const frameMat = new THREE.MeshStandardMaterial({
      map: textures.getRuneStoneTexture(),
      roughness: 0.7,
      metalness: 0.3
    });

    // Left pillar
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.5, 0.8), frameMat);
    leftPillar.position.set(-2.0, 3.25, 0);
    leftPillar.castShadow = true;
    doorGroup.add(leftPillar);
    this.colliders.push(leftPillar);

    // Right pillar
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.5, 0.8), frameMat);
    rightPillar.position.set(2.0, 3.25, 0);
    rightPillar.castShadow = true;
    doorGroup.add(rightPillar);
    this.colliders.push(rightPillar);

    // Top lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.0, 1.0), frameMat);
    lintel.position.set(0, 6.5, 0);
    lintel.castShadow = true;
    doorGroup.add(lintel);
    this.colliders.push(lintel);

    // Ancient Stone Slab Door Panels (Two folding monolithic doors)
    this.ancientDoorMesh = new THREE.Group();
    this.ancientDoorMesh.position.set(0, 0, 0);

    const doorPanelMat = new THREE.MeshStandardMaterial({
      map: textures.getRuneStoneTexture(),
      roughness: 0.6,
      metalness: 0.4
    });

    // Left door wing with hinge at -1.6
    this.leftHinge = new THREE.Group();
    this.leftHinge.position.set(-1.6, 3.0, 0);
    this.leftDoorWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.8, 0.3), doorPanelMat);
    this.leftDoorWing.position.set(0.8, 0, 0);
    this.leftDoorWing.castShadow = true;
    this.leftHinge.add(this.leftDoorWing);
    this.ancientDoorMesh.add(this.leftHinge);

    // Right door wing with hinge at +1.6
    this.rightHinge = new THREE.Group();
    this.rightHinge.position.set(1.6, 3.0, 0);
    this.rightDoorWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.8, 0.3), doorPanelMat);
    this.rightDoorWing.position.set(-0.8, 0, 0);
    this.rightDoorWing.castShadow = true;
    this.rightHinge.add(this.rightDoorWing);
    this.ancientDoorMesh.add(this.rightHinge);

    doorGroup.add(this.ancientDoorMesh);

    // Portal Void (Swirling cyan dimensional aperture behind door)
    const portalMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.85
    });
    this.ancientDoorPortal = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 5.8), portalMat);
    this.ancientDoorPortal.position.set(0, 3.0, -0.05);
    doorGroup.add(this.ancientDoorPortal);

    // Ancient Door Light (Mystic Cyan glow)
    const doorLight = new THREE.PointLight(0x22d3ee, 3.0, 18);
    doorLight.position.set(0, 3.5, 1.2);
    doorGroup.add(doorLight);

    // Surrounding Mist Ring
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0x0891b2,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    const mistRing = new THREE.Mesh(new THREE.RingGeometry(2.5, 7.0, 32), mistMat);
    mistRing.rotateX(-Math.PI / 2);
    mistRing.position.set(0, 0.1, 0);
    doorGroup.add(mistRing);

    this.scene.add(doorGroup);

    // Register as Interactable
    this.interactables.push({
      mesh: this.ancientDoorMesh,
      position: new THREE.Vector3(0, 1.5, 75),
      radius: 4.5,
      prompt: 'Press [E] to Open Ancient Monolith',
      action: 'open_ancient_door',
      isOpen: false
    });
  }

  // --- 3. THE BACKROOMS LEVEL 0 (y = -200) ---

  buildBackroomsZone() {
    const textures = window.gameTextures;
    const offset = this.zones.backrooms;

    const backroomsGroup = new THREE.Group();
    backroomsGroup.position.set(offset.x, offset.y, offset.z);

    const roomSize = 90;
    const roomHeight = 3.6;

    // Carpet Floor
    const carpetMat = new THREE.MeshStandardMaterial({
      map: textures.getCarpetTexture(),
      roughness: 0.95
    });
    textures.getCarpetTexture().repeat.set(24, 24);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), carpetMat);
    floor.rotateX(-Math.PI / 2);
    floor.receiveShadow = true;
    backroomsGroup.add(floor);
    this.colliders.push(floor);

    // Ceiling Tiles
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: textures.getCeilingTileTexture(),
      roughness: 0.8
    });
    textures.getCeilingTileTexture().repeat.set(30, 30);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), ceilingMat);
    ceiling.rotateX(Math.PI / 2);
    ceiling.position.y = roomHeight;
    backroomsGroup.add(ceiling);

    // Walls with Yellow Damask Wallpaper
    const wallMat = new THREE.MeshStandardMaterial({
      map: textures.getBackroomsWallpaperTexture(),
      roughness: 0.75
    });
    textures.getBackroomsWallpaperTexture().repeat.set(4, 2);

    // Outer Boundary Walls
    this.createWall(backroomsGroup, wallMat, 0, roomHeight/2, -roomSize/2, roomSize, roomHeight, 0.4);
    this.createWall(backroomsGroup, wallMat, 0, roomHeight/2, roomSize/2, roomSize, roomHeight, 0.4);
    this.createWall(backroomsGroup, wallMat, -roomSize/2, roomHeight/2, 0, 0.4, roomHeight, roomSize);
    this.createWall(backroomsGroup, wallMat, roomSize/2, roomHeight/2, 0, 0.4, roomHeight, roomSize);

    // Clear, spacious corridor walls (easy navigation, no frustrating dead ends)
    const wallsData = [
      // Left partition creating wide main hall
      [-12, 5, 0.4, 40],
      [-28, 5, 0.4, 40],
      [-20, -15, 16, 0.4],
      // Right partition defining clear corridor towards exit
      [12, -10, 0.4, 30],
      [12, 28, 0.4, 20],
      [25, 12, 26, 0.4],
      // Side alcove walls
      [-12, -30, 24, 0.4],
      [28, -25, 20, 0.4]
    ];

    wallsData.forEach(w => {
      this.createWall(backroomsGroup, wallMat, w[0], roomHeight/2, w[1], w[2], roomHeight, w[3]);
    });

    // Fluorescent Light Fixtures and Point Lights (60Hz Buzz)
    const lightFixtures = [
      [-20, -20], [0, -20], [20, -20],
      [-20, 0], [0, 0], [20, 0],
      [-20, 20], [0, 20], [20, 20],
      [0, 35], [30, 25], [38, 38]
    ];

    lightFixtures.forEach((coord) => {
      const fixtureMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.08, 0.5),
        new THREE.MeshBasicMaterial({ color: 0xfffbeb })
      );
      fixtureMesh.position.set(coord[0], roomHeight - 0.04, coord[1]);
      backroomsGroup.add(fixtureMesh);

      const fLight = new THREE.PointLight(0xfef08a, 1.2, 14, 1.8);
      fLight.position.set(coord[0], roomHeight - 0.3, coord[1]);
      backroomsGroup.add(fLight);
      this.lights.push(fLight);
    });

    // --- VISUAL GUIDANCE: EXIT SIGNS ON WALLS ---
    this.createExitSign(backroomsGroup, 0, 2.4, 12, 0);          // First hall: straight ahead
    this.createExitSign(backroomsGroup, 11.7, 2.4, 18, -Math.PI/2); // Turn right marker
    this.createExitSign(backroomsGroup, 25, 2.4, 12.3, 0);       // Corridor towards exit
    this.createExitSign(backroomsGroup, 38, 2.8, 36, 0);          // Directly above exit portal

    // --- VISUAL GUIDANCE: GLOWING FLOOR ARROW / PATH MARKERS ---
    this.createFloorGuidancePath(backroomsGroup);

    // Backrooms Supply Crates (Easy to spot on path)
    this.createSupplyCrate(backroomsGroup, new THREE.Vector3(2, 0, 10), 30);
    this.createSupplyCrate(backroomsGroup, new THREE.Vector3(20, 0, 18), 30);

    // --- PROMINENT GLOWING EXIT PORTAL TO MEGALOPOLIS (at x = 38, z = 38) ---
    const exitArchMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.8
    });
    // Arch frame
    const archPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.4), exitArchMat);
    archPillarL.position.set(36.8, 1.6, 38);
    backroomsGroup.add(archPillarL);

    const archPillarR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.4), exitArchMat);
    archPillarR.position.set(39.2, 1.6, 38);
    backroomsGroup.add(archPillarR);

    const archTop = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 0.4), exitArchMat);
    archTop.position.set(38, 3.2, 38);
    backroomsGroup.add(archTop);

    // Swirling Portal Void
    const portalToMegaMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide
    });
    const portalToMega = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.0), portalToMegaMat);
    portalToMega.position.set(38, 1.6, 38);
    backroomsGroup.add(portalToMega);

    // Bright Cyan Beacon Light visible from across the corridor
    const exitBeacon = new THREE.PointLight(0x06b6d4, 4.0, 28);
    exitBeacon.position.set(38, 2.0, 36.5);
    backroomsGroup.add(exitBeacon);
    this.lights.push(exitBeacon);

    this.interactables.push({
      mesh: portalToMega,
      position: new THREE.Vector3(offset.x + 38, offset.y + 1.6, offset.z + 38),
      radius: 4.5,
      prompt: 'Press [E] to Descend into the Colossal Void',
      action: 'enter_megalopolis'
    });

    this.scene.add(backroomsGroup);
  }

  createExitSign(parent, x, y, z, rotY = 0) {
    const textures = window.gameTextures;
    const signMat = new THREE.MeshBasicMaterial({
      map: textures.getExitSignTexture(),
      side: THREE.DoubleSide
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), signMat);
    sign.position.set(x, y, z);
    sign.rotation.y = rotY;
    parent.add(sign);

    // Subtle green point light glow
    const greenGlow = new THREE.PointLight(0x22c55e, 0.8, 4);
    greenGlow.position.set(x, y, z);
    parent.add(greenGlow);
  }

  createFloorGuidancePath(parent) {
    // Glowing green dashed neon line on carpet leading from (0, 0) to (38, 38)
    const waypoints = [
      new THREE.Vector3(0, 0.02, 2),
      new THREE.Vector3(0, 0.02, 8),
      new THREE.Vector3(0, 0.02, 14),
      new THREE.Vector3(2, 0.02, 18),
      new THREE.Vector3(8, 0.02, 18),
      new THREE.Vector3(14, 0.02, 18),
      new THREE.Vector3(20, 0.02, 18),
      new THREE.Vector3(26, 0.02, 20),
      new THREE.Vector3(32, 0.02, 26),
      new THREE.Vector3(36, 0.02, 32),
      new THREE.Vector3(38, 0.02, 36)
    ];

    const markerMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.75
    });

    waypoints.forEach(pt => {
      const marker = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.8), markerMat);
      marker.rotateX(-Math.PI / 2);
      marker.position.copy(pt);
      parent.add(marker);
    });
  }

  createWall(parent, material, x, y, z, w, h, d) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    parent.add(wall);

    // Solid Collider
    this.colliders.push(wall);
    return wall;
  }

  createSupplyCrate(parent, localPos, ammoCount = 20) {
    const textures = window.gameTextures;
    const crateMat = new THREE.MeshStandardMaterial({
      map: textures.getCrateTexture(),
      roughness: 0.5,
      metalness: 0.4
    });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.5), crateMat);
    crate.position.copy(localPos);
    crate.position.y += 0.225;
    crate.castShadow = true;
    parent.add(crate);
    this.colliders.push(crate);

    const worldPos = new THREE.Vector3();
    crate.getWorldPosition(worldPos);

    this.interactables.push({
      mesh: crate,
      position: worldPos,
      radius: 3.0,
      prompt: `Press [E] to Take Tactical Ammo (+${ammoCount})`,
      action: 'take_ammo',
      ammoAmount: ammoCount,
      isCollected: false
    });
  }

  // --- 4. THE MEGALOPOLIS (MEGALOPHOBIA ZONE at y = -400) ---

  buildMegalopolisZone() {
    const textures = window.gameTextures;
    const offset = this.zones.megalopolis;

    const megaGroup = new THREE.Group();
    megaGroup.position.set(offset.x, offset.y, offset.z);

    // Immense Stone Floor (400m x 400m)
    const floorGeo = new THREE.PlaneGeometry(400, 400);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      map: textures.getRuneStoneTexture(),
      roughness: 0.9,
      metalness: 0.2
    });
    textures.getRuneStoneTexture().repeat.set(40, 40);

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    megaGroup.add(floor);
    this.colliders.push(floor);

    // Cyclopean Pillars (20m diameter, 180m high vanishing into the abyss)
    const pillarGeo = new THREE.CylinderGeometry(8, 10, 180, 16);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.95
    });

    const pillarCoords = [
      [-60, -80], [60, -80],
      [-60, 0], [60, 0],
      [-60, 80], [60, 80],
      [-120, -40], [120, -40],
      [-120, 40], [120, 40]
    ];

    pillarCoords.forEach(c => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(c[0], 90, c[1]);
      p.castShadow = true;
      p.receiveShadow = true;
      megaGroup.add(p);
      this.colliders.push(p);
    });

    // 1. MEGALOPHOBIA: THE GIANT DOOR (120 meters tall)
    const giantDoorGroup = new THREE.Group();
    giantDoorGroup.position.set(0, 0, 150);

    const giantDoorMat = new THREE.MeshStandardMaterial({
      map: textures.getRuneStoneTexture(),
      roughness: 0.8,
      metalness: 0.5
    });
    const giantDoor = new THREE.Mesh(new THREE.BoxGeometry(45, 120, 6), giantDoorMat);
    giantDoor.position.set(0, 60, 0);
    giantDoor.castShadow = true;
    giantDoorGroup.add(giantDoor);

    // Enormous glowing runes on the Giant Door
    const giantRuneLight = new THREE.PointLight(0x06b6d4, 8.0, 100);
    giantRuneLight.position.set(0, 40, 8);
    giantDoorGroup.add(giantRuneLight);

    megaGroup.add(giantDoorGroup);

    // 2. MEGALOPHOBIA: THE COLOSSUS (80 meters tall shadow titan statue)
    this.buildColossusTitan(megaGroup, new THREE.Vector3(0, 0, -130));

    // 3. Floating Giant Polyhedra hovering 60-90m overhead
    for (let i = 0; i < 6; i++) {
      const polyGeo = (i % 2 === 0)
        ? new THREE.DodecahedronGeometry(12 + Math.random() * 8)
        : new THREE.OctahedronGeometry(15 + Math.random() * 6);

      const polyMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.2,
        metalness: 0.9,
        wireframe: (i % 3 === 0)
      });
      const poly = new THREE.Mesh(polyGeo, polyMat);
      poly.position.set(
        -80 + Math.random() * 160,
        65 + Math.random() * 40,
        -80 + Math.random() * 160
      );
      megaGroup.add(poly);
      this.floatingGeometries.push(poly);
    }

    // Portal to Poolrooms (at x = 0, z = 70)
    const portalToPools = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.5, 0.4, 32),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    );
    portalToPools.position.set(0, 0.2, 70);
    megaGroup.add(portalToPools);

    this.interactables.push({
      mesh: portalToPools,
      position: new THREE.Vector3(offset.x, offset.y + 0.5, offset.z + 70),
      radius: 4.5,
      prompt: 'Press [E] to Step into the Submerged Poolrooms',
      action: 'enter_poolrooms'
    });

    this.scene.add(megaGroup);
  }

  buildColossusTitan(parent, pos) {
    const titanGroup = new THREE.Group();
    titanGroup.position.copy(pos);

    const titanMat = new THREE.MeshStandardMaterial({
      color: 0x090b10,
      roughness: 0.95
    });

    // Colossal Torso (35m tall)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(28, 40, 20), titanMat);
    torso.position.y = 45;
    titanGroup.add(torso);

    // Colossal Head (18m diameter)
    const head = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 16), titanMat);
    head.position.set(0, 75, 4);
    titanGroup.add(head);

    // Glowing Colossus Eyes (towering in the dark mist)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), eyeMat);
    eye1.position.set(-3.5, 76, 12);
    titanGroup.add(eye1);

    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), eyeMat);
    eye2.position.set(3.5, 76, 12);
    titanGroup.add(eye2);

    // Giant Eye Light
    const titanLight = new THREE.PointLight(0x38bdf8, 6.0, 90);
    titanLight.position.set(0, 76, 15);
    titanGroup.add(titanLight);

    parent.add(titanGroup);
  }

  // --- 5. THE SUBMERGED POOLROOMS (at y = -600) ---

  buildPoolroomsZone() {
    const textures = window.gameTextures;
    const offset = this.zones.poolrooms;

    const poolGroup = new THREE.Group();
    poolGroup.position.set(offset.x, offset.y, offset.z);

    const zoneSize = 100;
    const zoneHeight = 8;

    // Ceramic Tile Material
    const tileMat = new THREE.MeshStandardMaterial({
      map: textures.getPoolTileTexture(),
      roughness: 0.35,
      metalness: 0.15
    });
    textures.getPoolTileTexture().repeat.set(16, 16);

    // Main Tiled Walkways / Upper Floor
    const upperFloor = new THREE.Mesh(new THREE.PlaneGeometry(zoneSize, zoneSize), tileMat);
    upperFloor.rotateX(-Math.PI / 2);
    upperFloor.receiveShadow = true;
    poolGroup.add(upperFloor);
    this.colliders.push(upperFloor);

    // High Vaulted Tiled Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(zoneSize, zoneSize), tileMat);
    ceiling.rotateX(Math.PI / 2);
    ceiling.position.y = zoneHeight;
    poolGroup.add(ceiling);

    // Sunken Pool Basins (Depressed water chambers)
    const poolBasin1 = this.createSunkenPool(poolGroup, tileMat, -18, -15, 26, 32, 2.5);
    const poolBasin2 = this.createSunkenPool(poolGroup, tileMat, 18, 18, 30, 28, 2.5);

    // Arched Aquatic Corridors and Tiled Pillars
    for (let x = -30; x <= 30; x += 20) {
      for (let z = -30; z <= 30; z += 20) {
        if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.2, zoneHeight, 2.2), tileMat);
        pillar.position.set(x, zoneHeight / 2, z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        poolGroup.add(pillar);
        this.colliders.push(pillar);
      }
    }

    // Pale Aqua Atmospheric Ambient Lighting
    const poolLight1 = new THREE.PointLight(0x67e8f9, 2.2, 35);
    poolLight1.position.set(-15, 6, -15);
    poolGroup.add(poolLight1);

    const poolLight2 = new THREE.PointLight(0x38bdf8, 2.2, 35);
    poolLight2.position.set(15, 6, 15);
    poolGroup.add(poolLight2);

    // 6. THE FINAL EXIT CELESTIAL PORTAL (at x = 0, z = 38)
    this.buildFinalExitPortal(poolGroup, new THREE.Vector3(0, 0, 38));

    this.scene.add(poolGroup);
  }

  createSunkenPool(parent, tileMat, cx, cz, width, length, depth) {
    // Water surface plane with translucent aqua water & normal ripples
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.1,
      metalness: 0.6,
      transparent: true,
      opacity: 0.65
    });

    const water = new THREE.Mesh(new THREE.PlaneGeometry(width, length), waterMat);
    water.rotateX(-Math.PI / 2);
    water.position.set(cx, 0.05, cz); // Shallow wading surface
    parent.add(water);

    this.waterPlanes.push({
      mesh: water,
      bounds: {
        minX: cx - width / 2,
        maxX: cx + width / 2,
        minZ: cz - length / 2,
        maxZ: cz + length / 2
      }
    });

    // Sunken basin floor below
    const basinFloor = new THREE.Mesh(new THREE.PlaneGeometry(width, length), tileMat);
    basinFloor.rotateX(-Math.PI / 2);
    basinFloor.position.set(cx, -depth, cz);
    parent.add(basinFloor);

    // Submerged steps
    for (let s = 0; s < 4; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(width, depth / 4, 1.2), tileMat);
      step.position.set(cx, -(s + 1) * (depth / 4) + 0.3, cz - length / 2 + (s + 1) * 1.2);
      parent.add(step);
    }
  }

  buildFinalExitPortal(parent, localPos) {
    const portalGroup = new THREE.Group();
    portalGroup.position.copy(localPos);

    // Celestial Torus Ring
    const torusGeo = new THREE.TorusGeometry(3.5, 0.45, 16, 48);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.8
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.y = 4.0;
    portalGroup.add(torus);

    // Swirling Portal Disk
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    this.finalExitPortal = new THREE.Mesh(new THREE.CircleGeometry(3.4, 32), diskMat);
    this.finalExitPortal.position.y = 4.0;
    portalGroup.add(this.finalExitPortal);

    // Brilliant God-ray Light
    const exitLight = new THREE.PointLight(0xffffff, 5.0, 45);
    exitLight.position.set(0, 4.0, 2);
    portalGroup.add(exitLight);

    parent.add(portalGroup);

    const worldPos = new THREE.Vector3(
      this.zones.poolrooms.x + localPos.x,
      this.zones.poolrooms.y + 2.0,
      this.zones.poolrooms.z + localPos.z
    );

    this.interactables.push({
      mesh: this.finalExitPortal,
      position: worldPos,
      radius: 4.5,
      prompt: 'Press [E] to Step through the Final Gateway and Escape',
      action: 'final_victory'
    });
  }

  // --- ATMOSPHERIC PARTICLES ---

  initAtmosphericParticles() {
    // Drifting Forest Spores & Floating Dust motes
    const particleCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i+1] = 1 + Math.random() * 8;
      positions[i+2] = (Math.random() - 0.5) * 120;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.sporeParticles = new THREE.Points(pGeo, pMat);
    this.scene.add(this.sporeParticles);
  }

  /**
   * Smoothly changes environmental fog & ambient lighting per zone
   */
  setZoneEnvironment(zone) {
    this.activeZone = zone;
    window.gameAudio.setAmbienceZone(zone);

    if (zone === 'forest') {
      this.scene.fog.color.setHex(0x1a2618);
      this.scene.fog.density = 0.018;
      this.ambientLight.color.setHex(0xd4e4bc);
      this.ambientLight.intensity = 0.65;
      this.sunLight.intensity = 1.4;
    } else if (zone === 'backrooms') {
      this.scene.fog.color.setHex(0x857545);
      this.scene.fog.density = 0.035;
      this.ambientLight.color.setHex(0xfef08a);
      this.ambientLight.intensity = 0.45;
      this.sunLight.intensity = 0.05; // Indoor fluorescent
    } else if (zone === 'megalopolis') {
      this.scene.fog.color.setHex(0x060910);
      this.scene.fog.density = 0.012;
      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 0.25;
      this.sunLight.intensity = 0.0; // Void abyss
    } else if (zone === 'poolrooms') {
      this.scene.fog.color.setHex(0x0c4a6e);
      this.scene.fog.density = 0.022;
      this.ambientLight.color.setHex(0x38bdf8);
      this.ambientLight.intensity = 0.55;
      this.sunLight.intensity = 0.1;
    }
  }

  /**
   * Checks if player position is in shallow water in the Poolrooms
   */
  isInWater(worldPos) {
    if (this.activeZone !== 'poolrooms') return false;
    const localX = worldPos.x - this.zones.poolrooms.x;
    const localZ = worldPos.z - this.zones.poolrooms.z;

    for (let wp of this.waterPlanes) {
      if (localX >= wp.bounds.minX && localX <= wp.bounds.maxX &&
          localZ >= wp.bounds.minZ && localZ <= wp.bounds.maxZ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Animated environmental elements
   */
  update(dt, playerPosition) {
    // Animate Spore Particles
    if (this.sporeParticles) {
      const pos = this.sporeParticles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let py = pos.getY(i) - dt * 0.25;
        if (py < 0.5) py = 8.0;
        pos.setY(i, py);
      }
      pos.needsUpdate = true;
    }

    // Animate Floating Megalopolis Polyhedra
    this.floatingGeometries.forEach((g, idx) => {
      g.rotation.x += dt * 0.15 * (idx % 2 === 0 ? 1 : -1);
      g.rotation.y += dt * 0.2;
    });

    // Animate Ancient Monolith Door Swing
    if (this.doorOpening) {
      this.doorOpenProgress = Math.min(1.0, this.doorOpenProgress + dt * 0.7);
      if (this.leftHinge) this.leftHinge.rotation.y = -Math.PI * 0.55 * this.doorOpenProgress;
      if (this.rightHinge) this.rightHinge.rotation.y = Math.PI * 0.55 * this.doorOpenProgress;
    }

    // Pulse portals
    if (this.ancientDoorPortal) {
      this.ancientDoorPortal.rotation.z += dt * 0.3;
    }
    if (this.finalExitPortal) {
      this.finalExitPortal.rotation.z += dt * 0.5;
    }
  }
}

window.WorldBuilder = WorldBuilder;
