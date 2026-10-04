/**
 * THE PENGUIN: BEYOND THE DOOR
 * Enemy AI System - "Shadow Lurkers / Liminal Stalkers"
 * Unsettling spectral humanoid entities with patrol, chase, stutter-dash,
 * melee attack, hit stagger, and death dissolution with ammo drops.
 */

class ShadowLurker {
  constructor(scene, position, patrolRadius = 15) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);

    // AI & Stats
    this.health = 100;
    this.maxHealth = 100;
    this.isDead = false;
    this.state = 'patrol'; // 'patrol', 'chase', 'attack', 'stagger', 'dead'

    this.spawnPos = position.clone();
    this.patrolRadius = patrolRadius;
    this.patrolTarget = this.getRandomPatrolPoint();
    this.patrolWaitTimer = 0;

    // Detection & Movement
    this.detectionRange = 24.0;
    this.attackRange = 2.2;
    this.moveSpeed = 3.2;
    this.chaseSpeed = 5.8;
    this.attackCooldown = 1.2;
    this.lastAttackTime = 0;

    // Timers & Visuals
    this.animTime = Math.random() * 10;
    this.staggerTimer = 0;
    this.deathTimer = 0;
    this.dissolveParticles = [];

    // Joint references
    this.torso = null;
    this.head = null;
    this.leftArm = null;
    this.rightArm = null;
    this.leftEye = null;
    this.rightEye = null;
    this.hitbox = null;

    this.initModel();
    this.scene.add(this.mesh);
  }

  initModel() {
    // Shifting dark smoky material
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f0b18,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92
    });

    this.eyeMat = new THREE.MeshBasicMaterial({
      color: 0xd946ef // Eerie glowing fuchsia/violet
    });

    // 1. Torso (Tall, slender, slightly hunched)
    this.torso = new THREE.Group();
    this.torso.position.y = 1.35;
    this.mesh.add(this.torso);

    const torsoGeo = new THREE.CylinderGeometry(0.22, 0.16, 0.9, 12);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.bodyMat);
    torsoMesh.castShadow = true;
    this.torso.add(torsoMesh);

    // 2. Head (Featureless elongated shadow skull with glowing eyes)
    this.head = new THREE.Group();
    this.head.position.set(0, 0.62, 0.08);
    this.torso.add(this.head);

    const headGeo = new THREE.SphereGeometry(0.2, 16, 16);
    headGeo.scale(0.8, 1.3, 0.9);
    const headMesh = new THREE.Mesh(headGeo, this.bodyMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Glowing pinprick eyes
    const eyeGeo = new THREE.SphereGeometry(0.032, 8, 8);
    this.leftEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.leftEye.position.set(-0.08, 0.05, 0.16);
    this.head.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.rightEye.position.set(0.08, 0.05, 0.16);
    this.head.add(this.rightEye);

    // 3. Elongated Arms & Claws
    const armGeo = new THREE.CylinderGeometry(0.045, 0.035, 1.1, 8);
    armGeo.translate(0, -0.45, 0);

    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.3, 0.35, 0);
    this.leftArm.rotation.z = 0.15;
    const leftArmMesh = new THREE.Mesh(armGeo, this.bodyMat);
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);
    this.torso.add(this.leftArm);

    // Right Arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.3, 0.35, 0);
    this.rightArm.rotation.z = -0.15;
    const rightArmMesh = new THREE.Mesh(armGeo.clone(), this.bodyMat);
    rightArmMesh.castShadow = true;
    this.rightArm.add(rightArmMesh);
    this.torso.add(this.rightArm);

    // Claws
    for (let i = -1; i <= 1; i++) {
      const clawGeo = new THREE.ConeGeometry(0.015, 0.18, 6);
      clawGeo.rotateX(Math.PI / 2);
      const leftClaw = new THREE.Mesh(clawGeo, this.bodyMat);
      leftClaw.position.set(i * 0.03, -0.95, 0.05);
      this.leftArm.add(leftClaw);

      const rightClaw = new THREE.Mesh(clawGeo.clone(), this.bodyMat);
      rightClaw.position.set(i * 0.03, -0.95, 0.05);
      this.rightArm.add(rightClaw);
    }

    // 4. Elongated Legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.04, 1.1, 8);
    legGeo.translate(0, -0.5, 0);

    this.leftLeg = new THREE.Mesh(legGeo, this.bodyMat);
    this.leftLeg.position.set(-0.16, -0.4, 0);
    this.leftLeg.castShadow = true;
    this.torso.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo.clone(), this.bodyMat);
    this.rightLeg.position.set(0.16, -0.4, 0);
    this.rightLeg.castShadow = true;
    this.torso.add(this.rightLeg);

    // 5. Invisible Hitbox for Raycasting
    const hitboxGeo = new THREE.CylinderGeometry(0.55, 0.55, 2.2, 8);
    hitboxGeo.translate(0, 1.1, 0);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    this.hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    this.mesh.add(this.hitbox);
  }

  getRandomPatrolPoint() {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.patrolRadius;
    return new THREE.Vector3(
      this.spawnPos.x + Math.cos(angle) * dist,
      this.spawnPos.y,
      this.spawnPos.z + Math.sin(angle) * dist
    );
  }

  takeDamage(amount, hitPoint = null) {
    if (this.isDead) return;

    this.health -= amount;
    this.staggerTimer = 0.28;
    this.state = 'stagger';

    // Flash reddish-white
    this.bodyMat.color.setHex(0xff3344);
    setTimeout(() => {
      if (!this.isDead) this.bodyMat.color.setHex(0x0f0b18);
    }, 120);

    window.gameAudio.playEnemyHurt();

    if (this.health <= 0) {
      this.die();
    } else {
      // Aggro immediately to player
      this.state = 'chase';
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.state = 'dead';
    this.deathTimer = 1.2;

    window.gameAudio.playEnemyDie();

    // Spawn Dissolution Smoke
    for (let i = 0; i < 20; i++) {
      const pGeo = new THREE.SphereGeometry(0.12 + Math.random() * 0.1, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({
        color: 0x1e1b4b,
        transparent: true,
        opacity: 0.8
      });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        this.mesh.position.x + (Math.random() - 0.5) * 0.8,
        this.mesh.position.y + 0.5 + Math.random() * 1.5,
        this.mesh.position.z + (Math.random() - 0.5) * 0.8
      );
      this.scene.add(p);
      this.dissolveParticles.push({
        mesh: p,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          0.8 + Math.random() * 1.2,
          (Math.random() - 0.5) * 0.8
        ),
        life: 1.0
      });
    }

    // Spawn Ammo Pickup on Ground
    this.spawnAmmoDrop();
  }

  spawnAmmoDrop() {
    const textures = window.gameTextures;
    const crateMat = new THREE.MeshStandardMaterial({
      map: textures.getCrateTexture(),
      roughness: 0.4,
      metalness: 0.6
    });

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), crateMat);
    box.position.set(this.mesh.position.x, this.mesh.position.y + 0.15, this.mesh.position.z);
    box.castShadow = true;
    this.scene.add(box);

    // Glowing aura around pickup
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xeab308,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.38), glowMat);
    box.add(glow);

    box.isAmmoPickup = true;
    box.ammoAmount = 18;
    if (window.activePickups) {
      window.activePickups.push(box);
    }
  }

  update(dt, playerPosition, onAttackPlayer) {
    this.animTime += dt;

    // Handle Dissolution Particles on Death
    if (this.isDead) {
      for (let i = this.dissolveParticles.length - 1; i >= 0; i--) {
        const dp = this.dissolveParticles[i];
        dp.life -= dt;
        dp.mesh.position.addScaledVector(dp.velocity, dt);
        dp.mesh.material.opacity = dp.life * 0.8;
        dp.mesh.scale.multiplyScalar(1.0 + dt * 0.5);

        if (dp.life <= 0) {
          this.scene.remove(dp.mesh);
          dp.mesh.geometry.dispose();
          dp.mesh.material.dispose();
          this.dissolveParticles.splice(i, 1);
        }
      }

      this.mesh.scale.multiplyScalar(Math.max(0, 1.0 - dt * 2.0));
      if (this.mesh.scale.x <= 0.05) {
        this.mesh.visible = false;
      }
      return;
    }

    // Distance to player
    const distToPlayer = this.mesh.position.distanceTo(playerPosition);

    // Stagger Recovery
    if (this.staggerTimer > 0) {
      this.staggerTimer -= dt;
      this.torso.rotation.x = -0.4;
      return;
    }

    // --- AI BEHAVIOR TREE ---
    if (distToPlayer <= this.attackRange) {
      // Within attack range: ATTACK
      this.state = 'attack';
      const now = performance.now() * 0.001;
      if (now - this.lastAttackTime >= this.attackCooldown) {
        this.lastAttackTime = now;
        this.performAttack(onAttackPlayer);
      }
    } else if (distToPlayer <= this.detectionRange) {
      // Detected player: CHASE
      if (this.state !== 'chase') {
        window.gameAudio.playEnemyAlert();
      }
      this.state = 'chase';
      this.moveTowards(playerPosition, this.chaseSpeed, dt);
    } else {
      // PATROL
      this.state = 'patrol';
      const distToPatrol = this.mesh.position.distanceTo(this.patrolTarget);
      if (distToPatrol < 1.0) {
        this.patrolWaitTimer += dt;
        if (this.patrolWaitTimer > 2.0) {
          this.patrolTarget = this.getRandomPatrolPoint();
          this.patrolWaitTimer = 0;
        }
      } else {
        this.moveTowards(this.patrolTarget, this.moveSpeed, dt);
      }
    }

    // --- PROCEDURAL SKELETON ANIMATIONS ---
    const t = this.animTime;
    if (this.state === 'chase') {
      // Unsettling stutter-sprint
      const sprintSpeed = 16;
      const legSwing = Math.sin(t * sprintSpeed) * 0.85;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;

      // Aggressive reach forward
      this.leftArm.rotation.x = -1.4 + Math.sin(t * sprintSpeed) * 0.4;
      this.rightArm.rotation.x = -1.4 - Math.sin(t * sprintSpeed) * 0.4;

      this.torso.rotation.x = 0.35; // Hunched forward
      this.torso.rotation.z = Math.sin(t * 8) * 0.15; // Jerky head twitch
      this.head.rotation.y = Math.sin(t * 12) * 0.25;
    } else if (this.state === 'patrol') {
      // Slow creepy wander
      const walkSpeed = 6;
      const legSwing = Math.sin(t * walkSpeed) * 0.4;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;

      this.leftArm.rotation.x = Math.sin(t * walkSpeed) * 0.25;
      this.rightArm.rotation.x = -Math.sin(t * walkSpeed) * 0.25;

      this.torso.rotation.x = 0.15;
      this.torso.rotation.z = 0;
      this.head.rotation.y = Math.sin(t * 2) * 0.3;
    } else if (this.state === 'attack') {
      // Swipe animation handled in performAttack
    }
  }

  moveTowards(targetPos, speed, dt) {
    const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position);
    dir.y = 0; // Flat plane movement
    if (dir.lengthSq() > 0.001) {
      dir.normalize();
      this.mesh.position.addScaledVector(dir, speed * dt);

      // Smooth look rotation
      const targetAngle = Math.atan2(dir.x, dir.z);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, dt * 10);
    }
  }

  performAttack(onAttackPlayer) {
    window.gameAudio.playEnemyAttack();

    // Slash animation
    this.rightArm.rotation.x = -2.2;
    setTimeout(() => {
      if (!this.isDead) {
        this.rightArm.rotation.x = -0.5;
        if (onAttackPlayer) {
          onAttackPlayer(25); // Deal 25 damage
        }
      }
    }, 180);
  }
}

class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];
    window.activePickups = [];
  }

  spawnEnemy(position, patrolRadius = 15) {
    const enemy = new ShadowLurker(this.scene, position, patrolRadius);
    this.enemies.push(enemy);
    return enemy;
  }

  update(dt, playerPosition, onAttackPlayer) {
    this.enemies.forEach(e => {
      e.update(dt, playerPosition, onAttackPlayer);
    });

    // Animate pickups
    window.activePickups.forEach(p => {
      p.rotation.y += dt * 1.5;
      p.position.y = 0.15 + Math.sin(performance.now() * 0.003) * 0.05;
    });
  }

  clear() {
    this.enemies.forEach(e => {
      this.scene.remove(e.mesh);
    });
    this.enemies = [];

    window.activePickups.forEach(p => {
      this.scene.remove(p);
    });
    window.activePickups = [];
  }
}

window.EnemyManager = EnemyManager;
