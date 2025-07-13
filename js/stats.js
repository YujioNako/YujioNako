// Statistics System for FPS Training Simulator

class StatsSystem {
    constructor() {
        this.currentSession = this.createNewSession();
        this.allTimeStats = this.loadAllTimeStats();
        this.trackingEnabled = true;
        this.reactionTimes = [];
        this.lastTargetSpawnTime = 0;
        this.lastHitTime = 0;
    }
    
    createNewSession() {
        return {
            startTime: Date.now(),
            mode: null, // 'tracking' or 'positioning'
            weapon: null,
            shots: 0,
            hits: 0,
            misses: 0,
            accuracy: 0,
            reactionTimes: [],
            avgReactionTime: 0,
            minReactionTime: Infinity,
            maxReactionTime: 0,
            totalDamage: 0,
            playTime: 0,
            targetData: {
                spawned: 0,
                destroyed: 0,
                missed: 0
            }
        };
    }
    
    loadAllTimeStats() {
        try {
            const saved = localStorage.getItem('fps_trainer_stats');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load stats:', error);
        }
        
        return {
            totalSessions: 0,
            totalPlayTime: 0,
            totalShots: 0,
            totalHits: 0,
            bestAccuracy: 0,
            bestReactionTime: Infinity,
            weaponStats: {
                pistol: { shots: 0, hits: 0, damage: 0 },
                assault: { shots: 0, hits: 0, damage: 0 },
                sniper: { shots: 0, hits: 0, damage: 0 }
            },
            modeStats: {
                tracking: { sessions: 0, accuracy: 0, avgReactionTime: 0 },
                positioning: { sessions: 0, accuracy: 0, avgReactionTime: 0 }
            },
            achievements: [],
            skillLevel: 'Beginner'
        };
    }
    
    saveAllTimeStats() {
        try {
            localStorage.setItem('fps_trainer_stats', JSON.stringify(this.allTimeStats));
        } catch (error) {
            console.warn('Failed to save stats:', error);
        }
    }
    
    startSession(mode, weapon) {
        this.currentSession = this.createNewSession();
        this.currentSession.mode = mode;
        this.currentSession.weapon = weapon;
        this.currentSession.startTime = Date.now();
        this.reactionTimes = [];
    }
    
    endSession() {
        if (!this.currentSession.mode) return;
        
        // Calculate final session stats
        this.currentSession.playTime = Date.now() - this.currentSession.startTime;
        this.currentSession.accuracy = this.calculateAccuracy();
        this.currentSession.avgReactionTime = this.calculateAverageReactionTime();
        
        // Update all-time stats
        this.updateAllTimeStats();
        
        // Check for achievements
        this.checkAchievements();
        
        // Save stats
        this.saveAllTimeStats();
        
        return this.currentSession;
    }
    
    recordShot(weapon, hit = false, damage = 0, targetX = 0, targetY = 0, aimX = 0, aimY = 0) {
        if (!this.trackingEnabled) return;
        
        this.currentSession.shots++;
        
        if (hit) {
            this.currentSession.hits++;
            this.currentSession.totalDamage += damage;
            this.lastHitTime = Date.now();
            
            // Record reaction time for positioning mode
            if (this.currentSession.mode === 'positioning' && this.lastTargetSpawnTime > 0) {
                const reactionTime = this.lastHitTime - this.lastTargetSpawnTime;
                this.recordReactionTime(reactionTime);
            }
        } else {
            this.currentSession.misses++;
        }
        
        // Update real-time accuracy
        this.currentSession.accuracy = this.calculateAccuracy();
        
        // Record shot data for analysis
        this.recordShotData(weapon, hit, damage, targetX, targetY, aimX, aimY);
    }
    
    recordShotData(weapon, hit, damage, targetX, targetY, aimX, aimY) {
        if (!this.currentSession.shotData) {
            this.currentSession.shotData = [];
        }
        
        const distance = Math.sqrt((targetX - aimX) ** 2 + (targetY - aimY) ** 2);
        
        this.currentSession.shotData.push({
            timestamp: Date.now() - this.currentSession.startTime,
            weapon,
            hit,
            damage,
            distance,
            accuracy: this.currentSession.accuracy
        });
    }
    
    recordTargetSpawn(targetId, x, y) {
        this.currentSession.targetData.spawned++;
        this.lastTargetSpawnTime = Date.now();
    }
    
    recordTargetDestroyed(targetId, reactionTime = null) {
        this.currentSession.targetData.destroyed++;
        
        if (reactionTime !== null) {
            this.recordReactionTime(reactionTime);
        }
    }
    
    recordTargetMissed(targetId) {
        this.currentSession.targetData.missed++;
    }
    
    recordReactionTime(time) {
        if (time > 0 && time < 5000) { // Reasonable bounds (0-5 seconds)
            this.reactionTimes.push(time);
            this.currentSession.reactionTimes.push(time);
            
            // Update min/max
            this.currentSession.minReactionTime = Math.min(this.currentSession.minReactionTime, time);
            this.currentSession.maxReactionTime = Math.max(this.currentSession.maxReactionTime, time);
        }
    }
    
    calculateAccuracy() {
        if (this.currentSession.shots === 0) return 0;
        return (this.currentSession.hits / this.currentSession.shots) * 100;
    }
    
    calculateAverageReactionTime() {
        if (this.reactionTimes.length === 0) return 0;
        const sum = this.reactionTimes.reduce((a, b) => a + b, 0);
        return sum / this.reactionTimes.length;
    }
    
    updateAllTimeStats() {
        const session = this.currentSession;
        
        // Update totals
        this.allTimeStats.totalSessions++;
        this.allTimeStats.totalPlayTime += session.playTime;
        this.allTimeStats.totalShots += session.shots;
        this.allTimeStats.totalHits += session.hits;
        
        // Update bests
        if (session.accuracy > this.allTimeStats.bestAccuracy) {
            this.allTimeStats.bestAccuracy = session.accuracy;
        }
        
        if (session.minReactionTime < this.allTimeStats.bestReactionTime && session.minReactionTime > 0) {
            this.allTimeStats.bestReactionTime = session.minReactionTime;
        }
        
        // Update weapon stats
        if (session.weapon && this.allTimeStats.weaponStats[session.weapon]) {
            const weaponStats = this.allTimeStats.weaponStats[session.weapon];
            weaponStats.shots += session.shots;
            weaponStats.hits += session.hits;
            weaponStats.damage += session.totalDamage;
        }
        
        // Update mode stats
        if (session.mode && this.allTimeStats.modeStats[session.mode]) {
            const modeStats = this.allTimeStats.modeStats[session.mode];
            modeStats.sessions++;
            
            // Calculate weighted average accuracy
            const totalSessions = modeStats.sessions;
            const oldWeight = (totalSessions - 1) / totalSessions;
            const newWeight = 1 / totalSessions;
            modeStats.accuracy = modeStats.accuracy * oldWeight + session.accuracy * newWeight;
            
            // Calculate weighted average reaction time
            if (session.avgReactionTime > 0) {
                modeStats.avgReactionTime = modeStats.avgReactionTime * oldWeight + session.avgReactionTime * newWeight;
            }
        }
        
        // Update skill level
        this.updateSkillLevel();
    }
    
    updateSkillLevel() {
        const totalAccuracy = this.allTimeStats.totalHits / Math.max(1, this.allTimeStats.totalShots) * 100;
        const avgReactionTime = this.allTimeStats.bestReactionTime;
        
        if (totalAccuracy >= 90 && avgReactionTime < 300) {
            this.allTimeStats.skillLevel = 'Professional';
        } else if (totalAccuracy >= 80 && avgReactionTime < 400) {
            this.allTimeStats.skillLevel = 'Expert';
        } else if (totalAccuracy >= 70 && avgReactionTime < 500) {
            this.allTimeStats.skillLevel = 'Advanced';
        } else if (totalAccuracy >= 50 && avgReactionTime < 700) {
            this.allTimeStats.skillLevel = 'Intermediate';
        } else if (totalAccuracy >= 30) {
            this.allTimeStats.skillLevel = 'Novice';
        } else {
            this.allTimeStats.skillLevel = 'Beginner';
        }
    }
    
    checkAchievements() {
        const session = this.currentSession;
        const newAchievements = [];
        
        // Accuracy achievements
        if (session.accuracy >= 100 && session.shots >= 10) {
            this.addAchievement('perfect_round', 'Perfect Round', 'Get 100% accuracy with at least 10 shots');
        }
        
        if (session.accuracy >= 90 && session.shots >= 50) {
            this.addAchievement('sharpshooter', 'Sharpshooter', 'Maintain 90%+ accuracy over 50 shots');
        }
        
        // Reaction time achievements
        if (session.minReactionTime < 200) {
            this.addAchievement('lightning_reflexes', 'Lightning Reflexes', 'React in under 200ms');
        }
        
        if (session.avgReactionTime < 300 && this.reactionTimes.length >= 20) {
            this.addAchievement('consistent_speed', 'Consistent Speed', 'Average under 300ms reaction time');
        }
        
        // Volume achievements
        if (session.shots >= 100) {
            this.addAchievement('trigger_happy', 'Trigger Happy', 'Fire 100 shots in one session');
        }
        
        if (this.allTimeStats.totalShots >= 1000) {
            this.addAchievement('thousand_shots', 'Thousand Shots', 'Fire 1,000 total shots');
        }
        
        // Weapon-specific achievements
        Object.keys(this.allTimeStats.weaponStats).forEach(weapon => {
            const stats = this.allTimeStats.weaponStats[weapon];
            const accuracy = stats.hits / Math.max(1, stats.shots) * 100;
            
            if (accuracy >= 85 && stats.shots >= 100) {
                this.addAchievement(`${weapon}_master`, `${weapon} Master`, `85%+ accuracy with ${weapon} over 100 shots`);
            }
        });
        
        // Play time achievements
        const totalHours = this.allTimeStats.totalPlayTime / (1000 * 60 * 60);
        if (totalHours >= 1) {
            this.addAchievement('dedicated', 'Dedicated', 'Play for 1 hour total');
        }
        if (totalHours >= 10) {
            this.addAchievement('committed', 'Committed', 'Play for 10 hours total');
        }
    }
    
    addAchievement(id, name, description) {
        if (!this.allTimeStats.achievements.some(a => a.id === id)) {
            this.allTimeStats.achievements.push({
                id,
                name,
                description,
                unlockedAt: Date.now()
            });
            console.log('Achievement unlocked:', name);
        }
    }
    
    getCurrentStats() {
        return {
            shots: this.currentSession.shots,
            hits: this.currentSession.hits,
            accuracy: this.currentSession.accuracy.toFixed(1),
            reactionTime: this.reactionTimes.length > 0 ? Math.round(this.calculateAverageReactionTime()) : 0,
            playTime: Date.now() - this.currentSession.startTime
        };
    }
    
    getAllTimeStats() {
        return { ...this.allTimeStats };
    }
    
    getSessionSummary() {
        const session = this.currentSession;
        return {
            ...session,
            accuracy: session.accuracy.toFixed(1),
            avgReactionTime: Math.round(session.avgReactionTime),
            minReactionTime: session.minReactionTime === Infinity ? 0 : Math.round(session.minReactionTime),
            maxReactionTime: Math.round(session.maxReactionTime),
            playTimeFormatted: this.formatTime(session.playTime)
        };
    }
    
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    reset() {
        this.currentSession = this.createNewSession();
        this.reactionTimes = [];
        this.lastTargetSpawnTime = 0;
        this.lastHitTime = 0;
    }
    
    exportStats() {
        return {
            currentSession: this.currentSession,
            allTimeStats: this.allTimeStats,
            exportedAt: Date.now()
        };
    }
    
    importStats(data) {
        try {
            if (data.allTimeStats) {
                this.allTimeStats = data.allTimeStats;
                this.saveAllTimeStats();
                return true;
            }
        } catch (error) {
            console.warn('Failed to import stats:', error);
        }
        return false;
    }
    
    clearAllStats() {
        this.allTimeStats = this.loadAllTimeStats();
        this.currentSession = this.createNewSession();
        localStorage.removeItem('fps_trainer_stats');
    }
    
    // Analytics for improvement suggestions
    getImprovementSuggestions() {
        const suggestions = [];
        const session = this.currentSession;
        const allTime = this.allTimeStats;
        
        // Accuracy suggestions
        if (session.accuracy < 50) {
            suggestions.push({
                type: 'accuracy',
                message: 'Try slowing down your shots to improve accuracy',
                priority: 'high'
            });
        }
        
        // Reaction time suggestions
        if (session.avgReactionTime > 600) {
            suggestions.push({
                type: 'speed',
                message: 'Practice quick target acquisition to improve reaction time',
                priority: 'medium'
            });
        }
        
        // Weapon-specific suggestions
        const weaponAccuracies = {};
        Object.keys(allTime.weaponStats).forEach(weapon => {
            const stats = allTime.weaponStats[weapon];
            if (stats.shots > 0) {
                weaponAccuracies[weapon] = (stats.hits / stats.shots) * 100;
            }
        });
        
        const sortedWeapons = Object.entries(weaponAccuracies)
            .sort(([,a], [,b]) => a - b);
        
        if (sortedWeapons.length > 0 && sortedWeapons[0][1] < 60) {
            suggestions.push({
                type: 'weapon',
                message: `Consider practicing more with ${sortedWeapons[0][0]} to improve your weakest weapon`,
                priority: 'low'
            });
        }
        
        return suggestions;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsSystem;
}