/**
 * THE PENGUIN: BEYOND THE DOOR
 * 3D Playable Penguin Character & Rig
 * Detailed anthropomorphic penguin with custom feather textures, dynamic lighting,
 * and comprehensive procedural skeletal animation state machine.
 */

class PenguinCharacter {
  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'PenguinPlayer';

    // Animation state timers
    this.animTime = 0;
    this.walkCycle = 0;
    this.state = 'idle'; // 'idle', 'walk', 'run', 'jump', 'fall', 'land', 'hurt', 'die'
    this.isAiming = false;
    this.isShooting = false;
    this.shootTimer = 0;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.isDead = false;
    this.deathProgress = 0;
    this.hurtTimer = 0;

    // Bone / joint references
    this.torso = null;
    this.head = null;
    this.beak = null;
    this.leftWing = null;
    this.rightWing = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.tail = null;
    this.leftEye = null;
    this.rightEye = null;
    this.gunMount = null;

    this.initModel();
  }

  initModel() {
    const textures = window.gameTextures;

    // Materials
    const featherMat = new THREE.MeshStandardMaterial({
      map: textures.getFeatherTexture(),
      color: 0x1f232b,
      roughness: 0.7,
      metalness: 0.1
    });

    const bellyMat = new THREE.MeshStandardMaterial({
      map: textures.getBellyTexture(),
      color: 0xf1f5f9,
      roughness: 0.55,
      metalness: 0.05
    });

    const beakMat = new THREE.MeshStandardMaterial({
      map: textures.getBeakTexture(),
      color: 0xf59e0b,
      roughness: 0.35,
      metalness: 0.15
    });

    const footMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      roughness: 0.5,
      metalness: 0.1
    });

    const eyeMat = new THREE.MeshStandardMaterial({
      map: textures.getEyeTexture(),
      roughness: 0.1,
      metalness: 0.8
    });

    // 1. Root Pelvis / Torso Group (Center of gravity at ~0.8m)
    this.torso = new THREE.Group();
    this.torso.position.y = 0.75;
    this.mesh.add(this.torso);

    // Torso body: sleek stylized teardrop
    const bodyGeo = new THREE.SphereGeometry(0.38, 24, 24);
    bodyGeo.scale(1.0, 1.45, 0.95);
    const bodyMesh = new THREE.Mesh(bodyGeo, featherMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.torso.add(bodyMesh);

    // White Belly Patch on front of chest
    const bellyGeo = new THREE.SphereGeometry(0.36, 24, 24);
    bellyGeo.scale(0.85, 1.35, 0.88);
    const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
    bellyMesh.position.set(0, -0.02, 0.08);
    bellyMesh.castShadow = true;
    bellyMesh.receiveShadow = true;
    this.torso.add(bellyMesh);

    // Small Tail at back
    const tailGeo = new THREE.ConeGeometry(0.12, 0.28, 12);
    tailGeo.rotateX(-Math.PI / 3);
    this.tail = new THREE.Mesh(tailGeo, featherMat);
    this.tail.position.set(0, -0.35, -0.32);
    this.tail.castShadow = true;
    this.torso.add(this.tail);

    // 2. Head Group
    this.head = new THREE.Group();
    this.head.position.set(0, 0.52, 0.02);
    this.torso.add(this.head);

    const headGeo = new THREE.SphereGeometry(0.26, 24, 24);
    headGeo.scale(0.95, 1.05, 0.98);
    const headMesh = new THREE.Mesh(headGeo, featherMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Head white chin patch
    const chinGeo = new THREE.SphereGeometry(0.16, 16, 16);
    chinGeo.scale(0.9, 0.8, 1.0);
    const chinMesh = new THREE.Mesh(chinGeo, bellyMat);
    chinMesh.position.set(0, -0.12, 0.14);
    this.head.add(chinMesh);

    // Beak
    this.beak = new THREE.Group();
    this.beak.position.set(0, -0.02, 0.24);
    this.head.add(this.beak);

    // Upper mandible (tapered cone with curve)
    const upperBeakGeo = new THREE.ConeGeometry(0.08, 0.22, 16);
    upperBeakGeo.rotateX(Math.PI / 2);
    upperBeakGeo.scale(0.9, 0.7, 1.0);
    const upperBeakMesh = new THREE.Mesh(upperBeakGeo, beakMat);
    upperBeakMesh.castShadow = true;
    this.beak.add(upperBeakMesh);

    // Lower mandible
    const lowerBeakGeo = new THREE.ConeGeometry(0.065, 0.19, 16);
    lowerBeakGeo.rotateX(Math.PI / 2);
    lowerBeakGeo.scale(0.85, 0.5, 1.0);
    const lowerBeakMesh = new THREE.Mesh(lowerBeakGeo, beakMat);
    lowerBeakMesh.position.set(0, -0.035, -0.01);
    this.beak.add(lowerBeakMesh);

    // Eyes (Expressive, large, glossy)
    const eyeGeo = new THREE.SphereGeometry(0.055, 16, 16);
    eyeGeo.scale(0.6, 1.0, 1.0);

    // Left Eye
    this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.leftEye.position.set(-0.16, 0.08, 0.14);
    this.leftEye.rotation.y = -0.3;
    this.head.add(this.leftEye);

    // Right Eye
    this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.rightEye.position.set(0.16, 0.08, 0.14);
    this.rightEye.rotation.y = 0.3;
    this.head.add(this.rightEye);

    // 3. Wings / Arms (Functioning as tactical arms)
    // Left Wing (Shoulder Joint)
    this.leftWing = new THREE.Group();
    this.leftWing.position.set(-0.38, 0.32, 0.0);
    this.torso.add(this.leftWing);

    const wingGeo = new THREE.BoxGeometry(0.06, 0.55, 0.16);
    wingGeo.translate(0, -0.25, 0);
    const leftWingMesh = new THREE.Mesh(wingGeo, featherMat);
    leftWingMesh.castShadow = true;
    this.leftWing.add(leftWingMesh);

    // Right Wing (Shoulder Joint) - Holds Gun
    this.rightWing = new THREE.Group();
    this.rightWing.position.set(0.38, 0.32, 0.0);
    this.torso.add(this.rightWing);

    const rightWingMesh = new THREE.Mesh(wingGeo.clone(), featherMat);
    rightWingMesh.castShadow = true;
    this.rightWing.add(rightWingMesh);

    // Gun Mount Anchor at Right Wing Tip
    this.gunMount = new THREE.Group();
    this.gunMount.position.set(0, -0.48, 0.08);
    this.rightWing.add(this.gunMount);

    // Attach third-person tactical gun model to gun mount
    this.createThirdPersonGun(this.gunMount);

    // 4. Legs and Webbed Feet
    // Left Leg (Hip Joint)
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.18, -0.45, 0.0);
    this.torso.add(this.leftLeg);

    const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.22, 12);
    legGeo.translate(0, -0.1, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, featherMat);
    leftLegMesh.castShadow = true;
    this.leftLeg.add(leftLegMesh);

    // Left Webbed Foot
    const footGeo = new THREE.BoxGeometry(0.15, 0.04, 0.26);
    footGeo.translate(0, -0.02, 0.08);
    const leftFootMesh = new THREE.Mesh(footGeo, footMat);
    leftFootMesh.position.set(0, -0.22, 0);
    leftFootMesh.castShadow = true;
    this.leftLeg.add(leftFootMesh);

    // Claws on left foot
    for (let c = -1; c <= 1; c++) {
      const clawGeo = new THREE.ConeGeometry(0.015, 0.06, 8);
      clawGeo.rotateX(Math.PI / 2);
      const claw = new THREE.Mesh(clawGeo, beakMat);
      claw.position.set(c * 0.05, -0.24, 0.22);
      this.leftLeg.add(claw);
    }

    // Right Leg (Hip Joint)
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.18, -0.45, 0.0);
    this.torso.add(this.rightLeg);

    const rightLegMesh = new THREE.Mesh(legGeo.clone(), featherMat);
    rightLegMesh.castShadow = true;
    this.rightLeg.add(rightLegMesh);

    // Right Webbed Foot
    const rightFootMesh = new THREE.Mesh(footGeo.clone(), footMat);
    rightFootMesh.position.set(0, -0.22, 0);
    rightFootMesh.castShadow = true;
    this.rightLeg.add(rightFootMesh);

    // Claws on right foot
    for (let c = -1; c <= 1; c++) {
      const clawGeo = new THREE.ConeGeometry(0.015, 0.06, 8);
      clawGeo.rotateX(Math.PI / 2);
      const claw = new THREE.Mesh(clawGeo, beakMat);
      claw.position.set(c * 0.05, -0.24, 0.22);
      this.rightLeg.add(claw);
    }
  }

  /**
   * Builds the 3D gun model attached to the penguin's flipper for 3rd-person view
   */
  createThirdPersonGun(parentGroup) {
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      roughness: 0.35,
      metalness: 0.8
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.7,
      metalness: 0.2
    });

    const gunGroup = new THREE.Group();
    gunGroup.rotation.set(0, Math.PI / 2, 0);
    gunGroup.position.set(-0.05, 0, 0.12);
    gunGroup.scale.set(0.8, 0.8, 0.8);

    // Receiver / Body
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.09, 0.06), metalMat);
    receiver.castShadow = true;
    gunGroup.add(receiver);

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 12), metalMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.28, 0.015, 0);
    barrel.castShadow = true;
    gunGroup.add(barrel);

    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.05), accentMat);
    grip.rotation.z = -0.3;
    grip.position.set(-0.06, -0.11, 0);
    grip.castShadow = true;
    gunGroup.add(grip);

    // Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.04), metalMat);
    mag.rotation.z = -0.2;
    mag.position.set(0.04, -0.12, 0);
    gunGroup.add(mag);

    // Reflex Sight
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.04), accentMat);
    sight.position.set(0.02, 0.08, 0);
    gunGroup.add(sight);

    // Sight reticle dot (glowing cyan/red)
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), dotMat);
    dot.position.set(0.02, 0.085, 0);
    gunGroup.add(dot);

    parentGroup.add(gunGroup);
  }

  /**
   * Triggers shooting kickback animation
   */
  triggerShoot() {
    this.isShooting = true;
    this.shootTimer = 0.18;
  }

  /**
   * Triggers reload animation
   */
  triggerReload() {
    this.isReloading = true;
    this.reloadTimer = 1.6;
  }

  /**
   * Triggers taking damage animation
   */
  triggerHurt() {
    this.hurtTimer = 0.35;
  }

  /**
   * Triggers death animation
   */
  triggerDeath() {
    this.isDead = true;
  }

  /**
   * Main animation loop update called each frame
   */
  update(dt, isMoving, isRunning, isAiming, isGrounded) {
    this.animTime += dt;
    this.isAiming = isAiming;

    // Handle Timers
    if (this.shootTimer > 0) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) this.isShooting = false;
    }
    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) this.isReloading = false;
    }
    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
    }

    // --- DEATH ANIMATION ---
    if (this.isDead) {
      this.deathProgress = Math.min(1.0, this.deathProgress + dt * 1.8);
      // Topple backward onto ground
      this.torso.rotation.x = -Math.PI / 2 * this.deathProgress;
      this.torso.position.y = 0.75 - 0.5 * this.deathProgress;
      this.leftWing.rotation.z = -0.8 * (1 - this.deathProgress);
      this.rightWing.rotation.z = 0.8 * (1 - this.deathProgress);
      return;
    }

    // Determine state
    if (!isGrounded) {
      this.state = 'jump';
    } else if (isMoving) {
      this.state = isRunning ? 'run' : 'walk';
    } else {
      this.state = 'idle';
    }

    // --- SKELETAL PROCEDURAL ANIMATIONS ---
    const t = this.animTime;
    const speed = isRunning ? 14 : 9;

    if (this.state === 'walk' || this.state === 'run') {
      this.walkCycle += dt * speed;
      const waddleRoll = Math.sin(this.walkCycle) * (isRunning ? 0.16 : 0.10);
      const legSwing = Math.sin(this.walkCycle) * (isRunning ? 0.75 : 0.5);
      const bodyBounce = Math.abs(Math.sin(this.walkCycle * 2)) * 0.05;

      // Torso waddle & forward lean
      this.torso.rotation.z = waddleRoll;
      this.torso.rotation.y = -waddleRoll * 0.5;
      this.torso.rotation.x = isRunning ? 0.22 : 0.08;
      this.torso.position.y = 0.75 - bodyBounce;

      // Alternating webbed feet swing
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;

      // Head counter-stabilization
      this.head.rotation.z = -waddleRoll * 0.7;
      this.head.rotation.x = isRunning ? -0.15 : -0.05;

      // Tail subtle wag
      this.tail.rotation.y = Math.sin(this.walkCycle) * 0.3;
    } else if (this.state === 'jump') {
      // In air / falling
      this.torso.rotation.x = 0.15;
      this.torso.rotation.z = 0;
      this.torso.position.y = 0.75;

      // Tuck legs
      this.leftLeg.rotation.x = -0.3;
      this.rightLeg.rotation.x = -0.3;

      // Wings flare out for balance
      this.leftWing.rotation.z = -0.6;
      this.rightWing.rotation.z = 0.6;
    } else {
      // Idle: rhythmic breathing & subtle head look
      const breath = Math.sin(t * 2.2) * 0.015;
      this.torso.position.y = 0.75 + breath;
      this.torso.rotation.z = Math.sin(t * 1.2) * 0.02;
      this.torso.rotation.x = 0.02;
      this.torso.rotation.y = 0;

      // Reset legs
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;

      // Subtle head curiosity
      this.head.rotation.y = Math.sin(t * 0.7) * 0.12;
      this.head.rotation.x = Math.sin(t * 1.5) * 0.03;

      // Subtle tail twitch
      this.tail.rotation.y = Math.sin(t * 3.5) * 0.1;
    }

    // --- ARM / WING POSES (AIMING, SHOOTING, RELOADING) ---
    if (this.isReloading) {
      const reloadPhase = (1.6 - this.reloadTimer) / 1.6;
      // Right wing keeps gun low in front
      this.rightWing.rotation.x = -0.6;
      this.rightWing.rotation.y = -0.4;
      this.rightWing.rotation.z = 0.2;

      // Left wing reaches down to pouch then up to gun
      if (reloadPhase < 0.5) {
        this.leftWing.rotation.x = 0.3; // Reaching down to pouch
        this.leftWing.rotation.y = 0.2;
      } else {
        this.leftWing.rotation.x = -0.7; // Inserting mag
        this.leftWing.rotation.y = 0.5;
      }
    } else if (this.isAiming) {
      // Both wings lock forward into steady two-point aim
      this.rightWing.rotation.x = -1.35;
      this.rightWing.rotation.y = -0.35;
      this.rightWing.rotation.z = 0.15;

      this.leftWing.rotation.x = -1.25;
      this.leftWing.rotation.y = 0.45;
      this.leftWing.rotation.z = -0.15;

      // Subtle recoil kick
      if (this.isShooting) {
        const kick = (this.shootTimer / 0.18);
        this.rightWing.rotation.x += kick * 0.25;
        this.leftWing.rotation.x += kick * 0.15;
        this.torso.rotation.x -= kick * 0.08;
      }
    } else {
      // Casual ready stance (gun held low at hip ready to raise)
      this.rightWing.rotation.x = -0.75;
      this.rightWing.rotation.y = -0.25;
      this.rightWing.rotation.z = 0.1;

      this.leftWing.rotation.x = -0.55;
      this.leftWing.rotation.y = 0.25;
      this.leftWing.rotation.z = -0.1;

      if (this.isShooting) {
        const kick = (this.shootTimer / 0.18);
        this.rightWing.rotation.x += kick * 0.3;
      }
    }

    // --- HURT REACTION ---
    if (this.hurtTimer > 0) {
      const flinch = (this.hurtTimer / 0.35);
      this.torso.rotation.x -= flinch * 0.25;
      this.head.rotation.x += flinch * 0.2;
    }
  }
}

window.PenguinCharacter = PenguinCharacter;
