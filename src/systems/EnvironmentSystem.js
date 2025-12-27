import * as THREE from 'three';
import { createCentralStatue } from './StatueBuilder.js';

//Helper Functions from original main.j
function createStyledMesh(geometry, color, opacity = 1, useOutline = false) {
    const group = new THREE.Group();
    const meshMat = new THREE.MeshPhongMaterial({ color: color, transparent: opacity < 1, opacity: opacity, flatShading: true });
    const mesh = new THREE.Mesh(geometry, meshMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (useOutline) {
        const edges = new THREE.EdgesGeometry(geometry);
        const outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
        group.add(outline);
    }
    return group;
}

function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getChunkKey(cx, cz) {
    return `${cx}:${cz}`;
}

export class EnvironmentSystem {
    constructor(sceneManager) {
        this.scene = sceneManager.scene;
        this.camera = sceneManager.camera; // needed for sky and chunks update

        this.world = new THREE.Group();
        this.scene.add(this.world);

        // State
        this.activeChunks = new Map();
        this.CHUNK_SIZE = 60;
        this.PRELOAD_RADIUS = 2;

        // Wind
        this.wind = {
            direction: new THREE.Vector3(1, 0, 1).normalize(),
            strength: 0,
            time: 0
        };

       
        this.sunGroup = new THREE.Group();
        this.moonGroup = new THREE.Group();
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.moonLight = new THREE.DirectionalLight(0xaaaaff, 0.4);
        this.ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);

        this.skyUniforms = {
            uTopColor: { value: new THREE.Color(0x0077ff) },
            uBottomColor: { value: new THREE.Color(0xffffff) },
            uTime: { value: 0 },
            uCloudDensity: { value: 0.0 },
            uCloudColor: { value: new THREE.Color(0xffffff) }
        };
        this.skyMesh = null;
        this.stars = null;
        this.ground = null;

        // Grass Material (Global)
        this.grassMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uWindStrength: { value: 0 },
                uWindDirection: { value: new THREE.Vector3(1, 0, 0) }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uWindStrength;
                uniform vec3 uWindDirection;
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    float heightFactor = pos.y * pos.y; 
                    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
                    float wave = sin(uTime + worldPosition.x * 0.5 + worldPosition.z * 0.5);
                    pos.x += uWindDirection.x * uWindStrength * heightFactor * (0.5 + 0.5 * wave);
                    pos.z += uWindDirection.z * uWindStrength * heightFactor * (0.5 + 0.5 * wave);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(vColor, 0.7);
                }
            `,
            vertexColors: true,
            transparent: true
        });

        this.initEnvironment();
    }

    initEnvironment() {
        //llights
        this.scene.add(this.ambientLight);
        this.sunLight.castShadow = true;
        this.scene.add(this.sunLight);
        this.scene.add(this.moonLight);

        
        const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffaa }));
        const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(12, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3 }));
        this.sunGroup.add(sunMesh, sunGlow);

        const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 16), new THREE.MeshBasicMaterial({ color: 0xeeeeff }));
        const moonGlow = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xaaaaff, transparent: true, opacity: 0.2 }));
        this.moonGroup.add(moonMesh, moonGlow);

        
        const skyGeo = new THREE.SphereGeometry(900, 32, 16);
        const skyMat = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vWorldPosition;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uTopColor;
                uniform vec3 uBottomColor;
                uniform float uTime;
                uniform float uCloudDensity;
                uniform vec3 uCloudColor;
                varying vec3 vWorldPosition;
                varying vec2 vUv;
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                float snoise(vec2 v){
                  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                  vec2 i  = floor(v + dot(v, C.yy) );
                  vec2 x0 = v -   i + dot(i, C.xx);
                  vec2 i1;
                  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                  vec4 x12 = x0.xyxy + C.xxzz;
                  x12.xy -= i1;
                  i = mod(i, 289.0);
                  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                  m = m*m ; m = m*m ;
                  vec3 x = 2.0 * fract(p * C.www) - 1.0;
                  vec3 h = abs(x) - 0.5;
                  vec3 ox = floor(x + 0.5);
                  vec3 a0 = x - ox;
                  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                  vec3 g;
                  g.x  = a0.x  * x0.x  + h.x  * x0.y;
                  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                  return 130.0 * dot(m, g);
                }
                void main() {
                    float h = normalize(vWorldPosition).y;
                    vec3 skyColor = mix(uBottomColor, uTopColor, max(h, 0.0));
                    vec2 cloudUV = vWorldPosition.xz * 0.001; 
                    float speed = 0.05;
                    float time = uTime * speed;
                    float n1 = snoise(cloudUV * 3.0 + vec2(time, time * 0.5));
                    float n2 = snoise(cloudUV * 6.0 - vec2(time * 0.5, 0.0));
                    float noise = n1 * 0.5 + n2 * 0.25;
                    float cloudMask = smoothstep(0.2, 0.6, h);
                    float cloud = smoothstep(0.1, 0.8, noise + uCloudDensity) * cloudMask;
                    gl_FragColor = vec4(mix(skyColor, uCloudColor, cloud), 1.0);
                }
            `,
            uniforms: this.skyUniforms,
            side: THREE.BackSide
        });
        this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.skyMesh);

    
        this.stars = this.createStars();
        this.scene.add(this.stars);

        
        const groundGeo = new THREE.PlaneGeometry(1000, 1000);
        const groundMat = new THREE.MeshPhongMaterial({
            color: 0x112211,
            specular: 0x050505,
            shininess: 10,
            flatShading: true
        });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    createStars() {
        const starCount = 5000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const sizes = [];
        for (let i = 0; i < starCount; i++) {
            positions.push((Math.random() - 0.5) * 1000, Math.random() * 500, (Math.random() - 0.5) * 1000);
            sizes.push(Math.random() * 0.5);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.7,
            transparent: true,
            opacity: 0,
            sizeAttenuation: true
        });
        return new THREE.Points(geometry, material);
    }

    
    createRock(x, z, s) {
        const geo = new THREE.DodecahedronGeometry(s, 0);
        const rock = createStyledMesh(geo, 0x666666, 1, false);
        rock.position.set(x, s * 0.4, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.scale.set(1, 0.6 + Math.random() * 0.4, 1);
        return rock;
    }

    createTree(x, z, h) {
        const treeGroup = new THREE.Group();
        const trunk = createStyledMesh(new THREE.CylinderGeometry(0.15, 0.25, h * 0.4, 8), 0x331a00, 1, false);
        trunk.position.y = h * 0.2;
        treeGroup.add(trunk);
        for (let i = 0; i < 3; i++) {
            const radius = 1.4 - i * 0.3;
            const foliage = createStyledMesh(new THREE.ConeGeometry(radius, h * 0.6, 8), 0x145522, 0.9, false);
            foliage.position.y = h * 0.4 + (i * h * 0.6 * 0.3);
            treeGroup.add(foliage);
        }
        treeGroup.position.set(x, 0, z);
        return treeGroup;
    }

    //central Statue - the party of heroes
    createCentralStatue() {
        const statueGroup = new THREE.Group();
        return statueGroup;
    }

    createChunk(cx, cz) {
        const chunkGroup = new THREE.Group();
        const chunkSeed = cx * 1000 + cz;
        const offsetX = cx * this.CHUNK_SIZE;
        const offsetZ = cz * this.CHUNK_SIZE;
        chunkGroup.position.set(offsetX, 0, offsetZ);

        const grassGeo = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const grassCount = 400;

        for (let i = 0; i < grassCount; i++) {
            const lx = (seededRandom(chunkSeed + i) - 0.5) * this.CHUNK_SIZE;
            const lz = (seededRandom(chunkSeed + i + 10000) - 0.5) * this.CHUNK_SIZE;
            const h = 0.15 + seededRandom(chunkSeed + i * 2) * 0.4;
            const sway = (seededRandom(chunkSeed + i * 3) - 0.5) * 0.2;
            positions.push(lx, 0, lz);
            positions.push(lx + sway, h, lz + sway);
            const shade = 0.4 + seededRandom(chunkSeed + i * 5) * 0.4;
            colors.push(0.1 * shade, 0.8 * shade, 0.2 * shade, 0.1 * shade, 0.8 * shade, 0.2 * shade);
        }
        grassGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        grassGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        chunkGroup.add(new THREE.LineSegments(grassGeo, this.grassMaterial));

        const rockCount = Math.floor(seededRandom(chunkSeed) * 3) + 1;
        for (let i = 0; i < rockCount; i++) {
            const lx = (seededRandom(chunkSeed + i + 100) - 0.5) * this.CHUNK_SIZE;
            const lz = (seededRandom(chunkSeed + i + 200) - 0.5) * this.CHUNK_SIZE;
            const s = 0.5 + seededRandom(chunkSeed + i + 300) * 1.5;
            chunkGroup.add(this.createRock(lx, lz, s));
        }

        const treeCount = Math.floor(seededRandom(chunkSeed + 500) * 3) + 1;
        for (let i = 0; i < treeCount; i++) {
            const lx = (seededRandom(chunkSeed + i + 600) - 0.5) * this.CHUNK_SIZE;
            const lz = (seededRandom(chunkSeed + i + 700) - 0.5) * this.CHUNK_SIZE;
            const h = 5 + seededRandom(chunkSeed + i + 800) * 4;

            const wx = offsetX + lx;
            const wz = offsetZ + lz;
            if (Math.abs(wx) < 10 && Math.abs(wz - 40) < 10) continue;

            const tree = this.createTree(lx, lz, h);
            tree.userData = { isTree: true, initialRot: tree.rotation.clone(), phaseOffset: Math.random() * 10 };
            chunkGroup.add(tree);
        }
        this.world.add(chunkGroup);
        return chunkGroup;
    }

ß
    update() {
        this.updateAtmosphere();
        this.updateWind();
        this.updateTrees();
        this.updateWorldChunks();

        // Sync Infinite Ground and sky
        this.ground.position.x = this.camera.position.x;
        this.ground.position.z = this.camera.position.z;
        this.skyMesh.position.copy(this.camera.position);
        this.stars.position.x = this.camera.position.x;
        this.stars.position.z = this.camera.position.z;
    }

    updateAtmosphere() {
        const dayDuration = 3600000;
        const cycle = (Date.now() % dayDuration) / dayDuration;
        const angle = cycle * Math.PI * 2 - Math.PI / 2;
        const radius = 300;

        this.sunGroup.position.set(this.camera.position.x + Math.cos(angle) * radius, Math.sin(angle) * radius, this.camera.position.z - 100);
        this.sunLight.position.copy(this.sunGroup.position);
        this.moonGroup.position.set(this.camera.position.x + Math.cos(angle + Math.PI) * radius, Math.sin(angle + Math.PI) * radius, this.camera.position.z - 100);
        this.moonLight.position.copy(this.moonGroup.position);

      
      
        //to ensure it works i need the colors.
        const noonTop = new THREE.Color(0x3a7bd5);
        const noonBottom = new THREE.Color(0x87ceeb);
        const sunsetTop = new THREE.Color(0x2d3447);
        const sunsetBottom = new THREE.Color(0xff512f);
        const nightTop = new THREE.Color(0x020408);
        const nightBottom = new THREE.Color(0x0a1a2a);
        const sunriseTop = new THREE.Color(0x4ca1af);
        const sunriseBottom = new THREE.Color(0xc4e0e5);

        let currentTop = new THREE.Color();
        let currentBottom = new THREE.Color();
        let sunIntensity = 0;
        let starOpacity = 0;
        let fogDensity = 0.005;

        // Simplified cycle for robustness
        if (cycle < 0.2) { // Sunrise
            const alpha = cycle / 0.2;
            currentTop.lerpColors(nightTop, sunriseTop, alpha).lerp(noonTop, alpha * 0.5);
            currentBottom.lerpColors(nightBottom, sunriseBottom, alpha).lerp(noonBottom, alpha * 0.5);
            sunIntensity = alpha * 1.5;
            starOpacity = 1 - alpha;
        } else if (cycle < 0.45) { // Day
            currentTop.copy(noonTop); currentBottom.copy(noonBottom); sunIntensity = 1.5; starOpacity = 0;
        } else if (cycle < 0.55) { // Sunset
            const alpha = (cycle - 0.45) / 0.1;
            currentTop.lerpColors(noonTop, sunsetTop, alpha); currentBottom.lerpColors(noonBottom, sunsetBottom, alpha);
            sunIntensity = (1 - alpha) * 1.5; starOpacity = alpha * 0.5;
        } else if (cycle < 0.9) { // Night
            currentTop.copy(nightTop); currentBottom.copy(nightBottom); sunIntensity = 0; starOpacity = 1;
        } else { // Pre-dawn
            currentTop.copy(nightTop); currentBottom.copy(nightBottom);
            starOpacity = 1; sunIntensity = 0;
        }

        this.skyUniforms.uTopColor.value.copy(currentTop);
        this.skyUniforms.uBottomColor.value.copy(currentBottom);
        this.skyUniforms.uTime.value += 0.005;

        if (this.scene.fog) {
            this.scene.fog.color.copy(currentBottom);
            this.scene.fog.density = fogDensity;
        }
        this.sunLight.intensity = sunIntensity;
        this.stars.material.opacity = starOpacity;

        this.ambientLight.intensity = 0.3 + (sunIntensity / 1.5) * 0.5;
        this.ambientLight.color.lerpColors(new THREE.Color(0x0a220a), currentBottom, 0.4);
    }

    updateWind() {
        this.wind.time += 0.01;
        const cycle = Date.now() * 0.0001;
        this.wind.strength = 0.5 + Math.sin(cycle) * 0.2 + Math.sin(cycle * 3.5) * 0.1;
        const angle = Math.sin(cycle * 0.5) * 0.5;
        this.wind.direction.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
    }

    updateTrees() {
        this.grassMaterial.uniforms.uTime.value = this.wind.time;
        this.grassMaterial.uniforms.uWindStrength.value = this.wind.strength;
        this.grassMaterial.uniforms.uWindDirection.value.copy(this.wind.direction);

        for (const chunk of this.activeChunks.values()) {
            const chunkWorldPos = chunk.position;
            chunk.traverse((child) => {
                if (child.userData.isTree) {
                    const wx = chunkWorldPos.x + child.position.x;
                    const wz = chunkWorldPos.z + child.position.z;
                    const wave = Math.sin(this.wind.time + wx * 0.05 + wz * 0.05);
                    const lean = this.wind.strength * 0.1 * (0.5 + 0.5 * wave);
                    const windDir = this.wind.direction;
                    child.rotation.x = windDir.z * lean;
                    child.rotation.z = -windDir.x * lean;
                }
            });
        }
    }

    updateWorldChunks() {
        const playerCX = Math.round(this.camera.position.x / this.CHUNK_SIZE);
        const playerCZ = Math.round(this.camera.position.z / this.CHUNK_SIZE);
        const neededChunks = new Set();
        for (let x = -this.PRELOAD_RADIUS; x <= this.PRELOAD_RADIUS; x++) {
            for (let z = -this.PRELOAD_RADIUS; z <= this.PRELOAD_RADIUS; z++) {
                neededChunks.add(getChunkKey(playerCX + x, playerCZ + z));
            }
        }
        for (const [key, group] of this.activeChunks) {
            if (!neededChunks.has(key)) {
                this.world.remove(group);
                this.activeChunks.delete(key);
            }
        }
        for (const key of neededChunks) {
            if (!this.activeChunks.has(key)) {
                const [cx, cz] = key.split(':').map(Number);
                this.activeChunks.set(key, this.createChunk(cx, cz));
            }
        }
    }

    
    generate() {
        this.world.clear();
        this.activeChunks.clear();

        this.world.add(this.sunGroup);
        this.world.add(this.moonGroup);

       
        this.world.add(createCentralStatue());

        this.updateWorldChunks();
    }
}
