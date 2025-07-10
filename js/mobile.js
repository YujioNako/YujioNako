// Mobile-specific optimizations for FPS Training Simulator

class MobileOptimizer {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.orientation = this.getOrientation();
        this.performanceMode = 'auto'; // 'low', 'medium', 'high', 'auto'
        this.initialized = false;
        
        if (this.isMobile || this.isTablet) {
            this.initialize();
        }
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }
    
    detectTablet() {
        return /iPad|Android.*tablet|Android.*pad/i.test(navigator.userAgent) ||
               (window.innerWidth >= 768 && this.isMobile);
    }
    
    getOrientation() {
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }
    
    initialize() {
        if (this.initialized) return;
        
        this.setupViewport();
        this.setupPerformanceOptimizations();
        this.setupOrientationHandling();
        this.setupTouchOptimizations();
        this.setupVisibilityHandling();
        this.setupBatteryOptimizations();
        
        this.initialized = true;
        console.log('Mobile optimizations initialized');
    }
    
    setupViewport() {
        // Ensure proper viewport settings
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        // Optimize viewport for gaming
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no';
        
        // Prevent iOS Safari zoom on input focus
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });
        
        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    setupPerformanceOptimizations() {
        // Detect device performance capabilities
        this.performanceMode = this.detectPerformanceLevel();
        
        // Apply performance-based optimizations
        this.applyPerformanceSettings();
        
        // Monitor performance
        this.setupPerformanceMonitoring();
    }
    
    detectPerformanceLevel() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        let performance = 'medium';
        
        // Check for hardware acceleration
        if (!gl) {
            performance = 'low';
        } else {
            const renderer = gl.getParameter(gl.RENDERER);
            const vendor = gl.getParameter(gl.VENDOR);
            
            // High-end mobile GPUs
            if (/A[0-9]+|Mali-G[0-9]+|Adreno [56][0-9]+/i.test(renderer)) {
                performance = 'high';
            }
            // Mid-range GPUs
            else if (/Mali-G[0-9]+|Adreno [34][0-9]+/i.test(renderer)) {
                performance = 'medium';
            }
            // Low-end or older GPUs
            else {
                performance = 'low';
            }
        }
        
        // Consider device memory
        if (navigator.deviceMemory) {
            if (navigator.deviceMemory >= 4 && performance !== 'low') {
                performance = 'high';
            } else if (navigator.deviceMemory < 2) {
                performance = 'low';
            }
        }
        
        // Consider CPU cores
        if (navigator.hardwareConcurrency) {
            if (navigator.hardwareConcurrency >= 8 && performance === 'medium') {
                performance = 'high';
            } else if (navigator.hardwareConcurrency <= 2) {
                performance = 'low';
            }
        }
        
        console.log('Detected performance level:', performance);
        return performance;
    }
    
    applyPerformanceSettings() {
        const settings = this.getPerformanceSettings();
        
        // Apply canvas optimizations
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            // Adjust canvas resolution based on performance
            const rect = canvas.getBoundingClientRect();
            const scale = settings.canvasScale;
            
            canvas.width = rect.width * scale;
            canvas.height = rect.height * scale;
            
            // Apply CSS scaling if needed
            if (scale !== 1) {
                canvas.style.width = rect.width + 'px';
                canvas.style.height = rect.height + 'px';
            }
        }
        
        // Set render quality hints
        document.documentElement.style.setProperty('--render-quality', settings.renderQuality);
    }
    
    getPerformanceSettings() {
        const settings = {
            low: {
                canvasScale: 0.5,
                renderQuality: 'optimizeSpeed',
                particleCount: 10,
                shadowQuality: 'off',
                antialiasing: false,
                targetFPS: 30
            },
            medium: {
                canvasScale: 0.75,
                renderQuality: 'auto',
                particleCount: 25,
                shadowQuality: 'low',
                antialiasing: false,
                targetFPS: 45
            },
            high: {
                canvasScale: 1.0,
                renderQuality: 'optimizeQuality',
                particleCount: 50,
                shadowQuality: 'medium',
                antialiasing: true,
                targetFPS: 60
            }
        };
        
        return settings[this.performanceMode] || settings.medium;
    }
    
    setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        let fpsHistory = [];
        
        const monitorFPS = () => {
            frameCount++;
            const now = performance.now();
            
            if (now - lastTime >= 1000) {
                const fps = frameCount * 1000 / (now - lastTime);
                fpsHistory.push(fps);
                
                // Keep last 10 seconds of history
                if (fpsHistory.length > 10) {
                    fpsHistory.shift();
                }
                
                // Adjust performance if needed
                const avgFPS = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
                this.adjustPerformanceBasedOnFPS(avgFPS);
                
                frameCount = 0;
                lastTime = now;
            }
            
            requestAnimationFrame(monitorFPS);
        };
        
        requestAnimationFrame(monitorFPS);
    }
    
    adjustPerformanceBasedOnFPS(avgFPS) {
        const targetFPS = this.getPerformanceSettings().targetFPS;
        
        // If FPS is consistently low, reduce quality
        if (avgFPS < targetFPS * 0.8 && this.performanceMode !== 'low') {
            if (this.performanceMode === 'high') {
                this.performanceMode = 'medium';
            } else {
                this.performanceMode = 'low';
            }
            
            console.log('Reducing performance mode to:', this.performanceMode);
            this.applyPerformanceSettings();
        }
        // If FPS is consistently high, we could increase quality
        else if (avgFPS > targetFPS * 1.2 && this.performanceMode !== 'high') {
            if (this.performanceMode === 'low') {
                this.performanceMode = 'medium';
            } else {
                this.performanceMode = 'high';
            }
            
            console.log('Increasing performance mode to:', this.performanceMode);
            this.applyPerformanceSettings();
        }
    }
    
    setupOrientationHandling() {
        const handleOrientationChange = () => {
            const newOrientation = this.getOrientation();
            
            if (newOrientation !== this.orientation) {
                this.orientation = newOrientation;
                this.onOrientationChange(newOrientation);
            }
        };
        
        window.addEventListener('resize', handleOrientationChange);
        window.addEventListener('orientationchange', () => {
            // iOS needs a delay after orientation change
            setTimeout(handleOrientationChange, 100);
        });
        
        // Initial check
        handleOrientationChange();
    }
    
    onOrientationChange(orientation) {
        console.log('Orientation changed to:', orientation);
        
        // Adjust UI for orientation
        document.body.setAttribute('data-orientation', orientation);
        
        // Trigger canvas resize
        window.dispatchEvent(new Event('resize'));
        
        // Show orientation hint for better experience
        if (orientation === 'portrait' && !this.isTablet) {
            this.showOrientationHint();
        } else {
            this.hideOrientationHint();
        }
    }
    
    showOrientationHint() {
        let hint = document.getElementById('orientation-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'orientation-hint';
            hint.innerHTML = `
                <div class="orientation-content">
                    <div class="orientation-icon">📱➡️</div>
                    <p>Rotate your device for better gameplay experience</p>
                </div>
            `;
            hint.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: white;
                text-align: center;
                font-family: inherit;
            `;
            document.body.appendChild(hint);
        }
        hint.style.display = 'flex';
        
        // Auto-hide after 3 seconds
        setTimeout(() => this.hideOrientationHint(), 3000);
    }
    
    hideOrientationHint() {
        const hint = document.getElementById('orientation-hint');
        if (hint) {
            hint.style.display = 'none';
        }
    }
    
    setupTouchOptimizations() {
        // Disable text selection
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.mozUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
        
        // Disable touch callouts
        document.body.style.webkitTouchCallout = 'none';
        
        // Optimize touch delay
        document.body.style.touchAction = 'manipulation';
        
        // Fast click for better responsiveness
        this.setupFastClick();
    }
    
    setupFastClick() {
        let touchStartTime = 0;
        let touchStartPos = { x: 0, y: 0 };
        
        document.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchStartPos.x = e.touches[0].clientX;
            touchStartPos.y = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            
            // Only trigger click for short, stationary touches
            if (touchDuration < 200) {
                const touchEndPos = {
                    x: e.changedTouches[0].clientX,
                    y: e.changedTouches[0].clientY
                };
                
                const distance = Math.sqrt(
                    Math.pow(touchEndPos.x - touchStartPos.x, 2) +
                    Math.pow(touchEndPos.y - touchStartPos.y, 2)
                );
                
                if (distance < 10) {
                    // Trigger immediate click without 300ms delay
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        clientX: touchEndPos.x,
                        clientY: touchEndPos.y
                    });
                    
                    e.target.dispatchEvent(clickEvent);
                }
            }
        });
    }
    
    setupVisibilityHandling() {
        // Pause game when app goes to background
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onAppBackground();
            } else {
                this.onAppForeground();
            }
        });
        
        // Handle app lifecycle on mobile
        window.addEventListener('pagehide', () => this.onAppBackground());
        window.addEventListener('pageshow', () => this.onAppForeground());
    }
    
    onAppBackground() {
        console.log('App went to background');
        // Pause audio
        if (window.audioSystem) {
            window.audioSystem.stopAmbientSound();
        }
        
        // Trigger pause if game is running
        if (window.game && window.game.state === 'playing') {
            window.game.pause();
        }
    }
    
    onAppForeground() {
        console.log('App returned to foreground');
        // Resume audio if needed
        if (window.audioSystem) {
            window.audioSystem.resumeContext();
        }
    }
    
    setupBatteryOptimizations() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then((battery) => {
                this.monitorBattery(battery);
            });
        }
    }
    
    monitorBattery(battery) {
        const updateBatteryOptimizations = () => {
            // Reduce performance when battery is low
            if (battery.level < 0.2 && !battery.charging) {
                if (this.performanceMode !== 'low') {
                    console.log('Low battery detected, reducing performance');
                    this.performanceMode = 'low';
                    this.applyPerformanceSettings();
                }
            }
        };
        
        battery.addEventListener('levelchange', updateBatteryOptimizations);
        battery.addEventListener('chargingchange', updateBatteryOptimizations);
        
        // Initial check
        updateBatteryOptimizations();
    }
    
    // Haptic feedback for supported devices
    vibrate(pattern = [100]) {
        if ('vibrate' in navigator && this.isMobile) {
            navigator.vibrate(pattern);
        }
    }
    
    // Provide feedback for game events
    provideFeedback(type) {
        switch (type) {
            case 'hit':
                this.vibrate([50]);
                break;
            case 'miss':
                this.vibrate([100, 50, 100]);
                break;
            case 'reload':
                this.vibrate([200]);
                break;
            case 'weapon_switch':
                this.vibrate([100, 100, 100]);
                break;
        }
    }
    
    // Get recommended settings for current device
    getRecommendedSettings() {
        return {
            performanceMode: this.performanceMode,
            touchSensitivity: this.isMobile ? 1.5 : 1.0,
            uiScale: this.isMobile ? 1.2 : 1.0,
            showOnScreenControls: this.isMobile,
            enableHapticFeedback: this.isMobile,
            reducedAnimations: this.performanceMode === 'low'
        };
    }
    
    // Check if device supports specific features
    hasFeature(feature) {
        switch (feature) {
            case 'webgl':
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
            case 'gamepad':
                return 'getGamepads' in navigator;
            case 'vibration':
                return 'vibrate' in navigator;
            case 'fullscreen':
                return document.documentElement.requestFullscreen !== undefined;
            case 'pointerlock':
                return document.documentElement.requestPointerLock !== undefined;
            default:
                return false;
        }
    }
}

// Global instance
window.mobileOptimizer = new MobileOptimizer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimizer;
}