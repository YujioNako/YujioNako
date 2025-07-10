// Controls System for FPS Training Simulator

class ControlSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            down: false,
            sensitivity: 1.0
        };
        this.gamepad = {
            index: -1,
            connected: false,
            deadzone: 0.15,
            aimAssist: true,
            sensitivity: 2.0
        };
        this.touch = {
            active: false,
            joystick: {
                active: false,
                startX: 0,
                startY: 0,
                currentX: 0,
                currentY: 0,
                maxDistance: 50
            },
            aim: {
                x: 0,
                y: 0,
                lastX: 0,
                lastY: 0
            }
        };
        
        this.movement = { x: 0, y: 0 };
        this.aim = { x: 0, y: 0 };
        this.actions = {
            shoot: false,
            reload: false,
            switchWeapon: false
        };
        
        this.setupEventListeners();
        this.setupGamepad();
        this.setupTouch();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyDown(e);
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.handleKeyUp(e);
            e.preventDefault();
        });
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.actions.shoot = true;
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
            e.preventDefault();
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        });
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Pointer lock for better mouse control (optional)
        this.canvas.addEventListener('click', () => {
            if (document.pointerLockElement !== this.canvas) {
                this.canvas.requestPointerLock?.();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.handlePointerLockChange();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === this.canvas) {
                this.handlePointerLockMovement(e);
            }
        });
    }
    
    setupGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
            this.gamepad.index = e.gamepad.index;
            this.gamepad.connected = true;
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected');
            if (e.gamepad.index === this.gamepad.index) {
                this.gamepad.connected = false;
                this.gamepad.index = -1;
            }
        });
    }
    
    setupTouch() {
        // Virtual joystick
        const joystickElement = document.getElementById('virtual-joystick-left');
        if (joystickElement) {
            joystickElement.addEventListener('touchstart', (e) => {
                this.handleJoystickStart(e);
                e.preventDefault();
            });
            
            joystickElement.addEventListener('touchmove', (e) => {
                this.handleJoystickMove(e);
                e.preventDefault();
            });
            
            joystickElement.addEventListener('touchend', (e) => {
                this.handleJoystickEnd(e);
                e.preventDefault();
            });
        }
        
        // Touch aiming on canvas
        this.canvas.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
            e.preventDefault();
        });
        
        // Mobile action buttons
        this.setupMobileButtons();
    }
    
    setupMobileButtons() {
        const shootBtn = document.getElementById('shoot-btn');
        const reloadBtn = document.getElementById('reload-btn');
        const switchBtn = document.getElementById('weapon-switch-btn');
        
        if (shootBtn) {
            shootBtn.addEventListener('touchstart', () => {
                this.actions.shoot = true;
            });
            shootBtn.addEventListener('touchend', () => {
                this.actions.shoot = false;
            });
        }
        
        if (reloadBtn) {
            reloadBtn.addEventListener('touchstart', () => {
                this.actions.reload = true;
            });
        }
        
        if (switchBtn) {
            switchBtn.addEventListener('touchstart', () => {
                this.actions.switchWeapon = true;
            });
        }
    }
    
    handleKeyDown(e) {
        switch(e.code) {
            case 'KeyR':
                this.actions.reload = true;
                break;
            case 'Space':
                this.actions.switchWeapon = true;
                break;
            case 'Escape':
                // Handle pause/menu
                break;
        }
    }
    
    handleKeyUp(e) {
        // Reset single-frame actions
        if (e.code === 'KeyR') this.actions.reload = false;
        if (e.code === 'Space') this.actions.switchWeapon = false;
    }
    
    handlePointerLockChange() {
        const locked = document.pointerLockElement === this.canvas;
        console.log('Pointer lock:', locked);
    }
    
    handlePointerLockMovement(e) {
        // Use movement deltas for more precise control
        const deltaX = e.movementX * this.mouse.sensitivity;
        const deltaY = e.movementY * this.mouse.sensitivity;
        
        this.mouse.x = Math.max(0, Math.min(this.canvas.width, this.mouse.x + deltaX));
        this.mouse.y = Math.max(0, Math.min(this.canvas.height, this.mouse.y + deltaY));
    }
    
    handleJoystickStart(e) {
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        
        this.touch.joystick.active = true;
        this.touch.joystick.startX = touch.clientX - rect.left - rect.width / 2;
        this.touch.joystick.startY = touch.clientY - rect.top - rect.height / 2;
        this.touch.joystick.currentX = this.touch.joystick.startX;
        this.touch.joystick.currentY = this.touch.joystick.startY;
    }
    
    handleJoystickMove(e) {
        if (!this.touch.joystick.active) return;
        
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const currentX = touch.clientX - rect.left - centerX;
        const currentY = touch.clientY - rect.top - centerY;
        
        const distance = Math.sqrt(currentX * currentX + currentY * currentY);
        const maxDistance = this.touch.joystick.maxDistance;
        
        if (distance > maxDistance) {
            this.touch.joystick.currentX = (currentX / distance) * maxDistance;
            this.touch.joystick.currentY = (currentY / distance) * maxDistance;
        } else {
            this.touch.joystick.currentX = currentX;
            this.touch.joystick.currentY = currentY;
        }
        
        // Update visual position
        const inner = e.target.querySelector('.joystick-inner');
        if (inner) {
            inner.style.transform = `translate(${this.touch.joystick.currentX}px, ${this.touch.joystick.currentY}px)`;
        }
    }
    
    handleJoystickEnd(e) {
        this.touch.joystick.active = false;
        this.touch.joystick.currentX = 0;
        this.touch.joystick.currentY = 0;
        
        // Reset visual position
        const inner = e.target.querySelector('.joystick-inner');
        if (inner) {
            inner.style.transform = 'translate(0px, 0px)';
        }
    }
    
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            
            this.touch.aim.lastX = touch.clientX;
            this.touch.aim.lastY = touch.clientY;
            this.touch.aim.x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            this.touch.aim.y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            this.actions.shoot = true;
        }
    }
    
    handleTouchMove(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            
            // Calculate delta for aiming
            const deltaX = touch.clientX - this.touch.aim.lastX;
            const deltaY = touch.clientY - this.touch.aim.lastY;
            
            this.touch.aim.x += deltaX * 2; // Sensitivity multiplier
            this.touch.aim.y += deltaY * 2;
            
            // Clamp to canvas bounds
            this.touch.aim.x = Math.max(0, Math.min(this.canvas.width, this.touch.aim.x));
            this.touch.aim.y = Math.max(0, Math.min(this.canvas.height, this.touch.aim.y));
            
            this.touch.aim.lastX = touch.clientX;
            this.touch.aim.lastY = touch.clientY;
        }
    }
    
    handleTouchEnd(e) {
        this.actions.shoot = false;
    }
    
    updateGamepad() {
        if (!this.gamepad.connected) return;
        
        const gp = navigator.getGamepads()[this.gamepad.index];
        if (!gp) return;
        
        // Left stick - movement
        const leftX = Math.abs(gp.axes[0]) > this.gamepad.deadzone ? gp.axes[0] : 0;
        const leftY = Math.abs(gp.axes[1]) > this.gamepad.deadzone ? gp.axes[1] : 0;
        
        this.movement.x = leftX;
        this.movement.y = leftY;
        
        // Right stick - aiming
        const rightX = Math.abs(gp.axes[2]) > this.gamepad.deadzone ? gp.axes[2] : 0;
        const rightY = Math.abs(gp.axes[3]) > this.gamepad.deadzone ? gp.axes[3] : 0;
        
        if (rightX !== 0 || rightY !== 0) {
            this.aim.x += rightX * this.gamepad.sensitivity;
            this.aim.y += rightY * this.gamepad.sensitivity;
            
            // Clamp to canvas bounds
            this.aim.x = Math.max(0, Math.min(this.canvas.width, this.aim.x));
            this.aim.y = Math.max(0, Math.min(this.canvas.height, this.aim.y));
        }
        
        // Buttons
        this.actions.shoot = gp.buttons[7]?.pressed; // RT
        if (gp.buttons[5]?.pressed) this.actions.reload = true; // RB
        if (gp.buttons[3]?.pressed) this.actions.switchWeapon = true; // Y
    }
    
    update() {
        // Update movement from keyboard
        this.movement.x = 0;
        this.movement.y = 0;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) this.movement.y = -1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) this.movement.y = 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.movement.x = -1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) this.movement.x = 1;
        
        // Normalize diagonal movement
        if (this.movement.x !== 0 && this.movement.y !== 0) {
            const length = Math.sqrt(this.movement.x * this.movement.x + this.movement.y * this.movement.y);
            this.movement.x /= length;
            this.movement.y /= length;
        }
        
        // Override with touch joystick if active
        if (this.touch.joystick.active) {
            this.movement.x = this.touch.joystick.currentX / this.touch.joystick.maxDistance;
            this.movement.y = this.touch.joystick.currentY / this.touch.joystick.maxDistance;
        }
        
        // Update aim position
        if (this.isTouchDevice()) {
            this.aim.x = this.touch.aim.x;
            this.aim.y = this.touch.aim.y;
        } else {
            this.aim.x = this.mouse.x;
            this.aim.y = this.mouse.y;
        }
        
        // Update gamepad
        this.updateGamepad();
        
        // Handle shooting
        if (!this.isTouchDevice()) {
            this.actions.shoot = this.mouse.down;
        }
        
        // Reset single-frame actions after processing
        setTimeout(() => {
            this.actions.reload = false;
            this.actions.switchWeapon = false;
        }, 0);
    }
    
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    getMovement() {
        return { ...this.movement };
    }
    
    getAim() {
        return { ...this.aim };
    }
    
    getActions() {
        return { ...this.actions };
    }
    
    setSensitivity(sensitivity) {
        this.mouse.sensitivity = sensitivity;
        this.gamepad.sensitivity = sensitivity * 2;
    }
    
    setAimAssist(enabled) {
        this.gamepad.aimAssist = enabled;
    }
    
    applyAimAssist(targets, aimX, aimY, assistStrength = 0.3) {
        if (!this.gamepad.connected || !this.gamepad.aimAssist) {
            return { x: aimX, y: aimY };
        }
        
        let closestTarget = null;
        let closestDistance = Infinity;
        const assistRadius = 100; // pixels
        
        // Find closest target within assist radius
        for (const target of targets) {
            const dx = target.x - aimX;
            const dy = target.y - aimY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < assistRadius && distance < closestDistance) {
                closestTarget = target;
                closestDistance = distance;
            }
        }
        
        if (closestTarget) {
            // Apply gentle pull towards target
            const dx = closestTarget.x - aimX;
            const dy = closestTarget.y - aimY;
            
            return {
                x: aimX + dx * assistStrength,
                y: aimY + dy * assistStrength
            };
        }
        
        return { x: aimX, y: aimY };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ControlSystem;
}