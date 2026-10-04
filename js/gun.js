/**
 * THE PENGUIN: BEYOND THE DOOR
 * Gun System - First-Person Tactical Weapon Rig, ADS, Recoil,
 * Muzzle Flash, Tracers, Smoke, and Ballistics.
 */

class TacticalGun {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    // Ammunition
    this.magSize = 12;
    this.ammo = 12;
    this.reserveAmmo = 60;
    this.isReloading = false;
    this.reloadProgress = 0;
    this.reloadDuration = 1.6;

    // Fire rate
    this.fireRate = 0.18; // Seconds per shot
    this.fireCooldown = 0;

    // Aim Down Sights (ADS)
    this.isAiming = false;
    this.aimProgress = 0; // 0 = Hip, 1 = ADS
    this.hipPos = new THREE.Vector3(0.24, -0.22, -0.42);
    this.hipRot = new THREE.Euler(0.02, -0.04, 0.02);
    this.adsPos = new THREE.Vector3(0.0, -0.145, -0.32);
    this.adsRot = new THREE.Euler(0, 0, 0);

    // Dynamic Recoil & Sway
    this.recoilImpulse = new THREE.Vector3(0, 0, 0);
    this.recoilRot = new THREE.Vector3(0, 0, 0);
    this.swayPos = new THREE.Vector3(0, 0, 0);
    this.swayRot = new THREE.Vector3(0, 0, 0);

    // Muzzle flash & smoke particles
    this.muzzleLight = null;
    this.muzzleSprite = null;
    this.muzzleTimer = 0;
    this.particles = [];

    // Tracers
    this.tracers = [];

    // Weapon group attached to camera
    this.rig = new THREE.Group();
    this.rig.position.copy(this.hipPos);
    this.camera.add(this.rig);

    this.initModel();
  }

  initModel() {
    const textures = window.gameTextures;

    const metalMat = new THREE.MeshStandardMaterial({
      map: textures.getGunMetalTexture(),
      color: 0x22262e,
      roughness: 0.35,
      metalness: 0.85
    });

    const polymerMat = new THREE.MeshStandardMaterial({
      color: 0x14161a,
      roughness: 0.75,
      metalness: 0.2
    });

    const featherMat = new THREE.MeshStandardMaterial({
      map: textures.getFeatherTexture(),
      color: 0x1f232b,
      roughness: 0.7,
      metalness: 0.1
    });

    // 1. First-Person Penguin Wings / Arms holding the weapon
    // Left support wing
    const leftWingGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.35, 12);
    leftWingGeo.rotateX(Math.PI / 3);
    const leftWing = new THREE.Mesh(leftWingGeo, featherMat);
    leftWing.position.set(-0.16, -0.16, 0.12);
    this.rig.add(leftWing);

    // Right trigger wing
    const rightWingGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.35, 12);
    rightWingGeo.rotateX(Math.PI / 3.2);
    const rightWing = new THREE.Mesh(rightWingGeo, featherMat);
    rightWing.position.set(0.12, -0.18, 0.14);
    this.rig.add(rightWing);

    // 2. Weapon Receiver & Slide
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.085, 0.36), metalMat);
    receiver.position.set(0, 0, 0);
    this.rig.add(receiver);

    // Barrel & Muzzle Brake
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 12), metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, -0.26);
    this.rig.add(barrel);

    // Muzzle Brake ring
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 12), polymerMat);
    brake.rotation.x = Math.PI / 2;
    brake.position.set(0, 0.015, -0.37);
    this.rig.add(brake);

    // Top Picatinny Rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.015, 0.28), polymerMat);
    rail.position.set(0, 0.05, -0.04);
    this.rig.add(rail);

    // 3. Holographic Reflex Optic Sight
    const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.075), polymerMat);
    sightBase.position.set(0, 0.075, -0.05);
    this.rig.add(sightBase);

    // Glass Lens
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.9
    });
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.032, 0.005), lensMat);
    lens.position.set(0, 0.082, -0.07);
    this.rig.add(lens);

    // Glowing Holographic Reticle Dot
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const reticleDot = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 8), dotMat);
    reticleDot.position.set(0, 0.082, -0.072);
    this.rig.add(reticleDot);

    // 4. Pistol Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.16, 0.07), polymerMat);
    grip.rotation.x = -0.32;
    grip.position.set(0, -0.10, 0.07);
    this.rig.add(grip);

    // 5. Extended Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.15, 0.05), metalMat);
    mag.rotation.x = -0.32;
    mag.position.set(0, -0.15, 0.06);
    this.rig.add(mag);

    // 6. Tactical Flashlight mounted under barrel
    const lightBody = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 12), polymerMat);
    lightBody.rotation.x = Math.PI / 2;
    lightBody.position.set(0.032, -0.03, -0.15);
    this.rig.add(lightBody);

    // Active Flashlight beam
    this.flashlight = new THREE.SpotLight(0xfff5ea, 1.8, 45, Math.PI / 7, 0.4, 1.2);
    this.flashlight.position.set(0.032, -0.03, -0.22);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0.032, -0.03, -15);
    this.rig.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.rig.add(this.flashlight);

    // 7. Muzzle Flash System
    this.muzzleLight = new THREE.PointLight(0xffaa33, 0, 10, 2);
    this.muzzleLight.position.set(0, 0.015, -0.42);
    this.rig.add(this.muzzleLight);

    // Crossed-quad glowing flash sprite
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xfff0aa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const flashGeo = new THREE.PlaneGeometry(0.25, 0.25);
    this.muzzleSprite1 = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleSprite1.position.set(0, 0.015, -0.42);
    this.rig.add(this.muzzleSprite1);

    this.muzzleSprite2 = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleSprite2.rotation.z = Math.PI / 2;
    this.muzzleSprite2.position.set(0, 0.015, -0.42);
    this.rig.add(this.muzzleSprite2);
  }

  setAiming(val) {
    this.isAiming = val;
  }

  canShoot() {
    return !this.isReloading && this.fireCooldown <= 0;
  }

  /**
   * Fires the weapon: checks ammo, triggers recoil, sound, raycast hit detection
   */
  shoot(targets = [], colliders = []) {
    if (!this.canShoot()) return false;

    if (this.ammo <= 0) {
      window.gameAudio.playDryFire();
      this.fireCooldown = 0.25;
      if (this.reserveAmmo > 0) {
        this.reload();
      }
      return false;
    }

    // Spend round
    this.ammo--;
    this.fireCooldown = this.fireRate;

    // Trigger procedural audio
    window.gameAudio.playGunshot(false);

    // Recoil Impulse
    const kickZ = this.isAiming ? 0.045 : 0.08;
    const kickY = this.isAiming ? 0.025 : 0.04;
    const kickRotX = this.isAiming ? 0.06 : 0.12;
    const kickRotY = (Math.random() - 0.5) * 0.03;

    this.recoilImpulse.z = kickZ;
    this.recoilImpulse.y = kickY;
    this.recoilRot.x = kickRotX;
    this.recoilRot.y = kickRotY;

    // Trigger Muzzle Flash
    this.muzzleLight.intensity = 4.5;
    this.muzzleSprite1.material.opacity = 0.95;
    this.muzzleSprite2.material.opacity = 0.95;
    this.muzzleTimer = 0.05;

    // Spawn Gun Barrel Smoke Particle
    this.spawnMuzzleSmoke();

    // Raycast Ballistics
    this.performRaycastHitscan(targets, colliders);

    return true;
  }

  spawnMuzzleSmoke() {
    // World position of muzzle tip
    const tipPos = new THREE.Vector3();
    this.muzzleLight.getWorldPosition(tipPos);

    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    const smokeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), smokeMat);
    smokeMesh.position.copy(tipPos);
    this.scene.add(smokeMesh);

    this.particles.push({
      mesh: smokeMesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        0.3 + Math.random() * 0.3,
        (Math.random() - 0.5) * 0.2
      ),
      life: 0.6,
      maxLife: 0.6
    });
  }

  performRaycastHitscan(targets, colliders) {
    // Spread calculation
    const spread = this.isAiming ? 0.008 : 0.028;
    const screenX = (Math.random() - 0.5) * spread;
    const screenY = (Math.random() - 0.5) * spread;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(screenX, screenY), this.camera);
    raycaster.far = 150;

    // First check enemy targets
    let hitSomething = false;
    let hitPoint = null;

    if (targets && targets.length > 0) {
      // Gather enemy meshes
      const enemyMeshes = [];
      const enemyMap = new Map();
      targets.forEach(e => {
        if (!e.isDead && e.hitbox) {
          enemyMeshes.push(e.hitbox);
          enemyMap.set(e.hitbox, e);
        }
      });

      const enemyHits = raycaster.intersectObjects(enemyMeshes, false);
      if (enemyHits.length > 0) {
        const hit = enemyHits[0];
        const enemy = enemyMap.get(hit.object);
        if (enemy) {
          hitPoint = hit.point;
          enemy.takeDamage(35, hit.point);
          window.gameAudio.playBulletImpact('enemy');
          this.spawnImpactSparks(hit.point, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0), 0xa855f7);
          hitSomething = true;
        }
      }
    }

    // If no enemy hit, check world colliders (trees, rocks, walls)
    if (!hitSomething && colliders && colliders.length > 0) {
      const worldHits = raycaster.intersectObjects(colliders, false);
      if (worldHits.length > 0) {
        const hit = worldHits[0];
        hitPoint = hit.point;
        window.gameAudio.playBulletImpact('dirt');
        this.spawnImpactSparks(hit.point, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0), 0xf59e0b);
        hitSomething = true;
      }
    }

    // Default tracer end point if nothing hit
    if (!hitPoint) {
      hitPoint = raycaster.ray.at(100, new THREE.Vector3());
    }

    // Create glowing tracer line
    this.createTracer(hitPoint);
  }

  createTracer(endPoint) {
    const startPoint = new THREE.Vector3();
    this.muzzleLight.getWorldPosition(startPoint);

    const mat = new THREE.LineBasicMaterial({
      color: 0xfef08a,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    const geo = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);

    this.tracers.push({
      line: line,
      life: 0.08
    });
  }

  spawnImpactSparks(pos, normal, color = 0xf59e0b) {
    for (let i = 0; i < 8; i++) {
      const sparkMat = new THREE.MeshBasicMaterial({ color: color });
      const spark = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), sparkMat);
      spark.position.copy(pos);
      this.scene.add(spark);

      const vel = normal.clone().multiplyScalar(1.5);
      vel.x += (Math.random() - 0.5) * 2;
      vel.y += Math.random() * 2;
      vel.z += (Math.random() - 0.5) * 2;

      this.particles.push({
        mesh: spark,
        velocity: vel,
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  reload() {
    if (this.isReloading || this.ammo >= this.magSize || this.reserveAmmo <= 0) return;
    this.isReloading = true;
    this.reloadProgress = 0;
    window.gameAudio.playReload();
  }

  addAmmo(amount) {
    this.reserveAmmo = Math.min(120, this.reserveAmmo + amount);
  }

  /**
   * Update gun animations, recoil spring-damper, ADS lerp, and particles
   */
  update(dt, mouseDeltaX = 0, mouseDeltaY = 0, isMoving = false, isRunning = false) {
    // Fire cooldown
    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt;
    }

    // Muzzle flash decay
    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= dt;
      if (this.muzzleTimer <= 0) {
        this.muzzleLight.intensity = 0;
        this.muzzleSprite1.material.opacity = 0;
        this.muzzleSprite2.material.opacity = 0;
      }
    }

    // Reload progression
    if (this.isReloading) {
      this.reloadProgress += dt;
      if (this.reloadProgress >= this.reloadDuration) {
        const needed = this.magSize - this.ammo;
        const taken = Math.min(needed, this.reserveAmmo);
        this.ammo += taken;
        this.reserveAmmo -= taken;
        this.isReloading = false;
        this.reloadProgress = 0;
      }
    }

    // ADS interpolation
    const adsSpeed = 10;
    if (this.isAiming && !this.isReloading) {
      this.aimProgress = Math.min(1.0, this.aimProgress + dt * adsSpeed);
    } else {
      this.aimProgress = Math.max(0.0, this.aimProgress - dt * adsSpeed);
    }

    // Base target position & rotation between Hip and ADS
    const targetPos = new THREE.Vector3().lerpVectors(this.hipPos, this.adsPos, this.aimProgress);
    const targetRotX = THREE.MathUtils.lerp(this.hipRot.x, this.adsRot.x, this.aimProgress);
    const targetRotY = THREE.MathUtils.lerp(this.hipRot.y, this.adsRot.y, this.aimProgress);
    const targetRotZ = THREE.MathUtils.lerp(this.hipRot.z, this.adsRot.z, this.aimProgress);

    // Reload dipping animation
    if (this.isReloading) {
      const phase = this.reloadProgress / this.reloadDuration;
      const reloadDip = Math.sin(phase * Math.PI) * 0.18;
      targetPos.y -= reloadDip;
      targetPos.z += reloadDip * 0.5;
    }

    // Movement Bobbing
    if (isMoving) {
      const bobFreq = isRunning ? 14 : 9;
      const bobAmp = (isRunning ? 0.025 : 0.012) * (1 - this.aimProgress * 0.7);
      const bobTime = performance.now() * 0.001 * bobFreq;
      targetPos.x += Math.cos(bobTime) * bobAmp;
      targetPos.y += Math.abs(Math.sin(bobTime)) * bobAmp;
    }

    // Mouse Sway
    const swayFactor = (1 - this.aimProgress * 0.8);
    this.swayPos.x = THREE.MathUtils.lerp(this.swayPos.x, -mouseDeltaX * 0.0004 * swayFactor, dt * 10);
    this.swayPos.y = THREE.MathUtils.lerp(this.swayPos.y, mouseDeltaY * 0.0004 * swayFactor, dt * 10);
    this.swayRot.y = THREE.MathUtils.lerp(this.swayRot.y, -mouseDeltaX * 0.0008 * swayFactor, dt * 10);
    this.swayRot.x = THREE.MathUtils.lerp(this.swayRot.x, mouseDeltaY * 0.0008 * swayFactor, dt * 10);

    // Recoil recovery (Spring-Damper)
    this.recoilImpulse.z = THREE.MathUtils.lerp(this.recoilImpulse.z, 0, dt * 18);
    this.recoilImpulse.y = THREE.MathUtils.lerp(this.recoilImpulse.y, 0, dt * 16);
    this.recoilRot.x = THREE.MathUtils.lerp(this.recoilRot.x, 0, dt * 20);
    this.recoilRot.y = THREE.MathUtils.lerp(this.recoilRot.y, 0, dt * 20);

    // Apply combined transformations
    this.rig.position.set(
      targetPos.x + this.swayPos.x,
      targetPos.y + this.swayPos.y + this.recoilImpulse.y,
      targetPos.z + this.swayPos.z + this.recoilImpulse.z
    );

    this.rig.rotation.set(
      targetRotX + this.swayRot.x + this.recoilRot.x,
      targetRotY + this.swayRot.y + this.recoilRot.y,
      targetRotZ
    );

    // Update Particles (smoke & sparks)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 2.0 * dt; // gravity

      if (p.mesh.material.opacity !== undefined) {
        p.mesh.material.opacity = (p.life / p.maxLife) * 0.5;
      }
      p.mesh.scale.multiplyScalar(1.0 + dt * 0.8);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // Update Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.scene.remove(t.line);
        t.line.geometry.dispose();
        t.line.material.dispose();
        this.tracers.splice(i, 1);
      }
    }
  }

  setVisible(visible) {
    this.rig.visible = visible;
  }
}

window.TacticalGun = TacticalGun;
