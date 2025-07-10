// Minimal 3D library for FPS Training Simulator
// This is a simplified Three.js-like implementation using WebGL

const THREE = {};

// Vector3 class
THREE.Vector3 = class {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }
    
    clone() {
        return new THREE.Vector3(this.x, this.y, this.z);
    }
    
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }
    
    multiplyScalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }
    
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    
    normalize() {
        const len = this.length();
        if (len > 0) {
            this.multiplyScalar(1 / len);
        }
        return this;
    }
    
    clampLength(min, max) {
        const len = this.length();
        if (len < min) {
            this.normalize().multiplyScalar(min);
        } else if (len > max) {
            this.normalize().multiplyScalar(max);
        }
        return this;
    }
    
    applyQuaternion(q) {
        const x = this.x, y = this.y, z = this.z;
        const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
        
        // Calculate quat * vector
        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;
        
        // Calculate result * inverse quat
        this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        
        return this;
    }
};

// Quaternion class (simplified)
THREE.Quaternion = class {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
    
    setFromEuler(euler) {
        const c1 = Math.cos(euler.x / 2);
        const c2 = Math.cos(euler.y / 2);
        const c3 = Math.cos(euler.z / 2);
        
        const s1 = Math.sin(euler.x / 2);
        const s2 = Math.sin(euler.y / 2);
        const s3 = Math.sin(euler.z / 2);
        
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        
        return this;
    }
};

// Euler class
THREE.Euler = class {
    constructor(x = 0, y = 0, z = 0, order = 'XYZ') {
        this.x = x;
        this.y = y;
        this.z = z;
        this.order = order;
    }
};

// Matrix4 class (simplified)
THREE.Matrix4 = class {
    constructor() {
        this.elements = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    
    makePerspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov * Math.PI / 360);
        const nf = 1 / (near - far);
        
        this.elements[0] = f / aspect;
        this.elements[1] = 0;
        this.elements[2] = 0;
        this.elements[3] = 0;
        this.elements[4] = 0;
        this.elements[5] = f;
        this.elements[6] = 0;
        this.elements[7] = 0;
        this.elements[8] = 0;
        this.elements[9] = 0;
        this.elements[10] = (far + near) * nf;
        this.elements[11] = -1;
        this.elements[12] = 0;
        this.elements[13] = 0;
        this.elements[14] = 2 * far * near * nf;
        this.elements[15] = 0;
        
        return this;
    }
    
    makeTranslation(x, y, z) {
        this.elements[12] = x;
        this.elements[13] = y;
        this.elements[14] = z;
        return this;
    }
};

// Scene class
THREE.Scene = class {
    constructor() {
        this.children = [];
        this.fog = null;
    }
    
    add(object) {
        this.children.push(object);
    }
    
    remove(object) {
        const index = this.children.indexOf(object);
        if (index > -1) {
            this.children.splice(index, 1);
        }
    }
};

// Object3D base class
THREE.Object3D = class {
    constructor() {
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.scale = new THREE.Vector3(1, 1, 1);
        this.quaternion = new THREE.Quaternion();
        this.userData = {};
        this.castShadow = false;
        this.receiveShadow = false;
    }
    
    setScalar(value) {
        this.scale.set(value, value, value);
    }
};

// Mesh class
THREE.Mesh = class extends THREE.Object3D {
    constructor(geometry, material) {
        super();
        this.geometry = geometry;
        this.material = material;
        this.type = 'Mesh';
    }
};

// Basic geometries
THREE.SphereGeometry = class {
    constructor(radius = 1, widthSegments = 8, heightSegments = 6) {
        this.radius = radius;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
        this.type = 'SphereGeometry';
    }
};

THREE.PlaneGeometry = class {
    constructor(width = 1, height = 1) {
        this.width = width;
        this.height = height;
        this.type = 'PlaneGeometry';
    }
};

THREE.BoxGeometry = class {
    constructor(width = 1, height = 1, depth = 1) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.type = 'BoxGeometry';
    }
};

// Basic materials
THREE.MeshBasicMaterial = class {
    constructor(parameters = {}) {
        this.color = parameters.color || 0xffffff;
        this.transparent = parameters.transparent || false;
        this.opacity = parameters.opacity || 1;
        this.type = 'MeshBasicMaterial';
    }
};

THREE.MeshLambertMaterial = class {
    constructor(parameters = {}) {
        this.color = parameters.color || 0xffffff;
        this.transparent = parameters.transparent || false;
        this.opacity = parameters.opacity || 1;
        this.type = 'MeshLambertMaterial';
    }
};

// Lights
THREE.AmbientLight = class extends THREE.Object3D {
    constructor(color = 0xffffff, intensity = 1) {
        super();
        this.color = color;
        this.intensity = intensity;
        this.type = 'AmbientLight';
    }
};

THREE.DirectionalLight = class extends THREE.Object3D {
    constructor(color = 0xffffff, intensity = 1) {
        super();
        this.color = color;
        this.intensity = intensity;
        this.type = 'DirectionalLight';
        this.shadow = {
            mapSize: { width: 512, height: 512 },
            camera: {
                near: 0.5,
                far: 500,
                left: -5,
                right: 5,
                top: 5,
                bottom: -5
            }
        };
    }
};

// Camera
THREE.PerspectiveCamera = class extends THREE.Object3D {
    constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
        super();
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.type = 'PerspectiveCamera';
        this.projectionMatrix = new THREE.Matrix4();
        this.updateProjectionMatrix();
    }
    
    updateProjectionMatrix() {
        this.projectionMatrix.makePerspective(this.fov, this.aspect, this.near, this.far);
    }
};

// Raycaster for hit detection
THREE.Raycaster = class {
    constructor() {
        this.ray = {
            origin: new THREE.Vector3(),
            direction: new THREE.Vector3()
        };
    }
    
    set(origin, direction) {
        this.ray.origin.copy(origin);
        this.ray.direction.copy(direction);
    }
    
    intersectObjects(objects) {
        const intersections = [];
        
        objects.forEach(object => {
            // Simple sphere intersection for now
            if (object.geometry && object.geometry.type === 'SphereGeometry') {
                const distance = this.ray.origin.clone().sub(object.position).length();
                const radius = object.geometry.radius;
                
                if (distance <= radius) {
                    intersections.push({
                        object: object,
                        point: object.position.clone(),
                        distance: distance
                    });
                }
            }
        });
        
        return intersections.sort((a, b) => a.distance - b.distance);
    }
};

// WebGL Renderer (simplified)
THREE.WebGLRenderer = class {
    constructor(parameters = {}) {
        this.domElement = document.createElement('canvas');
        this.context = this.domElement.getContext('webgl2') || this.domElement.getContext('webgl');
        
        if (!this.context) {
            throw new Error('WebGL not supported');
        }
        
        this.shadowMap = {
            enabled: false,
            type: 'PCFSoftShadowMap'
        };
        
        this.setSize(800, 600);
        this.setClearColor(0x000000, 1);
        
        // Enable depth testing
        const gl = this.context;
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
    }
    
    setSize(width, height) {
        this.domElement.width = width;
        this.domElement.height = height;
        this.domElement.style.width = width + 'px';
        this.domElement.style.height = height + 'px';
        
        if (this.context) {
            this.context.viewport(0, 0, width, height);
        }
    }
    
    setPixelRatio(ratio) {
        // For simplicity, we'll ignore pixel ratio for now
    }
    
    setClearColor(color, alpha) {
        const gl = this.context;
        const r = ((color >> 16) & 255) / 255;
        const g = ((color >> 8) & 255) / 255;
        const b = (color & 255) / 255;
        gl.clearColor(r, g, b, alpha);
    }
    
    render(scene, camera) {
        const gl = this.context;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Simple rendering - just clear for now
        // In a full implementation, this would render all scene objects
    }
};

// Fog
THREE.Fog = class {
    constructor(color, near, far) {
        this.color = color;
        this.near = near;
        this.far = far;
    }
};

// Clock
THREE.Clock = class {
    constructor() {
        this.startTime = performance.now();
        this.oldTime = this.startTime;
        this.elapsedTime = 0;
        this.running = true;
    }
    
    getDelta() {
        let diff = 0;
        
        if (this.running) {
            const newTime = performance.now();
            diff = (newTime - this.oldTime) / 1000;
            this.oldTime = newTime;
            this.elapsedTime += diff;
        }
        
        return diff;
    }
};