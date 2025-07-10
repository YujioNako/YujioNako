// 3D FPS Training Simulator using Canvas 2D with 3D projection
class FPS3DTrainingGame {
    constructor() {
        // Canvas and context
        this.canvas = null;
        this.ctx = null;
        
        // Game state
        this.state = 'menu'; // 'menu', 'playing', 'paused', 'settings'
        this.mode = null; // 'tracking', 'positioning'
        this.isPointerLocked = false;
        
        // 3D Camera and player
        this.camera = {
            x: 0,
            y: 1.6, // Eye level height
            z: 0,
            rotX: 0, // Pitch (up/down rotation)
            rotY: 0, // Yaw (left/right rotation)
            fov: 75,
            near: 0.1,
            far: 100
        };
        
        // Player movement
        this.moveState = { forward: false, backward: false, left: false, right: false };
        this.velocity = { x: 0, y: 0, z: 0 };
        
        // 3D objects
        this.targets = [];
        this.environment = [];
        
        // Systems
        this.weaponSystem = null;
        this.controlSystem = null;
        this.audioSystem = null;
        this.statsSystem = null;
        
        // Game settings
        this.settings = {
            sensitivity: 0.002,
            volume: 0.5,
            fov: 75,
            targetDistance: 20,
            mouseSensitivity: 1.0
        };
        
        // Performance
        this.lastTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('Initializing 3D FPS Training Simulator...');
        
        try {
            // Get canvas and context
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            if (!this.canvas || !this.ctx) {
                throw new Error('Failed to get canvas context');
            }
            
            // Initialize systems
            this.weaponSystem = new WeaponSystem();
            this.controlSystem = new ControlSystem(this);
            this.audioSystem = new AudioSystem();
            this.statsSystem = new StatsSystem();
            
            // Initialize 3D environment
            this.initializeEnvironment();
            
            // Initialize UI
            this.initializeUI();
            this.setupEventListeners();
            
            // Start render loop
            this.animate();
            
            console.log('3D FPS Training Simulator initialized successfully');
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to initialize game: ' + error.message);
        }
    }
    
    initializeEnvironment() {
        // Create 3D environment objects
        this.environment = [
            // Ground plane
            {
                type: 'plane',
                x: 0, y: 0, z: 0,
                width: 100, height: 100,
                rotX: Math.PI / 2, rotY: 0, rotZ: 0,
                color: '#2c3e50'
            },
            // Back wall
            {
                type: 'plane',
                x: 0, y: 10, z: -25,
                width: 50, height: 20,
                rotX: 0, rotY: 0, rotZ: 0,
                color: '#34495e'
            },
            // Side walls
            {
                type: 'plane',
                x: -25, y: 10, z: 0,
                width: 50, height: 20,
                rotX: 0, rotY: Math.PI / 2, rotZ: 0,
                color: '#34495e'
            },
            {
                type: 'plane',
                x: 25, y: 10, z: 0,
                width: 50, height: 20,
                rotX: 0, rotY: -Math.PI / 2, rotZ: 0,
                color: '#34495e'
            }
        ];
        
        // Add depth markers
        for (let i = 0; i < 5; i++) {
            this.environment.push({
                type: 'box',
                x: -20 + i * 10,
                y: 1.5,
                z: -20,
                width: 0.5,
                height: 3,
                depth: 0.5,
                color: '#7f8c8d'
            });
        }
    }
    
    initializeUI() {
        // Initialize crosshair
        this.createCrosshair();
        
        // Update weapon info display
        this.updateWeaponDisplay();
    }
    
    createCrosshair() {
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            crosshair.style.position = 'fixed';
            crosshair.style.top = '50%';
            crosshair.style.left = '50%';
            crosshair.style.transform = 'translate(-50%, -50%)';
            crosshair.style.width = '4px';
            crosshair.style.height = '4px';
            crosshair.style.backgroundColor = '#e74c3c';
            crosshair.style.borderRadius = '50%';
            crosshair.style.zIndex = '1000';
            crosshair.style.pointerEvents = 'none';
        }
    }
    
    setupEventListeners() {
        // Menu buttons
        document.getElementById('start-tracking')?.addEventListener('click', () => {
            this.startGame('tracking');
        });
        
        document.getElementById('start-positioning')?.addEventListener('click', () => {
            this.startGame('positioning');
        });
        
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showSettings();
        });
        
        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showMenu();
        });
        
        // Pause menu
        document.getElementById('resume-game')?.addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restart-game')?.addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('quit-game')?.addEventListener('click', () => {
            this.quitToMenu();
        });
        
        // Settings
        this.setupSettingsListeners();
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        document.addEventListener('pointerlockerror', () => this.onPointerLockError());
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupSettingsListeners() {
        // Sensitivity
        const sensitivitySlider = document.getElementById('sensitivity-slider');
        const sensitivityValue = document.getElementById('sensitivity-value');
        sensitivitySlider?.addEventListener('input', (e) => {
            this.settings.mouseSensitivity = parseFloat(e.target.value);
            this.settings.sensitivity = 0.002 * this.settings.mouseSensitivity;
            sensitivityValue.textContent = this.settings.mouseSensitivity.toFixed(1);
        });
        
        // Volume
        const volumeSlider = document.getElementById('volume-slider');
        const volumeValue = document.getElementById('volume-value');
        volumeSlider?.addEventListener('input', (e) => {
            this.settings.volume = parseFloat(e.target.value) / 100;
            volumeValue.textContent = e.target.value + '%';
            if (this.audioSystem) {
                this.audioSystem.setMasterVolume(this.settings.volume);
            }
        });
        
        // FOV
        const fovSlider = document.getElementById('fov-slider');
        const fovValue = document.getElementById('fov-value');
        fovSlider?.addEventListener('input', (e) => {
            this.settings.fov = parseInt(e.target.value);
            this.camera.fov = this.settings.fov;
            fovValue.textContent = this.settings.fov + '°';
        });
        
        // Target Distance
        const distanceSlider = document.getElementById('distance-slider');
        const distanceValue = document.getElementById('distance-value');
        distanceSlider?.addEventListener('input', (e) => {
            this.settings.targetDistance = parseInt(e.target.value);
            distanceValue.textContent = this.settings.targetDistance + 'm';
        });
    }
    
    startGame(mode) {
        this.mode = mode;
        this.state = 'playing';
        
        // Request pointer lock
        this.canvas.requestPointerLock();
        
        // Hide menu, show game UI
        this.hideAllMenus();
        this.showGameUI();
        
        // Initialize game mode
        if (mode === 'tracking') {
            this.startTrackingMode();
        } else if (mode === 'positioning') {
            this.startPositioningMode();
        }
        
        // Reset stats
        this.statsSystem.reset();
        this.updateStatsDisplay();
    }
    
    startTrackingMode() {
        console.log('Starting tracking mode');
        this.createTrackingTarget();
    }
    
    startPositioningMode() {
        console.log('Starting positioning mode');
        this.spawnPositioningTarget();
    }
    
    createTrackingTarget() {
        // Remove existing targets
        this.clearTargets();
        
        // Create 3D sphere target
        const target = {
            type: 'sphere',
            x: 0,
            y: 2,
            z: -this.settings.targetDistance,
            radius: 0.5,
            color: '#e74c3c',
            userData: {
                type: 'tracking',
                velocity: {
                    x: (Math.random() - 0.5) * 10,
                    y: (Math.random() - 0.5) * 5,
                    z: 0
                },
                bounds: { x: 15, y: 8, z: 5 },
                startX: 0,
                startY: 2,
                startZ: -this.settings.targetDistance
            }
        };
        
        this.targets.push(target);
    }
    
    spawnPositioningTarget() {
        // Remove existing targets
        this.clearTargets();
        
        // Create 3D sphere target at random position
        const angle = Math.random() * Math.PI * 2;
        const distance = this.settings.targetDistance + (Math.random() - 0.5) * 10;
        const height = 1 + Math.random() * 3;
        
        const target = {
            type: 'sphere',
            x: Math.cos(angle) * distance * 0.3,
            y: height,
            z: -distance + Math.sin(angle) * distance * 0.3,
            radius: 0.3,
            color: '#e74c3c',
            userData: {
                type: 'positioning',
                spawnTime: Date.now(),
                lifetime: 3000 + Math.random() * 2000
            }
        };
        
        this.targets.push(target);
        
        // Schedule next target
        setTimeout(() => {
            if (this.state === 'playing' && this.mode === 'positioning') {
                this.spawnPositioningTarget();
            }
        }, target.userData.lifetime + 500);
    }
    
    clearTargets() {
        this.targets = [];
    }
    
    updateTargets(deltaTime) {
        this.targets.forEach((target, index) => {
            if (target.userData.type === 'tracking') {
                this.updateTrackingTarget(target, deltaTime);
            } else if (target.userData.type === 'positioning') {
                this.updatePositioningTarget(target, index);
            }
        });
    }
    
    updateTrackingTarget(target, deltaTime) {
        const userData = target.userData;
        
        // Update position
        target.x += userData.velocity.x * deltaTime;
        target.y += userData.velocity.y * deltaTime;
        target.z += userData.velocity.z * deltaTime;
        
        // Bounce off bounds
        const relativeX = target.x - userData.startX;
        const relativeY = target.y - userData.startY;
        
        if (Math.abs(relativeX) > userData.bounds.x) {
            userData.velocity.x *= -1;
            target.x = userData.startX + Math.sign(relativeX) * userData.bounds.x;
        }
        
        if (Math.abs(relativeY) > userData.bounds.y) {
            userData.velocity.y *= -1;
            target.y = userData.startY + Math.sign(relativeY) * userData.bounds.y;
        }
        
        // Add randomness to movement
        userData.velocity.x += (Math.random() - 0.5) * 2 * deltaTime;
        userData.velocity.y += (Math.random() - 0.5) * 1 * deltaTime;
        
        // Limit velocity
        const maxSpeed = 15;
        const speed = Math.sqrt(userData.velocity.x ** 2 + userData.velocity.y ** 2);
        if (speed > maxSpeed) {
            userData.velocity.x = (userData.velocity.x / speed) * maxSpeed;
            userData.velocity.y = (userData.velocity.y / speed) * maxSpeed;
        }
    }
    
    updatePositioningTarget(target, index) {
        const userData = target.userData;
        const elapsed = Date.now() - userData.spawnTime;
        
        if (elapsed > userData.lifetime) {
            this.targets.splice(index, 1);
            
            // Count as miss
            this.statsSystem.recordMiss();
            this.updateStatsDisplay();
        }
    }
    
    handleShooting() {
        if (this.state !== 'playing' || !this.weaponSystem) return;
        
        // Check if weapon can fire
        if (!this.weaponSystem.canFire()) return;
        
        // Fire weapon
        this.weaponSystem.fire();
        
        // Update ammo display
        this.updateWeaponDisplay();
        
        // Play shooting sound
        if (this.audioSystem) {
            this.audioSystem.playWeaponSound(this.weaponSystem.getCurrentWeapon().type);
        }
        
        // Perform raycast
        this.performRaycast();
        
        // Record shot
        this.statsSystem.recordShot();
        this.updateStatsDisplay();
    }
    
    performRaycast() {
        // Create ray from camera center with weapon spread
        const weapon = this.weaponSystem.getCurrentWeapon();
        const spread = this.weaponSystem.getCurrentSpread();
        
        // Apply spread to aim direction
        const spreadX = (Math.random() - 0.5) * spread;
        const spreadY = (Math.random() - 0.5) * spread;
        
        // Calculate ray direction considering camera rotation and spread
        const rayDirX = Math.sin(this.camera.rotY + spreadX) * Math.cos(this.camera.rotX + spreadY);
        const rayDirY = -Math.sin(this.camera.rotX + spreadY);
        const rayDirZ = -Math.cos(this.camera.rotY + spreadX) * Math.cos(this.camera.rotX + spreadY);
        
        // Check intersection with targets
        this.targets.forEach((target, index) => {
            if (this.raySphereIntersection(
                this.camera.x, this.camera.y, this.camera.z,
                rayDirX, rayDirY, rayDirZ,
                target.x, target.y, target.z, target.radius
            )) {
                this.handleTargetHit(target, index);
            }
        });
    }
    
    raySphereIntersection(rayX, rayY, rayZ, dirX, dirY, dirZ, sphereX, sphereY, sphereZ, radius) {
        // Vector from ray origin to sphere center
        const ocX = rayX - sphereX;
        const ocY = rayY - sphereY;
        const ocZ = rayZ - sphereZ;
        
        // Quadratic equation coefficients
        const a = dirX * dirX + dirY * dirY + dirZ * dirZ;
        const b = 2.0 * (ocX * dirX + ocY * dirY + ocZ * dirZ);
        const c = ocX * ocX + ocY * ocY + ocZ * ocZ - radius * radius;
        
        // Discriminant
        const discriminant = b * b - 4 * a * c;
        
        return discriminant >= 0;
    }
    
    handleTargetHit(target, index) {
        // Record hit
        this.statsSystem.recordHit();
        this.updateStatsDisplay();
        
        // Play hit sound
        if (this.audioSystem) {
            this.audioSystem.playHitSound({ x: target.x, y: target.y, z: target.z });
        }
        
        // Remove target if positioning mode
        if (target.userData.type === 'positioning') {
            this.targets.splice(index, 1);
        }
        
        // Create hit effect (visual feedback)
        this.createHitEffect(target.x, target.y, target.z);
    }
    
    createHitEffect(x, y, z) {
        // Add a temporary hit effect
        // For now, just log it - could add visual particles later
        console.log(`Hit effect at (${x}, ${y}, ${z})`);
    }
    
    handleMovement(deltaTime) {
        if (this.state !== 'playing') return;
        
        const moveSpeed = 10; // units per second
        let moveX = 0, moveZ = 0;
        
        // Calculate movement direction relative to camera
        if (this.moveState.forward) {
            moveX += Math.sin(this.camera.rotY);
            moveZ -= Math.cos(this.camera.rotY);
        }
        if (this.moveState.backward) {
            moveX -= Math.sin(this.camera.rotY);
            moveZ += Math.cos(this.camera.rotY);
        }
        if (this.moveState.left) {
            moveX -= Math.cos(this.camera.rotY);
            moveZ -= Math.sin(this.camera.rotY);
        }
        if (this.moveState.right) {
            moveX += Math.cos(this.camera.rotY);
            moveZ += Math.sin(this.camera.rotY);
        }
        
        // Normalize and apply movement
        const moveLength = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (moveLength > 0) {
            this.camera.x += (moveX / moveLength) * moveSpeed * deltaTime;
            this.camera.z += (moveZ / moveLength) * moveSpeed * deltaTime;
        }
    }
    
    handleMouseMovement(movementX, movementY) {
        if (!this.isPointerLocked) return;
        
        const sensitivity = this.settings.sensitivity;
        
        // Update camera rotation
        this.camera.rotY -= movementX * sensitivity;
        this.camera.rotX -= movementY * sensitivity;
        
        // Limit vertical rotation
        this.camera.rotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotX));
    }
    
    // 3D Projection and Rendering
    project3D(x, y, z) {
        // Transform to camera space
        const cosY = Math.cos(this.camera.rotY);
        const sinY = Math.sin(this.camera.rotY);
        const cosX = Math.cos(this.camera.rotX);
        const sinX = Math.sin(this.camera.rotX);
        
        // Translate to camera position
        const tx = x - this.camera.x;
        const ty = y - this.camera.y;
        const tz = z - this.camera.z;
        
        // Rotate around Y axis (yaw)
        const rx = tx * cosY - tz * sinY;
        const rz = tx * sinY + tz * cosY;
        
        // Rotate around X axis (pitch)
        const ry = ty * cosX - rz * sinX;
        const finalZ = ty * sinX + rz * cosX;
        
        // Project to screen space
        if (finalZ <= 0) return null; // Behind camera
        
        const fov = this.camera.fov * Math.PI / 180;
        const scale = (this.canvas.height / 2) / Math.tan(fov / 2);
        
        const screenX = (rx * scale / finalZ) + this.canvas.width / 2;
        const screenY = (ry * scale / finalZ) + this.canvas.height / 2;
        
        return { x: screenX, y: screenY, z: finalZ };
    }
    
    render() {
        // Clear canvas with background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render environment
        this.renderEnvironment();
        
        // Render targets
        this.renderTargets();
        
        // Render UI elements if playing
        if (this.state === 'playing') {
            this.renderGameUI();
        }
    }
    
    renderEnvironment() {
        // Simple environment rendering
        // For now, just render a basic ground grid and walls outline
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 1;
        
        // Draw ground grid
        for (let i = -50; i <= 50; i += 5) {
            // Lines parallel to X axis
            const p1 = this.project3D(i, 0, -50);
            const p2 = this.project3D(i, 0, 50);
            if (p1 && p2) {
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.stroke();
            }
            
            // Lines parallel to Z axis
            const p3 = this.project3D(-50, 0, i);
            const p4 = this.project3D(50, 0, i);
            if (p3 && p4) {
                this.ctx.beginPath();
                this.ctx.moveTo(p3.x, p3.y);
                this.ctx.lineTo(p4.x, p4.y);
                this.ctx.stroke();
            }
        }
        
        // Draw depth markers
        this.environment.forEach(obj => {
            if (obj.type === 'box') {
                const projected = this.project3D(obj.x, obj.y, obj.z);
                if (projected) {
                    this.ctx.fillStyle = obj.color;
                    const size = Math.max(2, 20 / projected.z); // Size based on distance
                    this.ctx.fillRect(projected.x - size/2, projected.y - size, size, size * 2);
                }
            }
        });
    }
    
    renderTargets() {
        this.targets.forEach(target => {
            const projected = this.project3D(target.x, target.y, target.z);
            if (projected) {
                // Calculate size based on distance
                const size = (target.radius * 50) / projected.z;
                
                this.ctx.fillStyle = target.color;
                this.ctx.beginPath();
                this.ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add outline
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        });
    }
    
    renderGameUI() {
        // Render any additional game UI elements here
        // The HUD is handled by HTML overlay
    }
    
    onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement === this.canvas;
        
        if (!this.isPointerLocked && this.state === 'playing') {
            this.pauseGame();
        }
    }
    
    onPointerLockError() {
        console.error('Pointer lock failed');
    }
    
    onWindowResize() {
        // Update canvas size if needed
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    pauseGame() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.showPauseMenu();
        }
    }
    
    resumeGame() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.hidePauseMenu();
            this.canvas.requestPointerLock();
        }
    }
    
    restartGame() {
        this.clearTargets();
        this.startGame(this.mode);
    }
    
    quitToMenu() {
        this.state = 'menu';
        this.clearTargets();
        document.exitPointerLock();
        this.hideGameUI();
        this.showMenu();
    }
    
    // UI Management
    showMenu() {
        this.hideAllMenus();
        document.getElementById('main-menu')?.classList.add('active');
    }
    
    showSettings() {
        this.hideAllMenus();
        document.getElementById('settings-menu')?.classList.add('active');
    }
    
    showPauseMenu() {
        document.getElementById('pause-menu')?.classList.add('active');
    }
    
    hidePauseMenu() {
        document.getElementById('pause-menu')?.classList.remove('active');
    }
    
    showGameUI() {
        document.getElementById('hud')?.style.setProperty('display', 'block');
    }
    
    hideGameUI() {
        document.getElementById('hud')?.style.setProperty('display', 'none');
    }
    
    hideAllMenus() {
        document.querySelectorAll('.menu').forEach(menu => {
            menu.classList.remove('active');
        });
    }
    
    updateWeaponDisplay() {
        if (!this.weaponSystem) return;
        
        const weapon = this.weaponSystem.getCurrentWeapon();
        const nameElement = document.getElementById('weapon-name');
        const ammoElement = document.getElementById('ammo-count');
        
        if (nameElement) nameElement.textContent = weapon.name;
        if (ammoElement) ammoElement.textContent = `${this.weaponSystem.currentAmmo}/${this.weaponSystem.totalAmmo}`;
    }
    
    updateStatsDisplay() {
        if (!this.statsSystem) return;
        
        const stats = this.statsSystem.getCurrentStats();
        
        const accuracyElement = document.getElementById('accuracy');
        const hitsElement = document.getElementById('hits');
        const shotsElement = document.getElementById('shots');
        
        if (accuracyElement) accuracyElement.textContent = stats.accuracy + '%';
        if (hitsElement) hitsElement.textContent = stats.hits.toString();
        if (shotsElement) shotsElement.textContent = stats.shots.toString();
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    showError(message) {
        console.error(message);
        alert(message);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update game systems
        if (this.state === 'playing') {
            this.handleMovement(deltaTime);
            this.updateTargets(deltaTime);
            
            // Update weapon system
            if (this.weaponSystem) {
                this.weaponSystem.update(deltaTime);
            }
        }
        
        // Render scene
        this.render();
        
        // Update FPS counter
        this.frameCount++;
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
        }
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    // Wait a short time to ensure all scripts are loaded
    setTimeout(() => {
        window.game = new FPS3DTrainingGame();
    }, 100);
});