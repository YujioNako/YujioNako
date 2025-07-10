// Main Game Engine for FPS Training Simulator

class FPSTrainingGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.state = 'menu'; // 'menu', 'playing', 'paused', 'settings'
        this.mode = null; // 'tracking', 'positioning'
        this.lastTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        
        // Game objects
        this.player = null;
        this.targets = [];
        this.projectiles = [];
        
        // Systems
        this.weaponSystem = null;
        this.controlSystem = null;
        this.audioSystem = null;
        this.statsSystem = null;
        
        // Game settings
        this.settings = {
            sensitivity: 1.0,
            volume: 0.5,
            targetDistance: 400,
            targetSize: 200,
            playerAreaWidth: 300,
            playerAreaHeight: 200
        };
        
        // Game areas
        this.playerArea = { x: 0, y: 0, width: 300, height: 200 };
        this.targetArea = { x: 0, y: 0, width: 200, height: 200 };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('Initializing FPS Training Simulator...');
        
        // Get canvas and context
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        if (!this.canvas || !this.ctx) {
            console.error('Failed to get canvas context');
            return;
        }
        
        // Initialize systems
        this.weaponSystem = new WeaponSystem();
        this.controlSystem = new ControlSystem(this.canvas);
        this.audioSystem = new AudioSystem();
        this.statsSystem = new StatsSystem();
        
        // Initialize player
        this.player = {
            x: this.canvas.width / 4,
            y: this.canvas.height / 2,
            aimX: this.canvas.width / 2,
            aimY: this.canvas.height / 2,
            speed: 100 // pixels per second
        };
        
        // Calculate areas
        this.calculateAreas();
        
        // Setup UI
        this.setupUI();
        
        // Start game loop
        this.gameLoop();
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        console.log('Game initialized successfully');
    }
    
    calculateAreas() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Player area (left side)
        this.playerArea = {
            x: 50,
            y: canvasHeight / 2 - this.settings.playerAreaHeight / 2,
            width: this.settings.playerAreaWidth,
            height: this.settings.playerAreaHeight
        };
        
        // Target area (right side, distance-based)
        const targetAreaX = this.playerArea.x + this.playerArea.width + this.settings.targetDistance;
        this.targetArea = {
            x: targetAreaX,
            y: canvasHeight / 2 - this.settings.targetSize / 2,
            width: this.settings.targetSize,
            height: this.settings.targetSize
        };
        
        // Ensure areas fit on canvas
        if (this.targetArea.x + this.targetArea.width > canvasWidth - 50) {
            this.targetArea.x = canvasWidth - this.targetArea.width - 50;
        }
    }
    
    setupUI() {
        // Menu buttons
        document.getElementById('start-tracking').addEventListener('click', () => {
            this.startGame('tracking');
        });
        
        document.getElementById('start-positioning').addEventListener('click', () => {
            this.startGame('positioning');
        });
        
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
        
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.showMenu();
        });
        
        // Pause menu
        document.getElementById('resume-game').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restart-game').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('quit-game').addEventListener('click', () => {
            this.quitToMenu();
        });
        
        // Settings
        this.setupSettingsUI();
        
        // Escape key for pause
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (this.state === 'playing') {
                    this.pauseGame();
                } else if (this.state === 'paused') {
                    this.resumeGame();
                }
            }
        });
    }
    
    setupSettingsUI() {
        const sensitivitySlider = document.getElementById('sensitivity-slider');
        const volumeSlider = document.getElementById('volume-slider');
        const distanceSlider = document.getElementById('distance-slider');
        const targetSizeSlider = document.getElementById('target-size-slider');
        
        sensitivitySlider.addEventListener('input', (e) => {
            this.settings.sensitivity = parseFloat(e.target.value);
            document.getElementById('sensitivity-value').textContent = e.target.value;
            this.controlSystem.setSensitivity(this.settings.sensitivity);
        });
        
        volumeSlider.addEventListener('input', (e) => {
            this.settings.volume = parseInt(e.target.value) / 100;
            document.getElementById('volume-value').textContent = e.target.value + '%';
            this.audioSystem.setMasterVolume(this.settings.volume);
        });
        
        distanceSlider.addEventListener('input', (e) => {
            this.settings.targetDistance = parseInt(e.target.value);
            document.getElementById('distance-value').textContent = e.target.value + 'px';
            this.calculateAreas();
        });
        
        targetSizeSlider.addEventListener('input', (e) => {
            this.settings.targetSize = parseInt(e.target.value);
            document.getElementById('target-size-value').textContent = e.target.value + 'px';
            this.calculateAreas();
        });
    }
    
    startGame(mode) {
        this.mode = mode;
        this.state = 'playing';
        
        // Reset game objects
        this.targets = [];
        this.projectiles = [];
        
        // Reset player position
        this.player.x = this.playerArea.x + this.playerArea.width / 2;
        this.player.y = this.playerArea.y + this.playerArea.height / 2;
        
        // Reset weapons
        this.weaponSystem.reset();
        
        // Start statistics tracking
        this.statsSystem.startSession(mode, this.weaponSystem.currentWeapon);
        
        // Hide menus, show game
        this.hideAllMenus();
        document.body.classList.add('game-active');
        
        // Start audio
        this.audioSystem.startAmbientSound();
        
        // Spawn initial targets
        if (mode === 'tracking') {
            this.spawnTrackingTarget();
        } else if (mode === 'positioning') {
            this.schedulePositioningTarget();
        }
        
        console.log(`Started ${mode} training mode`);
    }
    
    pauseGame() {
        if (this.state !== 'playing') return;
        
        this.state = 'paused';
        document.getElementById('pause-menu').classList.add('active');
        document.body.classList.add('game-paused');
        this.audioSystem.stopAmbientSound();
    }
    
    resumeGame() {
        if (this.state !== 'paused') return;
        
        this.state = 'playing';
        document.getElementById('pause-menu').classList.remove('active');
        document.body.classList.remove('game-paused');
        this.audioSystem.startAmbientSound();
    }
    
    restartGame() {
        this.statsSystem.endSession();
        this.startGame(this.mode);
    }
    
    quitToMenu() {
        this.statsSystem.endSession();
        this.showMenu();
    }
    
    showMenu() {
        this.state = 'menu';
        this.hideAllMenus();
        document.getElementById('main-menu').classList.add('active');
        document.body.classList.remove('game-active', 'game-paused');
        this.audioSystem.stopAmbientSound();
    }
    
    showSettings() {
        this.state = 'settings';
        this.hideAllMenus();
        document.getElementById('settings-menu').classList.add('active');
    }
    
    hideAllMenus() {
        document.querySelectorAll('.menu').forEach(menu => {
            menu.classList.remove('active');
        });
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
    
    spawnTrackingTarget() {
        const target = {
            id: Date.now(),
            x: this.targetArea.x + this.targetArea.width / 2,
            y: this.targetArea.y + this.targetArea.height / 2,
            radius: 25,
            health: 100,
            maxHealth: 100,
            velocity: { x: 0, y: 0 },
            speed: 50 + Math.random() * 100,
            direction: Math.random() * Math.PI * 2,
            directionChangeTime: 0,
            directionChangeCooldown: 1000 + Math.random() * 2000,
            type: 'tracking'
        };
        
        this.targets.push(target);
        this.statsSystem.recordTargetSpawn(target.id, target.x, target.y);
    }
    
    schedulePositioningTarget() {
        const delay = 1000 + Math.random() * 2000; // 1-3 seconds
        
        setTimeout(() => {
            if (this.state === 'playing' && this.mode === 'positioning') {
                this.spawnPositioningTarget();
                this.schedulePositioningTarget(); // Schedule next target
            }
        }, delay);
    }
    
    spawnPositioningTarget() {
        // Remove existing positioning targets
        this.targets = this.targets.filter(t => t.type !== 'positioning');
        
        const target = {
            id: Date.now(),
            x: this.targetArea.x + Math.random() * (this.targetArea.width - 50) + 25,
            y: this.targetArea.y + Math.random() * (this.targetArea.height - 50) + 25,
            radius: 30,
            health: 50,
            maxHealth: 50,
            lifeTime: 2000 + Math.random() * 1000, // 2-3 seconds
            createdAt: Date.now(),
            type: 'positioning'
        };
        
        this.targets.push(target);
        this.statsSystem.recordTargetSpawn(target.id, target.x, target.y);
    }
    
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // Update systems
        this.weaponSystem.update();
        this.controlSystem.update();
        
        // Get input
        const movement = this.controlSystem.getMovement();
        const aim = this.controlSystem.getAim();
        const actions = this.controlSystem.getActions();
        
        // Update player movement
        this.updatePlayer(movement, deltaTime);
        
        // Update player aim
        this.updateAim(aim);
        
        // Handle actions
        this.handleActions(actions);
        
        // Update targets
        this.updateTargets(deltaTime);
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update UI
        this.updateUI();
    }
    
    updatePlayer(movement, deltaTime) {
        const speed = this.player.speed * deltaTime;
        
        // Move player within bounds
        const newX = this.player.x + movement.x * speed;
        const newY = this.player.y + movement.y * speed;
        
        // Constrain to player area
        this.player.x = Math.max(this.playerArea.x, 
                        Math.min(this.playerArea.x + this.playerArea.width, newX));
        this.player.y = Math.max(this.playerArea.y, 
                        Math.min(this.playerArea.y + this.playerArea.height, newY));
    }
    
    updateAim(aim) {
        // Apply aim assist if using gamepad
        const assistedAim = this.controlSystem.applyAimAssist(
            this.targets, 
            aim.x, 
            aim.y, 
            this.weaponSystem.getAimAssistStrength()
        );
        
        this.player.aimX = assistedAim.x;
        this.player.aimY = assistedAim.y;
    }
    
    handleActions(actions) {
        // Handle shooting
        if (actions.shoot && this.weaponSystem.canFire()) {
            this.shoot();
        }
        
        // Handle reloading
        if (actions.reload) {
            this.reload();
        }
        
        // Handle weapon switching
        if (actions.switchWeapon) {
            this.switchWeapon();
        }
    }
    
    shoot() {
        const shot = this.weaponSystem.fire(
            this.findClosestTarget(),
            this.findClosestTarget(),
            this.player.aimX,
            this.player.aimY
        );
        
        if (shot) {
            // Add projectile
            this.projectiles.push({
                x: shot.startX,
                y: shot.startY,
                directionX: shot.directionX,
                directionY: shot.directionY,
                damage: shot.damage,
                speed: 2000, // pixels per second
                range: 1000,
                distanceTraveled: 0
            });
            
            // Play sound
            this.audioSystem.playWeaponSound(this.weaponSystem.currentWeapon);
            
            // Check for hits
            this.checkHits(shot);
            
            // Mobile haptic feedback
            if (window.mobileOptimizer) {
                window.mobileOptimizer.provideFeedback('hit');
            }
        }
    }
    
    findClosestTarget() {
        let closest = null;
        let closestDistance = Infinity;
        
        for (const target of this.targets) {
            const dx = target.x - this.player.aimX;
            const dy = target.y - this.player.aimY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closest = target;
                closestDistance = distance;
            }
        }
        
        return closest ? { x: closest.x, y: closest.y } : { x: this.player.aimX, y: this.player.aimY };
    }
    
    checkHits(shot) {
        let hit = false;
        
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            
            // Calculate hit using line-circle intersection
            if (this.lineIntersectsCircle(shot, target)) {
                // Hit!
                target.health -= shot.damage;
                hit = true;
                
                // Record hit
                this.statsSystem.recordShot(
                    this.weaponSystem.currentWeapon,
                    true,
                    shot.damage,
                    target.x,
                    target.y,
                    shot.startX,
                    shot.startY
                );
                
                // Play hit sound
                this.audioSystem.playHitSound();
                
                // Check if target is destroyed
                if (target.health <= 0) {
                    const reactionTime = target.type === 'positioning' ? 
                        Date.now() - target.createdAt : null;
                    
                    this.statsSystem.recordTargetDestroyed(target.id, reactionTime);
                    this.targets.splice(i, 1);
                    
                    // Spawn new target for tracking mode
                    if (this.mode === 'tracking') {
                        this.spawnTrackingTarget();
                    }
                }
                
                break; // Only hit one target per shot
            }
        }
        
        if (!hit) {
            // Record miss
            this.statsSystem.recordShot(
                this.weaponSystem.currentWeapon,
                false,
                0,
                this.player.aimX,
                this.player.aimY,
                shot.startX,
                shot.startY
            );
            
            this.audioSystem.playMissSound();
            
            if (window.mobileOptimizer) {
                window.mobileOptimizer.provideFeedback('miss');
            }
        }
    }
    
    lineIntersectsCircle(shot, target) {
        const lineLength = 2000; // Max range
        const endX = shot.startX + shot.directionX * lineLength;
        const endY = shot.startY + shot.directionY * lineLength;
        
        // Calculate distance from circle center to line
        const A = endY - shot.startY;
        const B = shot.startX - endX;
        const C = endX * shot.startY - shot.startX * endY;
        
        const distance = Math.abs(A * target.x + B * target.y + C) / Math.sqrt(A * A + B * B);
        
        return distance <= target.radius;
    }
    
    reload() {
        if (this.weaponSystem.startReload()) {
            this.audioSystem.playReloadSound();
            
            if (window.mobileOptimizer) {
                window.mobileOptimizer.provideFeedback('reload');
            }
        }
    }
    
    switchWeapon() {
        if (this.weaponSystem.switchWeapon()) {
            this.audioSystem.playWeaponSwitchSound();
            
            if (window.mobileOptimizer) {
                window.mobileOptimizer.provideFeedback('weapon_switch');
            }
        }
    }
    
    updateTargets(deltaTime) {
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            
            if (target.type === 'tracking') {
                this.updateTrackingTarget(target, deltaTime);
            } else if (target.type === 'positioning') {
                this.updatePositioningTarget(target, deltaTime);
            }
        }
    }
    
    updateTrackingTarget(target, deltaTime) {
        // Update direction change timer
        target.directionChangeTime += deltaTime * 1000;
        
        if (target.directionChangeTime >= target.directionChangeCooldown) {
            target.direction += (Math.random() - 0.5) * Math.PI;
            target.directionChangeTime = 0;
            target.directionChangeCooldown = 1000 + Math.random() * 2000;
        }
        
        // Update velocity
        target.velocity.x = Math.cos(target.direction) * target.speed;
        target.velocity.y = Math.sin(target.direction) * target.speed;
        
        // Update position
        target.x += target.velocity.x * deltaTime;
        target.y += target.velocity.y * deltaTime;
        
        // Bounce off walls
        if (target.x - target.radius < this.targetArea.x || 
            target.x + target.radius > this.targetArea.x + this.targetArea.width) {
            target.velocity.x *= -1;
            target.direction = Math.atan2(target.velocity.y, target.velocity.x);
        }
        
        if (target.y - target.radius < this.targetArea.y || 
            target.y + target.radius > this.targetArea.y + this.targetArea.height) {
            target.velocity.y *= -1;
            target.direction = Math.atan2(target.velocity.y, target.velocity.x);
        }
        
        // Clamp position
        target.x = Math.max(this.targetArea.x + target.radius, 
                   Math.min(this.targetArea.x + this.targetArea.width - target.radius, target.x));
        target.y = Math.max(this.targetArea.y + target.radius, 
                   Math.min(this.targetArea.y + this.targetArea.height - target.radius, target.y));
    }
    
    updatePositioningTarget(target, deltaTime) {
        const elapsed = Date.now() - target.createdAt;
        
        if (elapsed >= target.lifeTime) {
            // Target expired
            this.statsSystem.recordTargetMissed(target.id);
            this.targets.splice(this.targets.indexOf(target), 1);
        }
    }
    
    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile
            const distance = projectile.speed * deltaTime;
            projectile.x += projectile.directionX * distance;
            projectile.y += projectile.directionY * distance;
            projectile.distanceTraveled += distance;
            
            // Remove if out of range
            if (projectile.distanceTraveled >= projectile.range) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    updateUI() {
        const stats = this.statsSystem.getCurrentStats();
        const weaponStats = this.weaponSystem.getWeaponStats();
        
        // Update HUD
        document.getElementById('weapon-name').textContent = weaponStats.name;
        document.getElementById('ammo-count').textContent = weaponStats.ammo;
        document.getElementById('accuracy').textContent = stats.accuracy + '%';
        document.getElementById('hits').textContent = stats.hits;
        document.getElementById('shots').textContent = stats.shots;
    }
    
    render() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.state === 'playing' || this.state === 'paused') {
            this.renderGame();
        }
    }
    
    renderGame() {
        // Render areas
        this.renderAreas();
        
        // Render targets
        this.renderTargets();
        
        // Render projectiles
        this.renderProjectiles();
        
        // Render player
        this.renderPlayer();
        
        // Render UI elements
        this.renderUI();
    }
    
    renderAreas() {
        // Player area
        this.ctx.strokeStyle = '#7f8c8d';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.playerArea.x, this.playerArea.y, 
                           this.playerArea.width, this.playerArea.height);
        
        this.ctx.fillStyle = 'rgba(52, 73, 94, 0.2)';
        this.ctx.fillRect(this.playerArea.x, this.playerArea.y, 
                         this.playerArea.width, this.playerArea.height);
        
        // Target area
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.targetArea.x, this.targetArea.y, 
                           this.targetArea.width, this.targetArea.height);
        
        this.ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
        this.ctx.fillRect(this.targetArea.x, this.targetArea.y, 
                         this.targetArea.width, this.targetArea.height);
    }
    
    renderTargets() {
        for (const target of this.targets) {
            // Health bar background
            const barWidth = target.radius * 2;
            const barHeight = 4;
            const barX = target.x - barWidth / 2;
            const barY = target.y - target.radius - 10;
            
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health bar
            const healthPercent = target.health / target.maxHealth;
            this.ctx.fillStyle = healthPercent > 0.5 ? '#27ae60' : '#e74c3c';
            this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Target circle
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
            
            if (target.type === 'tracking') {
                this.ctx.fillStyle = '#e74c3c';
            } else {
                this.ctx.fillStyle = '#f39c12';
            }
            
            this.ctx.fill();
            
            // Target border
            this.ctx.strokeStyle = '#ecf0f1';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Crosshair on target
            this.ctx.strokeStyle = '#ecf0f1';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(target.x - 10, target.y);
            this.ctx.lineTo(target.x + 10, target.y);
            this.ctx.moveTo(target.x, target.y - 10);
            this.ctx.lineTo(target.x, target.y + 10);
            this.ctx.stroke();
        }
    }
    
    renderProjectiles() {
        this.ctx.fillStyle = '#f39c12';
        
        for (const projectile of this.projectiles) {
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    renderPlayer() {
        // Player circle
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = '#3498db';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ecf0f1';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Aim line
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y);
        this.ctx.lineTo(this.player.aimX, this.player.aimY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    renderUI() {
        // Weapon spread indicator
        const spreadRadius = this.weaponSystem.getSpreadRadius(this.settings.targetDistance);
        if (spreadRadius > 0) {
            this.ctx.strokeStyle = 'rgba(231, 76, 60, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(this.player.aimX, this.player.aimY, spreadRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Reload indicator
        if (this.weaponSystem.isReloading) {
            const progress = this.weaponSystem.getReloadProgress();
            const barWidth = 100;
            const barHeight = 10;
            const barX = this.canvas.width / 2 - barWidth / 2;
            const barY = this.canvas.height - 50;
            
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            this.ctx.fillStyle = '#f39c12';
            this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            
            this.ctx.strokeStyle = '#ecf0f1';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Reloading...', this.canvas.width / 2, barY - 5);
        }
    }
    
    gameLoop(currentTime = 0) {
        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent large jumps
        const clampedDeltaTime = Math.min(deltaTime, 1/30);
        
        // Update and render
        this.update(clampedDeltaTime);
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
        
        // Update FPS counter
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.fps = Math.round(1 / deltaTime);
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    window.game = new FPSTrainingGame();
});