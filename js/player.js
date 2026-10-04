/**
 * THE PENGUIN: BEYOND THE DOOR
 * Player Controller - First-Person & Third-Person Camera,
 * Smooth Pointer Lock, Physics, Collisions, Stamina, Health, and Interactions.
 */

class PlayerController {
  constructor(camera, scene, domElement) {
    this.camera = camera;
    this.scene = scene;
    this.domElement = domElement;

    // Camera Mode: 'fps' (First-Person) or 'tps' (Third-Person)
    this.cameraMode = 'fps';
    this.mouseSensitivity = 0.0022;

    // Pitch & Yaw (Euler angles)
    this.pitch = 0;
    this.yaw = 0;

    // Player Physical Body
    this.position = new THREE.Vector3(0, 0.1, -60); // Starting forest position
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.height = 1.45;
    this.radius = 0.45;
    this.isGrounded = true;
    this.gravity = 22.0;

    // Movement Speeds
    this.walkSpeed = 5.0;
    this.runSpeed = 8.8;
    this.jumpForce = 7.8;

    // Stats
    this.health = 100;
    this.maxHealth = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.isDead = false;

    // Key states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false,
      aim: false,
      shoot: false
    };

    // Mouse delta
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    // Audio & Footstep tracking
    this.stepTimer = 0;
    this.currentSurface = 'dirt';

    // Interaction Raycasting
    this.activeInteractable = null;
    this.interactionRange = 3.5;

    // Third-person camera offsets
    this.tpsOffset = new THREE.Vector3(0.45, 0.35, 2.2);

    // Instances
    this.penguin = new PenguinCharacter();
    this.scene.add(this.penguin.mesh);

    this.gun = new TacticalGun(this.camera, this.scene);

    // Setup input listeners
    this.initInputs();
    this.initMobileControls();
  }

  initInputs() {
    // Pointer lock request (only if not on a pure touch device)
    this.domElement.addEventListener('click', () => {
      const isTouch = ('ontouchstart' in window) && window.innerWidth <= 900;
      if (!isTouch && document.pointerLockElement !== this.domElement && !this.isDead && window.gameDirector && window.gameDirector.state === 'playing') {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.domElement && !this.isDead) {
        this.mouseDeltaX = e.movementX;
        this.mouseDeltaY = e.movementY;

        this.yaw -= e.movementX * this.mouseSensitivity;
        this.pitch -= e.movementY * this.mouseSensitivity;

        // Clamp pitch (-88 deg to +88 deg)
        const maxPitch = Math.PI / 2 - 0.04;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
      }
    });

    window.addEventListener('keydown', (e) => {
      if (this.isDead) return;
      switch (e.code) {
        case 'KeyW': this.keys.forward = true; break;
        case 'KeyS': this.keys.backward = true; break;
        case 'KeyA': this.keys.left = true; break;
        case 'KeyD': this.keys.right = true; break;
        case 'ShiftLeft':
        case 'ShiftRight': this.keys.sprint = true; break;
        case 'Space':
          if (this.isGrounded && this.stamina >= 10) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            this.stamina -= 10;
            window.gameAudio.playJump();
          }
          break;
        case 'KeyR':
          this.gun.reload();
          this.penguin.triggerReload();
          break;
        case 'KeyE':
          this.triggerInteraction();
          break;
        case 'KeyV':
          this.toggleCameraMode();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': this.keys.forward = false; break;
        case 'KeyS': this.keys.backward = false; break;
        case 'KeyA': this.keys.left = false; break;
        case 'KeyD': this.keys.right = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': this.keys.sprint = false; break;
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement !== this.domElement || this.isDead) return;
      if (e.button === 0) {
        // Left click: Shoot
        this.keys.shoot = true;
        this.attemptShoot();
      } else if (e.button === 2) {
        // Right click: Aim
        this.keys.aim = true;
        this.gun.setAiming(true);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.keys.shoot = false;
      } else if (e.button === 2) {
        this.keys.aim = false;
        this.gun.setAiming(false);
      }
    });

    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  initMobileControls() {
    const mobileLayer = document.getElementById('mobile-controls');
    if (!mobileLayer) return;

    // Detect mobile / touch devices
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 900;
    if (isTouch) {
      mobileLayer.classList.add('active');
    }

    const toggleBtn = document.getElementById('btn-toggle-touch');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileLayer.classList.toggle('active');
        toggleBtn.classList.toggle('active', mobileLayer.classList.contains('active'));
      });
    }

    // 1. Virtual Analog Joystick
    const joystickZone = document.getElementById('joystick-zone');
    const joystickBase = document.getElementById('joystick-base');
    const joystickKnob = document.getElementById('joystick-knob');
    let joystickTouchId = null;
    let baseCenter = { x: 0, y: 0 };
    const maxRadius = 45;

    if (joystickZone && joystickKnob) {
      const getTouch = (touches, id) => {
        for (let i = 0; i < touches.length; i++) {
          if (touches[i].identifier === id) return touches[i];
        }
        return null;
      };

      const updateJoystick = (clientX, clientY) => {
        let dx = clientX - baseCenter.x;
        let dy = clientY - baseCenter.y;
        const dist = Math.hypot(dx, dy);
        if (dist > maxRadius) {
          dx = (dx / dist) * maxRadius;
          dy = (dy / dist) * maxRadius;
        }
        joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;

        const normX = dx / maxRadius;
        const normY = dy / maxRadius;
        const deadZone = 0.22;

        this.keys.forward = normY < -deadZone;
        this.keys.backward = normY > deadZone;
        this.keys.left = normX < -deadZone;
        this.keys.right = normX > deadZone;
      };

      joystickZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (joystickTouchId !== null) return;
        const touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;
        const rect = joystickBase.getBoundingClientRect();
        baseCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        updateJoystick(touch.clientX, touch.clientY);
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        if (joystickTouchId === null) return;
        const touch = getTouch(e.touches, joystickTouchId);
        if (!touch) return;
        e.preventDefault();
        updateJoystick(touch.clientX, touch.clientY);
      }, { passive: false });

      const resetJoystick = () => {
        joystickTouchId = null;
        joystickKnob.style.transform = `translate(0px, 0px)`;
        this.keys.forward = false;
        this.keys.backward = false;
        this.keys.left = false;
        this.keys.right = false;
      };

      window.addEventListener('touchend', (e) => {
        if (joystickTouchId === null) return;
        const touch = getTouch(e.changedTouches, joystickTouchId);
        if (touch) resetJoystick();
      });

      window.addEventListener('touchcancel', (e) => {
        if (joystickTouchId === null) return;
        resetJoystick();
      });
    }

    // 2. Touch Look Zone
    const lookZone = document.getElementById('touch-look-zone');
    let lookTouchId = null;
    let lastLookPos = { x: 0, y: 0 };

    if (lookZone) {
      lookZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (lookTouchId !== null) return;
        const touch = e.changedTouches[0];
        lookTouchId = touch.identifier;
        lastLookPos = { x: touch.clientX, y: touch.clientY };
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        if (lookTouchId === null) return;
        let touch = null;
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === lookTouchId) {
            touch = e.touches[i];
            break;
          }
        }
        if (!touch) return;
        const dx = touch.clientX - lastLookPos.x;
        const dy = touch.clientY - lastLookPos.y;
        lastLookPos = { x: touch.clientX, y: touch.clientY };

        if (!this.isDead) {
          const sens = this.mouseSensitivity * 1.5;
          this.yaw -= dx * sens;
          this.pitch -= dy * sens;
          const maxPitch = Math.PI / 2 - 0.04;
          this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
        }
      }, { passive: false });

      const endLook = (e) => {
        if (lookTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === lookTouchId) {
            lookTouchId = null;
            break;
          }
        }
      };

      window.addEventListener('touchend', endLook);
      window.addEventListener('touchcancel', endLook);
    }

    // 3. Action Buttons
    const bindTouchAction = (id, onDown, onUp) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add('active');
        if (onDown) onDown();
      }, { passive: false });

      const release = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (btn.id !== 'btn-touch-aim' && btn.id !== 'btn-touch-sprint') {
          btn.classList.remove('active');
        }
        if (onUp) onUp();
      };
      btn.addEventListener('touchend', release);
      btn.addEventListener('touchcancel', release);
    };

    bindTouchAction('btn-touch-fire',
      () => {
        this.keys.shoot = true;
        this.attemptShoot();
      },
      () => {
        this.keys.shoot = false;
      }
    );

    const btnAim = document.getElementById('btn-touch-aim');
    if (btnAim) {
      btnAim.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.keys.aim = !this.keys.aim;
        btnAim.classList.toggle('active', this.keys.aim);
        this.gun.setAiming(this.keys.aim);
      }, { passive: false });
    }

    bindTouchAction('btn-touch-jump', () => {
      if (this.isGrounded && this.stamina >= 10) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        this.stamina -= 10;
        window.gameAudio.playJump();
      }
    });

    bindTouchAction('btn-touch-reload', () => {
      this.gun.reload();
      this.penguin.triggerReload();
    });

    const btnSprint = document.getElementById('btn-touch-sprint');
    if (btnSprint) {
      btnSprint.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.keys.sprint = !this.keys.sprint;
        btnSprint.classList.toggle('active', this.keys.sprint);
      }, { passive: false });
    }

    bindTouchAction('btn-touch-interact', () => {
      this.triggerInteraction();
    });

    const btnCam = document.getElementById('btn-touch-cam');
    if (btnCam) {
      btnCam.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleCameraMode();
      }, { passive: false });
    }

    const btnPause = document.getElementById('btn-touch-pause');
    if (btnPause) {
      btnPause.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.gameDirector && window.gameDirector.state === 'playing') {
          window.gameDirector.pauseGame();
        }
      }, { passive: false });
    }
  }

  toggleCameraMode() {
    this.cameraMode = (this.cameraMode === 'fps') ? 'tps' : 'fps';
    if (this.cameraMode === 'fps') {
      this.gun.setVisible(true);
      this.penguin.mesh.visible = false;
    } else {
      this.gun.setVisible(false);
      this.penguin.mesh.visible = true;
    }
  }

  attemptShoot() {
    if (this.gun.canShoot() && this.gun.ammo > 0) {
      this.penguin.triggerShoot();
    }
    const enemies = window.gameDirector ? window.gameDirector.enemyManager.enemies : [];
    const colliders = window.gameDirector ? window.gameDirector.world.colliders : [];
    this.gun.shoot(enemies, colliders);
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.penguin.triggerHurt();
    window.gameAudio.playPlayerDamage();

    // Trigger HUD blood flash
    if (window.gameDirector) {
      window.gameDirector.onPlayerHurt();
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.penguin.triggerDeath();
    if (window.gameDirector) {
      window.gameDirector.onPlayerDead();
    }
  }

  triggerInteraction() {
    if (this.activeInteractable && window.gameDirector) {
      window.gameDirector.handleInteraction(this.activeInteractable);
    }
  }

  teleport(pos) {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.penguin.mesh.position.copy(pos);
  }

  /**
   * Main Player Physics & Camera Update Loop
   */
  update(dt, worldColliders, interactables, inWater = false) {
    if (this.isDead) {
      this.penguin.update(dt, false, false, false, true);
      return;
    }

    // Determine current surface for footsteps
    if (inWater) {
      this.currentSurface = 'water';
    } else if (window.gameDirector && window.gameDirector.world.activeZone === 'backrooms') {
      this.currentSurface = 'carpet';
    } else if (window.gameDirector && window.gameDirector.world.activeZone === 'poolrooms') {
      this.currentSurface = 'tile';
    } else {
      this.currentSurface = 'dirt';
    }

    // 1. Calculate Movement Intent
    const moveX = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    const moveZ = (this.keys.backward ? 1 : 0) - (this.keys.forward ? 1 : 0);
    const isMoving = (moveX !== 0 || moveZ !== 0);

    // Stamina & Sprinting
    let isSprinting = false;
    if (isMoving && this.keys.sprint && this.stamina > 5 && !this.keys.aim) {
      isSprinting = true;
      this.stamina = Math.max(0, this.stamina - dt * 20);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 18);
    }

    const currentSpeed = isSprinting ? this.runSpeed : this.walkSpeed;

    // Movement Direction relative to camera yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const moveDir = new THREE.Vector3();
    if (isMoving) {
      moveDir.addScaledVector(forward, -moveZ);
      moveDir.addScaledVector(right, moveX);
      moveDir.normalize();

      // Footstep audio cadence
      const stepInterval = isSprinting ? 0.32 : 0.48;
      this.stepTimer += dt;
      if (this.stepTimer >= stepInterval && this.isGrounded) {
        this.stepTimer = 0;
        window.gameAudio.playFootstep(this.currentSurface, isSprinting);
      }
    } else {
      this.stepTimer = 0;
    }

    // Horizontal velocity
    this.velocity.x = moveDir.x * currentSpeed;
    this.velocity.z = moveDir.z * currentSpeed;

    // 2. Gravity & Vertical Physics
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
    }

    // 3. Collision Resolution with Environment Colliders
    const nextPos = this.position.clone().addScaledVector(this.velocity, dt);

    // Ground Plane Collision check based on zone offset
    let groundY = 0;
    if (window.gameDirector) {
      const activeZone = window.gameDirector.world.activeZone;
      const zoneCoord = window.gameDirector.world.zones[activeZone];
      if (zoneCoord) groundY = zoneCoord.y;
    }

    if (nextPos.y <= groundY) {
      nextPos.y = groundY;
      if (!this.isGrounded) {
        window.gameAudio.playLand();
      }
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Capsule / AABB horizontal collision check against obstacles
    this.resolveObstacleCollisions(nextPos, worldColliders);

    this.position.copy(nextPos);

    // 4. Update Penguin Character Model
    this.penguin.mesh.position.copy(this.position);
    this.penguin.mesh.rotation.y = this.yaw;
    this.penguin.update(dt, isMoving, isSprinting, this.keys.aim, this.isGrounded);

    // 5. Update Camera Position & Rotation
    if (this.cameraMode === 'fps') {
      // First-person view: camera placed at penguin eye level
      this.camera.position.set(this.position.x, this.position.y + this.height, this.position.z);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
      this.camera.rotation.z = 0;

      this.penguin.mesh.visible = false; // Hide 3rd person body in FPV
      this.gun.setVisible(true);
    } else {
      // Third-person view: camera over-the-shoulder looking forward
      this.penguin.mesh.visible = true;
      this.gun.setVisible(false);

      const targetLook = new THREE.Vector3(this.position.x, this.position.y + 1.2, this.position.z);

      const camForward = new THREE.Vector3(
        -Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        -Math.cos(this.yaw) * Math.cos(this.pitch)
      );

      const camRight = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

      const camPos = targetLook.clone()
        .addScaledVector(camForward, -this.tpsOffset.z)
        .addScaledVector(camRight, this.tpsOffset.x);
      camPos.y += this.tpsOffset.y;

      this.camera.position.copy(camPos);
      this.camera.lookAt(targetLook);
    }

    // 6. Update Tactical Gun Rig (ADS, sway, recoil, particles)
    this.gun.update(dt, this.mouseDeltaX, this.mouseDeltaY, isMoving, isSprinting);

    // Reset mouse deltas
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    // 7. Check for Nearby Interactable Objects
    this.checkInteractables(interactables);
  }

  resolveObstacleCollisions(targetPos, colliders) {
    if (!colliders || colliders.length === 0) return;

    for (let c of colliders) {
      if (!c.geometry || !c.position) continue;
      // Skip ground planes
      if (c.geometry instanceof THREE.PlaneGeometry) continue;

      // Approximate bounding box check
      if (!c.geometry.boundingBox) c.geometry.computeBoundingBox();
      const box = c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld);

      // Check expansion with player radius
      box.expandByScalar(this.radius);

      if (box.containsPoint(targetPos)) {
        // Simple push-out resolution
        const closestPoint = box.clampPoint(targetPos, new THREE.Vector3());
        const pushDir = targetPos.clone().sub(closestPoint);
        pushDir.y = 0;
        if (pushDir.lengthSq() > 0.0001) {
          pushDir.normalize();
          targetPos.x = closestPoint.x + pushDir.x * 0.05;
          targetPos.z = closestPoint.z + pushDir.z * 0.05;
        }
      }
    }
  }

  checkInteractables(interactables) {
    this.activeInteractable = null;
    if (!interactables) return;

    for (let item of interactables) {
      if (item.isCollected || item.isOpen) continue;
      const dist = this.position.distanceTo(item.position);
      if (dist <= item.radius) {
        this.activeInteractable = item;
        break;
      }
    }
  }
}

window.PlayerController = PlayerController;
