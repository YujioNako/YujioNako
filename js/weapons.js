// Weapons System for FPS Training Simulator

class WeaponSystem {
    constructor() {
        this.weapons = {
            pistol: {
                name: 'Pistol',
                type: 'semi-auto',
                damage: 25,
                fireRate: 400, // ms between shots
                reloadTime: 2000, // ms
                magazineSize: 12,
                totalAmmo: 36,
                spread: {
                    min: 0.5,
                    max: 2.0,
                    increase: 0.3, // increase per shot
                    recovery: 0.1   // recovery per frame
                },
                recoil: {
                    vertical: 2.0,
                    horizontal: 0.5,
                    recovery: 0.8
                },
                sound: 'pistol_shot'
            },
            assault: {
                name: 'Assault Rifle',
                type: 'full-auto',
                damage: 30,
                fireRate: 120, // ms between shots
                reloadTime: 2500, // ms
                magazineSize: 30,
                totalAmmo: 90,
                spread: {
                    min: 1.0,
                    max: 4.0,
                    increase: 0.4,
                    recovery: 0.08
                },
                recoil: {
                    vertical: 3.0,
                    horizontal: 1.0,
                    recovery: 0.6
                },
                sound: 'assault_shot'
            },
            sniper: {
                name: 'Sniper Rifle',
                type: 'bolt-action',
                damage: 100,
                fireRate: 1500, // ms between shots
                reloadTime: 3000, // ms
                magazineSize: 10,
                totalAmmo: 30,
                spread: {
                    min: 0.1,
                    max: 0.5,
                    increase: 0.1,
                    recovery: 0.15
                },
                recoil: {
                    vertical: 8.0,
                    horizontal: 2.0,
                    recovery: 0.4
                },
                sound: 'sniper_shot'
            }
        };
        
        this.currentWeapon = 'pistol';
        this.currentAmmo = this.weapons[this.currentWeapon].magazineSize;
        this.totalAmmo = this.weapons[this.currentWeapon].totalAmmo - this.currentAmmo;
        this.lastShotTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        this.currentSpread = this.weapons[this.currentWeapon].spread.min;
        this.recoilOffset = { x: 0, y: 0 };
        this.isFiring = false;
    }
    
    getCurrentWeapon() {
        return this.weapons[this.currentWeapon];
    }
    
    switchWeapon() {
        if (this.isReloading) return false;
        
        const weaponKeys = Object.keys(this.weapons);
        const currentIndex = weaponKeys.indexOf(this.currentWeapon);
        const nextIndex = (currentIndex + 1) % weaponKeys.length;
        
        this.currentWeapon = weaponKeys[nextIndex];
        this.currentAmmo = this.weapons[this.currentWeapon].magazineSize;
        this.totalAmmo = this.weapons[this.currentWeapon].totalAmmo - this.currentAmmo;
        this.currentSpread = this.weapons[this.currentWeapon].spread.min;
        this.recoilOffset = { x: 0, y: 0 };
        
        return true;
    }
    
    canFire() {
        const now = Date.now();
        const weapon = this.getCurrentWeapon();
        
        return !this.isReloading && 
               this.currentAmmo > 0 && 
               (now - this.lastShotTime) >= weapon.fireRate;
    }
    
    fire(targetX, targetY, aimX, aimY) {
        if (!this.canFire()) return null;
        
        const weapon = this.getCurrentWeapon();
        const now = Date.now();
        
        // Calculate spread
        const spreadAngle = (Math.random() - 0.5) * this.currentSpread * (Math.PI / 180);
        
        // Calculate recoil
        const recoilX = (Math.random() - 0.5) * weapon.recoil.horizontal;
        const recoilY = -weapon.recoil.vertical + (Math.random() * weapon.recoil.vertical * 0.3);
        
        // Apply spread to aim direction
        const dx = targetX - aimX;
        const dy = targetY - aimY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return null;
        
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // Apply spread rotation
        const cos = Math.cos(spreadAngle);
        const sin = Math.sin(spreadAngle);
        const spreadDx = normalizedDx * cos - normalizedDy * sin;
        const spreadDy = normalizedDx * sin + normalizedDy * cos;
        
        // Create shot data
        const shot = {
            startX: aimX,
            startY: aimY,
            directionX: spreadDx,
            directionY: spreadDy,
            damage: weapon.damage,
            spread: this.currentSpread,
            recoil: { x: recoilX, y: recoilY },
            weapon: this.currentWeapon,
            timestamp: now
        };
        
        // Update weapon state
        this.currentAmmo--;
        this.lastShotTime = now;
        this.isFiring = true;
        
        // Increase spread
        this.currentSpread = Math.min(
            weapon.spread.max,
            this.currentSpread + weapon.spread.increase
        );
        
        // Apply recoil
        this.recoilOffset.x += recoilX;
        this.recoilOffset.y += recoilY;
        
        return shot;
    }
    
    startReload() {
        if (this.isReloading || this.totalAmmo === 0 || 
            this.currentAmmo === this.getCurrentWeapon().magazineSize) {
            return false;
        }
        
        this.isReloading = true;
        this.reloadStartTime = Date.now();
        return true;
    }
    
    update() {
        const weapon = this.getCurrentWeapon();
        
        // Handle reloading
        if (this.isReloading) {
            const elapsed = Date.now() - this.reloadStartTime;
            if (elapsed >= weapon.reloadTime) {
                const neededAmmo = weapon.magazineSize - this.currentAmmo;
                const ammoToLoad = Math.min(neededAmmo, this.totalAmmo);
                
                this.currentAmmo += ammoToLoad;
                this.totalAmmo -= ammoToLoad;
                this.isReloading = false;
            }
        }
        
        // Recover spread
        if (!this.isFiring) {
            this.currentSpread = Math.max(
                weapon.spread.min,
                this.currentSpread - weapon.spread.recovery
            );
        }
        
        // Recover recoil
        this.recoilOffset.x *= weapon.recoil.recovery;
        this.recoilOffset.y *= weapon.recoil.recovery;
        
        // Reset firing state
        this.isFiring = false;
    }
    
    getReloadProgress() {
        if (!this.isReloading) return 1.0;
        
        const elapsed = Date.now() - this.reloadStartTime;
        const weapon = this.getCurrentWeapon();
        return Math.min(1.0, elapsed / weapon.reloadTime);
    }
    
    getAmmoDisplay() {
        return `${this.currentAmmo}/${this.totalAmmo}`;
    }
    
    getSpreadRadius(distance) {
        // Convert spread angle to radius at given distance
        return Math.tan(this.currentSpread * Math.PI / 180) * distance;
    }
    
    // For full-auto weapons
    shouldContinueFiring(isMouseDown) {
        const weapon = this.getCurrentWeapon();
        return weapon.type === 'full-auto' && isMouseDown && this.canFire();
    }
    
    // Get weapon stats for UI
    getWeaponStats() {
        const weapon = this.getCurrentWeapon();
        return {
            name: weapon.name,
            ammo: this.getAmmoDisplay(),
            isReloading: this.isReloading,
            reloadProgress: this.getReloadProgress(),
            spread: this.currentSpread,
            recoil: this.recoilOffset,
            type: weapon.type
        };
    }
    
    // Reset weapon to initial state
    reset() {
        const weapon = this.getCurrentWeapon();
        this.currentAmmo = weapon.magazineSize;
        this.totalAmmo = weapon.totalAmmo - this.currentAmmo;
        this.isReloading = false;
        this.currentSpread = weapon.spread.min;
        this.recoilOffset = { x: 0, y: 0 };
        this.isFiring = false;
        this.lastShotTime = 0;
    }
    
    // For gamepad aim assist
    getAimAssistStrength() {
        const weapon = this.getCurrentWeapon();
        // Stronger aim assist for weapons with higher recoil
        return Math.min(0.8, weapon.recoil.vertical / 10);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeaponSystem;
}