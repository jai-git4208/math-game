import * as THREE from 'three';

const pages = [
    { text: "Long ago, a party of heroes saved the world.", bg: "party_heroes" },
    { text: "The demon king fell. People celebrated.", bg: "party_victory" },
    { text: "Songs were sung very loudly.", bg: "party_songs" },
    { text: "Statues were carved in places no one visits anymore.", bg: "statue_abandoned" },
    { text: "Then time moved on. Like it always does.", bg: "time_pass" },
    { text: "You are Aeris, an elf mage.", bg: "travel_elf" },
    { text: "You age slowly... until everyone you know doesn’t.", bg: "time_age" },
    { text: "Centuries pass like badly written diary pages.", bg: "time_diary" },
    { text: "You also don’t travel alone anymore.", bg: "travel_companion" },
    { text: "At some point, you picked up a small companion.", bg: "travel_companion" },
    { text: "They’re cheerful. A little stupid. Kind of a cupcake of a person.", bg: "travel_cupcake" },
    { text: "The world is peaceful. Too peaceful.", bg: "time_peace" }
];

let currentPage = 0;
const storyTextElement = document.getElementById('story-text');

// Add Clock Element
const clockElement = document.createElement('div');
clockElement.id = 'game-clock';
clockElement.style.cssText = `
    position: absolute;
    top: 30px;
    right: 30px;
    font-size: 20px;
    font-weight: 600;
    color: white;
    background: rgba(0, 0, 0, 0.4);
    padding: 10px 20px;
    border-radius: 50px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    letter-spacing: 1px;
    pointer-events: none;
`;
document.body.appendChild(clockElement);

// Time System
const dayDuration = 3600000; // 1 hour for a full day cycle
const timeScale = 24; // 1 hour real-world = 1 day in-game (1:24)

// Three.js Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Global Lighting
const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.castShadow = true;
scene.add(sunLight);

const moonLight = new THREE.DirectionalLight(0xaaaaff, 0.4);
scene.add(moonLight);

// Elements Group
const world = new THREE.Group();
scene.add(world);

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



function createRock(x, z, s) {
    const geo = new THREE.DodecahedronGeometry(s, 0);
    const rock = createStyledMesh(geo, 0x666666, 1, false);
    rock.position.set(x, s * 0.4, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.scale.set(1, 0.6 + Math.random() * 0.4, 1);
    return rock;
}

const sunGroup = new THREE.Group();
const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffaa }));
const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(12, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3 }));
sunGroup.add(sunMesh, sunGlow);

const moonGroup = new THREE.Group();
const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 16), new THREE.MeshBasicMaterial({ color: 0xeeeeff }));
const moonGlow = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xaaaaff, transparent: true, opacity: 0.2 }));
moonGroup.add(moonMesh, moonGlow);

function createStars() {
    const starCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const sizes = [];
    for (let i = 0; i < starCount; i++) {
        const x = (Math.random() - 0.5) * 1000;
        const y = Math.random() * 500; // Night sky is up
        const z = (Math.random() - 0.5) * 1000;
        positions.push(x, y, z);
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

const stars = createStars();
scene.add(stars);

function createGround() {
    const geometry = new THREE.PlaneGeometry(1000, 1000);
    const material = new THREE.MeshPhongMaterial({
        color: 0x112211,
        specular: 0x050505,
        shininess: 10,
        flatShading: true
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    return ground;
}

const ground = createGround();
scene.add(ground);

function createTree(x, z, h) {
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

function createCentralStatue() {
    const statueGroup = new THREE.Group();
    const stoneColor = 0x888888;
    const lightStone = 0xaaaaaa;
    const darkStone = 0x555555;
    const mossColor = 0x224422;

    // --- Helpers ---
    function createCurveMesh(points, color) {
        const path = new THREE.CatmullRomCurve3(points);
        const geo = new THREE.TubeGeometry(path, 8, 0.1, 8, false);
        return createStyledMesh(geo, color);
    }

    function createLathe(points, color, segments = 16) {
        const geo = new THREE.LatheGeometry(points, segments);
        return createStyledMesh(geo, color);
    }

    function addFaceFeatures(headGroup, type = 'human') {
        const eyeColor = 0x333333;
        // Eyes
        const eyeGeo = new THREE.CapsuleGeometry(0.04, 0.08, 4, 8);
        const lEye = createStyledMesh(eyeGeo, eyeColor);
        lEye.position.set(-0.12, 0.05, 0.3);
        lEye.rotation.z = Math.PI / 2;
        const rEye = createStyledMesh(eyeGeo, eyeColor);
        rEye.position.set(0.12, 0.05, 0.3);
        rEye.rotation.z = Math.PI / 2;
        headGroup.add(lEye, rEye);

        // Brows
        const browGeo = new THREE.BoxGeometry(0.12, 0.02, 0.05);
        const lBrow = createStyledMesh(browGeo, stoneColor);
        lBrow.position.set(-0.12, 0.12, 0.32);
        lBrow.rotation.z = 0.1;
        const rBrow = createStyledMesh(browGeo, stoneColor);
        rBrow.position.set(0.12, 0.12, 0.32);
        rBrow.rotation.z = -0.1;
        headGroup.add(lBrow, rBrow);

        // Nose
        if (type !== 'dwarf') {
            const nose = createStyledMesh(new THREE.ConeGeometry(0.04, 0.1, 4), stoneColor);
            nose.position.set(0, 0, 0.35);
            nose.rotation.x = -0.2;
            headGroup.add(nose);
        }
    }

    // --- Base ---
    const base = createStyledMesh(new THREE.CylinderGeometry(8, 9, 1.5, 16), darkStone);
    const mid = createStyledMesh(new THREE.CylinderGeometry(7, 7.5, 1, 16), stoneColor);
    mid.position.y = 1.25;
    const top = createStyledMesh(new THREE.CylinderGeometry(6.5, 7, 0.8, 16), lightStone);
    top.position.y = 2.15;
    statueGroup.add(base, mid, top);

    // Moss
    for (let i = 0; i < 15; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 6.0 + Math.random() * 2.5;
        const moss = createStyledMesh(new THREE.DodecahedronGeometry(0.3, 0), mossColor);
        moss.position.set(Math.cos(a) * r, 0.8 + Math.random() * 1, Math.sin(a) * r);
        statueGroup.add(moss);
    }

    // --- Himmel (Hero) - Center Back ---
    const himmel = new THREE.Group();
    // Head
    const hHead = new THREE.Group();
    hHead.add(createStyledMesh(new THREE.SphereGeometry(0.35, 16, 16), lightStone));
    addFaceFeatures(hHead);
    const bangPath = [new THREE.Vector3(-0.3, 0.3, 0), new THREE.Vector3(-0.25, 0.1, 0.3), new THREE.Vector3(0, 0.2, -0.1)];
    hHead.add(createCurveMesh(bangPath, lightStone));
    hHead.position.y = 2.3; // Taller
    himmel.add(hHead);

    // Body (Coat) - Stretched
    const coatPts = [];
    for (let i = 0; i <= 10; i++) {
        coatPts.push(new THREE.Vector2(0.3 + i * 0.05, i * 0.22)); // Taller segments
    }
    const coat = createLathe(coatPts, stoneColor);
    coat.rotation.x = Math.PI;
    coat.position.y = 2.2;
    himmel.add(coat);

    // Cape flow - Adjusted
    const capePath = [new THREE.Vector3(0, 2.1, -0.2), new THREE.Vector3(0.1, 1.2, -0.8), new THREE.Vector3(0.4, 0.2, -1.0)];
    const cape = createStyledMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(capePath), 8, 0.4, 8, false), darkStone);
    himmel.add(cape);

    // Sword (Detailed)
    const sword = new THREE.Group();
    const blade = createStyledMesh(new THREE.BoxGeometry(0.08, 2.8, 0.15), lightStone); // Longer blade
    const guard = createStyledMesh(new THREE.CylinderGeometry(0.3, 0.05, 0.1, 4), darkStone);
    guard.rotation.z = Math.PI / 2;
    guard.position.y = -1.4;
    const pommel = createStyledMesh(new THREE.SphereGeometry(0.1), darkStone);
    pommel.position.y = -1.8;
    sword.add(blade, guard, pommel);
    sword.position.set(0.9, 3.2, 0.4);
    sword.rotation.set(-0.2, 0.2, -0.4);
    himmel.add(sword);

    himmel.position.set(0, 2.5, 1.2);
    himmel.scale.set(1.4, 1.4, 1.4);
    statueGroup.add(himmel);

    // --- Frieren (Elfie) - Left ---
    const frieren = new THREE.Group();
    const fHead = new THREE.Group();
    fHead.add(createStyledMesh(new THREE.SphereGeometry(0.32, 16, 16), lightStone));
    addFaceFeatures(fHead, 'elf');
    // Twin Tails (Longer)
    const tailPathL = [new THREE.Vector3(-0.2, 0.2, -0.1), new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(-0.7, -1.2, 0.1)];
    const tailPathR = [new THREE.Vector3(0.2, 0.2, -0.1), new THREE.Vector3(0.5, 0, 0), new THREE.Vector3(0.7, -1.2, 0.1)];
    fHead.add(createCurveMesh(tailPathL, lightStone));
    fHead.add(createCurveMesh(tailPathR, lightStone));
    fHead.position.y = 2.0;
    frieren.add(fHead);

    // Dress (Lathe)
    const dressPts = [new THREE.Vector2(0.2, 2.0), new THREE.Vector2(0.35, 1.2), new THREE.Vector2(0.65, 0)];
    const dress = createLathe(dressPts, stoneColor);
    frieren.add(dress);

    // Staff
    const staff = new THREE.Group();
    staff.add(createStyledMesh(new THREE.CylinderGeometry(0.05, 0.05, 5.0), darkStone));
    const cresGeo = new THREE.TorusGeometry(0.4, 0.06, 8, 32, Math.PI * 1.3);
    const cres = createStyledMesh(cresGeo, 0xffeeaa);
    cres.position.y = 2.5;
    cres.rotation.z = Math.PI / 1.5;
    const gem = createStyledMesh(new THREE.OctahedronGeometry(0.15), 0xff3333, 0.9);
    gem.position.set(0, 2.5, 0);
    staff.add(cres, gem);

    staff.position.set(0.7, 1.8, 0.5);
    staff.rotation.z = 0.1;
    frieren.add(staff);

    frieren.position.set(-1.8, 2.5, 1.2);
    frieren.rotation.y = 0.2;
    frieren.scale.set(1.4, 1.4, 1.4);
    statueGroup.add(frieren);

    // --- Heiter (Priest) - Right ---
    const heiter = new THREE.Group();
    const heHead = new THREE.Group();
    heHead.add(createStyledMesh(new THREE.SphereGeometry(0.35, 16, 16), lightStone));
    addFaceFeatures(heHead);
    heHead.position.y = 2.2;
    heiter.add(heHead);

    // Robes
    const robePts = [new THREE.Vector2(0.35, 2.2), new THREE.Vector2(0.5, 1.2), new THREE.Vector2(0.6, 0)];
    const robes = createLathe(robePts, stoneColor);
    heiter.add(robes);

    // Stole
    const stolePath = [new THREE.Vector3(-0.35, 2.1, 0.1), new THREE.Vector3(0, 1.9, 0.3), new THREE.Vector3(0.35, 2.1, 0.1)];
    heiter.add(createCurveMesh(stolePath, darkStone));

    // Holy Staff
    const hStaff = new THREE.Group();
    hStaff.add(createStyledMesh(new THREE.CylinderGeometry(0.06, 0.06, 5.0), darkStone));
    hStaff.add(createStyledMesh(new THREE.SphereGeometry(0.2, 8, 8), lightStone)).position.y = 2.6;
    hStaff.position.set(0.6, 1.8, 0);
    heiter.add(hStaff);

    heiter.position.set(1.8, 2.5, 1.2);
    heiter.rotation.y = -0.2;
    heiter.scale.set(1.4, 1.4, 1.4);
    statueGroup.add(heiter);

    // --- Eisen (Dwarf) - Front Center Offset ---
    const eisen = new THREE.Group();
    const eHead = new THREE.Group();
    eHead.add(createStyledMesh(new THREE.SphereGeometry(0.42, 16, 16), darkStone));
    addFaceFeatures(eHead, 'dwarf');

    const hornL = createStyledMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.35, 0.2, 0), new THREE.Vector3(-0.65, 0.6, 0.1)]), 4, 0.08, 8), lightStone);
    const hornR = createStyledMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.35, 0.2, 0), new THREE.Vector3(0.65, 0.6, 0.1)]), 4, 0.08, 8), lightStone);
    eHead.add(hornL, hornR);

    // Beard
    const beardC = createStyledMesh(new THREE.ConeGeometry(0.25, 0.7, 16), lightStone);
    beardC.position.set(0, -0.45, 0.35);
    beardC.rotation.x = -0.3;
    eHead.add(beardC);
    eHead.position.y = 1.4;
    eisen.add(eHead);

    // Body
    const armor = createStyledMesh(new THREE.CylinderGeometry(0.65, 0.7, 1.5, 8), darkStone);
    armor.position.y = 0.75;
    eisen.add(armor);

    // Axe
    const axe = new THREE.Group();
    axe.add(createStyledMesh(new THREE.CylinderGeometry(0.12, 0.12, 3), darkStone));
    const axeBlade = createStyledMesh(new THREE.BoxGeometry(1.3, 0.9, 0.12), lightStone);
    axeBlade.position.y = 1;
    axe.add(axeBlade);
    axe.rotation.set(0.2, 0.2, 0.2);
    axe.position.set(0.9, 1.0, 0.4);
    eisen.add(axe);

    eisen.position.set(-0.9, 2.5, 2.0);
    eisen.rotation.y = 0.2;
    eisen.scale.set(1.4, 1.4, 1.4);
    statueGroup.add(eisen);

    statueGroup.position.set(0, 0, 40);
    return statueGroup;
}

// Sky Shader
const skyVertexShader = `
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Simple noise function for clouds
const skyFragmentShader = `
uniform vec3 uTopColor;
uniform vec3 uBottomColor;
uniform float uTime;
uniform float uCloudDensity;
uniform vec3 uCloudColor;

varying vec3 vWorldPosition;
varying vec2 vUv;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
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
    // Gradient
    vec3 skyColor = mix(uBottomColor, uTopColor, max(h, 0.0));

    // Clouds
    // Map the sky dome to a plane for noise
    vec2 cloudUV = vWorldPosition.xz * 0.001; 
    float speed = 0.05;
    float time = uTime * speed;
    
    // Multiple octaves for detail
    float n1 = snoise(cloudUV * 3.0 + vec2(time, time * 0.5));
    float n2 = snoise(cloudUV * 6.0 - vec2(time * 0.5, 0.0));
    float noise = n1 * 0.5 + n2 * 0.25;

    // Cloud mask
    // Only appear higher up
    float cloudMask = smoothstep(0.2, 0.6, h);
    float cloud = smoothstep(0.1, 0.8, noise + uCloudDensity) * cloudMask;

    gl_FragColor = vec4(mix(skyColor, uCloudColor, cloud), 1.0);
}
`;

const skyUniforms = {
    uTopColor: { value: new THREE.Color(0x0077ff) },
    uBottomColor: { value: new THREE.Color(0xffffff) },
    uTime: { value: 0 },
    uCloudDensity: { value: 0.0 }, // -1 to 1 effectively
    uCloudColor: { value: new THREE.Color(0xffffff) }
};

const skyGeo = new THREE.SphereGeometry(900, 32, 16);
const skyMat = new THREE.ShaderMaterial({
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    uniforms: skyUniforms,
    side: THREE.BackSide
});

const skyMesh = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyMesh);

function updateAtmosphere() {
    const cycle = (Date.now() % dayDuration) / dayDuration;
    const angle = cycle * Math.PI * 2 - Math.PI / 2;
    const radius = 300;

    sunGroup.position.set(camera.position.x + Math.cos(angle) * radius, Math.sin(angle) * radius, camera.position.z - 100);
    sunLight.position.copy(sunGroup.position);

    moonGroup.position.set(camera.position.x + Math.cos(angle + Math.PI) * radius, Math.sin(angle + Math.PI) * radius, camera.position.z - 100);
    moonLight.position.copy(moonGroup.position);

    // Color Definitions
    const noonTop = new THREE.Color(0x3a7bd5);
    const noonBottom = new THREE.Color(0x87ceeb); // Light blue horizon

    const sunsetTop = new THREE.Color(0x2d3447);
    const sunsetBottom = new THREE.Color(0xff512f); // Orange/Red horizon

    const nightTop = new THREE.Color(0x020408);
    const nightBottom = new THREE.Color(0x0a1a2a); // Deep blue/black

    const sunriseTop = new THREE.Color(0x4ca1af);
    const sunriseBottom = new THREE.Color(0xc4e0e5); // Misty sunrise

    let currentTop = new THREE.Color();
    let currentBottom = new THREE.Color();

    let sunIntensity = 0;
    let moonIntensity = 0;
    let starOpacity = 0;
    let cloudDensity = 0;
    let cloudColor = new THREE.Color(0xffffff);
    let fogDensity = 0.005;

    // Cycle Logic
    if (cycle < 0.2) { // Sunrise
        const alpha = cycle / 0.2;
        currentTop.lerpColors(nightTop, sunriseTop, alpha);
        currentBottom.lerpColors(nightBottom, sunriseBottom, alpha);
        currentTop.lerp(noonTop, alpha * 0.5); // Transition to day slowly
        currentBottom.lerp(noonBottom, alpha * 0.5);

        sunIntensity = alpha * 1.5;
        starOpacity = (1 - alpha);
        cloudDensity = -0.2; // Less clouds
        cloudColor.setHex(0xffcccc); // Pinkish clouds
    } else if (cycle < 0.45) { // Day
        currentTop.copy(noonTop);
        currentBottom.copy(noonBottom);
        sunIntensity = 1.5;
        starOpacity = 0;
        cloudDensity = 0.1; // Fluffy
        cloudColor.setHex(0xffffff);
    } else if (cycle < 0.55) { // Sunset
        const alpha = (cycle - 0.45) / 0.1;
        currentTop.lerpColors(noonTop, sunsetTop, alpha);
        currentBottom.lerpColors(noonBottom, sunsetBottom, alpha);

        sunIntensity = (1 - alpha) * 1.5;
        starOpacity = alpha * 0.5;
        cloudDensity = 0.2;
        cloudColor.setHex(0xffaa88); // Orange clouds
        fogDensity = 0.007;
    } else if (cycle < 0.7) { // Evening Dusk
        const alpha = (cycle - 0.55) / 0.15;
        currentTop.lerpColors(sunsetTop, nightTop, alpha);
        currentBottom.lerpColors(sunsetBottom, nightBottom, alpha);

        sunIntensity = 0;
        starOpacity = 0.5 + alpha * 0.5;
        moonIntensity = alpha * 0.5;
        cloudDensity = -0.1;
        cloudColor.setHex(0x333344); // Dark clouds
        fogDensity = 0.01;
    } else if (cycle < 0.9) { // Night
        currentTop.copy(nightTop);
        currentBottom.copy(nightBottom);
        moonIntensity = 0.5;
        starOpacity = 1.0;
        cloudDensity = -0.3; // Sparse
        cloudColor.setHex(0x111122);
    } else { // Pre-dawn
        const alpha = (cycle - 0.9) / 0.1;
        currentTop.lerpColors(nightTop, sunriseTop, alpha); // Actually wrap to night->sunrise
        // Fix wrap logic: Pre-dawn is Night -> Sunrise
        // Currently 'sunrise' block assumes start from night.
        // Let's just lerp to a pre-sunrise state
        currentTop.lerpColors(nightTop, nightTop, alpha); // Stay dark mostly
        currentBottom.lerpColors(nightBottom, new THREE.Color(0x222233), alpha);

        moonIntensity = (1 - alpha) * 0.5;
        starOpacity = (1 - alpha);
        cloudDensity = -0.2;
        cloudColor.setHex(0x222233);
    }

    skyUniforms.uTopColor.value.copy(currentTop);
    skyUniforms.uBottomColor.value.copy(currentBottom);
    skyUniforms.uTime.value += 0.005; // Move time uniform
    skyUniforms.uCloudDensity.value = cloudDensity;
    skyUniforms.uCloudColor.value.copy(cloudColor);

    // Sync Fog
    if (scene.fog) {
        scene.fog.color.copy(currentBottom);
        scene.fog.density = fogDensity;
    }

    sunLight.intensity = sunIntensity;
    moonLight.intensity = moonIntensity;
    stars.material.opacity = starOpacity;

    // Position sky with camera so it feels infinite
    skyMesh.position.copy(camera.position);

    ambientLight.intensity = 0.3 + (sunIntensity / 1.5) * 0.5;
    ambientLight.color.lerpColors(new THREE.Color(0x0a220a), currentBottom, 0.4);

    // Update Clock
    const totalMinutes = cycle * 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    clockElement.innerText = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

const CHUNK_SIZE = 60;
const PRELOAD_RADIUS = 2; // In chunks (2 = 5x5 grid)
const activeChunks = new Map();

// Helper to get consistent random numbers for a chunk
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getChunkKey(cx, cz) {
    return `${cx}:${cz}`;
}

// Wind System
const wind = {
    direction: new THREE.Vector3(1, 0, 1).normalize(),
    strength: 0,
    time: 0
};

function updateWind() {
    wind.time += 0.01;
    // Varies per day cycle or just slowly over time
    // Simple noise-like variation
    const cycle = Date.now() * 0.0001;
    wind.strength = 0.5 + Math.sin(cycle) * 0.2 + Math.sin(cycle * 3.5) * 0.1;

    // Slowly rotate wind direction
    const angle = Math.sin(cycle * 0.5) * 0.5;
    wind.direction.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
}

// Grass Shader
const grassVertexShader = `
uniform float uTime;
uniform float uWindStrength;
uniform vec3 uWindDirection;
attribute vec3 color;
varying vec3 vColor;

void main() {
    vColor = color;
    vec3 pos = position;

    // Wind Sway Logic
    // Only sway if height > 0 (tips of grass)
    // Non-linear sway based on height
    float heightFactor = pos.y * pos.y; // Curve the grass
    
    // Wave offset based on world position
    // We are in local chunk space, so we need to add modelMatrix position for world coherence
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    
    float wave = sin(uTime + worldPosition.x * 0.5 + worldPosition.z * 0.5);
    
    // Apply wind displacement
    pos.x += uWindDirection.x * uWindStrength * heightFactor * (0.5 + 0.5 * wave);
    pos.z += uWindDirection.z * uWindStrength * heightFactor * (0.5 + 0.5 * wave);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const grassFragmentShader = `
varying vec3 vColor;
void main() {
    gl_FragColor = vec4(vColor, 0.7); // 0.7 opacity
}
`;

const grassMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uWindStrength: { value: 0 },
        uWindDirection: { value: new THREE.Vector3(1, 0, 0) }
    },
    vertexShader: grassVertexShader,
    fragmentShader: grassFragmentShader,
    vertexColors: true,
    transparent: true
});

function createChunk(cx, cz) {
    const chunkGroup = new THREE.Group();
    const chunkSeed = cx * 1000 + cz; // Simple seed

    // Offset for this chunk in world space
    const offsetX = cx * CHUNK_SIZE;
    const offsetZ = cz * CHUNK_SIZE;
    chunkGroup.position.set(offsetX, 0, offsetZ); // Move group to chunk position

    // Create Grass for this chunk (Local logic)
    const grassGeo = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const grassCount = 400;

    for (let i = 0; i < grassCount; i++) {
        // Local position within chunk
        const lx = (seededRandom(chunkSeed + i) - 0.5) * CHUNK_SIZE;
        const lz = (seededRandom(chunkSeed + i + 10000) - 0.5) * CHUNK_SIZE;

        // Since we moved the group, generate relative to (0,0,0) of the group

        const h = 0.15 + seededRandom(chunkSeed + i * 2) * 0.4;

        // Add grass line segment
        // Tip of grass blade moves slightly
        const sway = (seededRandom(chunkSeed + i * 3) - 0.5) * 0.2;

        // Base and Tip (Local to chunk group)
        positions.push(lx, 0, lz);
        positions.push(lx + sway, h, lz + sway);

        const shade = 0.4 + seededRandom(chunkSeed + i * 5) * 0.4;
        colors.push(0.1 * shade, 0.8 * shade, 0.2 * shade, 0.1 * shade, 0.8 * shade, 0.2 * shade);
    }
    grassGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    grassGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Clone material so we don't need to? ACTUALLY share it for performance is better, 
    // but uniforms are global. Shared is GOOD.
    const grass = new THREE.LineSegments(grassGeo, grassMaterial);
    chunkGroup.add(grass);

    // Create Rocks (1-3 per chunk) T-T im crying
    const rockCount = Math.floor(seededRandom(chunkSeed) * 3) + 1;
    for (let i = 0; i < rockCount; i++) {
        const lx = (seededRandom(chunkSeed + i + 100) - 0.5) * CHUNK_SIZE;
        const lz = (seededRandom(chunkSeed + i + 200) - 0.5) * CHUNK_SIZE;
        const s = 0.5 + seededRandom(chunkSeed + i + 300) * 1.5;
        // Local position
        const rock = createRock(lx, lz, s); // Modified createRock to take just x,z
        chunkGroup.add(rock);
    }

    // Create Trees (1-3 per chunk)
    const treeCount = Math.floor(seededRandom(chunkSeed + 500) * 3) + 1;
    for (let i = 0; i < treeCount; i++) {
        const lx = (seededRandom(chunkSeed + i + 600) - 0.5) * CHUNK_SIZE;
        const lz = (seededRandom(chunkSeed + i + 700) - 0.5) * CHUNK_SIZE;
        const h = 5 + seededRandom(chunkSeed + i + 800) * 4;

        // Don't spawn trees too close to the statue in the center chunk
        // Use Global coordinates for check
        const wx = offsetX + lx;
        const wz = offsetZ + lz;
        if (Math.abs(wx) < 10 && Math.abs(wz - 40) < 10) continue;

        const tree = createTree(lx, lz, h); // Modified createTree to take just x,z
        tree.userData = {
            isTree: true,
            initialRot: tree.rotation.clone(),
            phaseOffset: Math.random() * 10
        };
        chunkGroup.add(tree);
    }

    world.add(chunkGroup);
    return chunkGroup;
}

// NOTE: createRock and createTree need slight adjustment because createChunk now uses localGroup
// Old createRock/Tree set position directly.
// Let's redefine createRock/Tree to imply local coords if used inside chunk

// ... (existing createRock and createTree are defined above globally, but implementation relied on args)
// We need to make sure createRock just sets .set(x, ..., z) which works for both world and local if parent is correct.
// The previous createChunk passed (offsetX + lx), which was World Space.
// NOW createChunk sets chunkGroup.position to Offset.
// So we should pass (lx, lz) to createRock/Tree. 
// I updated the calls in createChunk above. 

function updateTrees() {
    grassMaterial.uniforms.uTime.value = wind.time;
    grassMaterial.uniforms.uWindStrength.value = wind.strength;
    grassMaterial.uniforms.uWindDirection.value.copy(wind.direction);

    // Update Trees Sways
    // Loop through all active chunks
    for (const chunk of activeChunks.values()) {
        // chunk is a Group
        // World position of the chunk
        const chunkWorldPos = chunk.position; // (cx*size, 0, cz*size)

        chunk.traverse((child) => {
            if (child.userData.isTree) {
                // Determine world pos for coherence
                // child.position is local to chunk
                const wx = chunkWorldPos.x + child.position.x;
                const wz = chunkWorldPos.z + child.position.z;

                const wave = Math.sin(wind.time + wx * 0.05 + wz * 0.05);
                const lean = wind.strength * 0.1 * (0.5 + 0.5 * wave); // 0 to max lean

                // Apply rotation
                // Wind Direction -> Rotation Axis
                // Rot Axis is Perpendicular to Wind Dir
                // If Wind is (1,0,0) -> Axis is (0,0,1) (Z)
                // If Wind is (0,0,1) -> Axis is (-1,0,0) (-X)

                // Simplified: Just rotate mainly on X/Z based on direction
                // Or construct a target quaternion

                const windDir = wind.direction;
                // Target Rotation Euler
                // amount around X = wind.z * lean
                // amount around Z = -wind.x * lean

                child.rotation.x = windDir.z * lean;
                child.rotation.z = -windDir.x * lean;
            }
        });
    }
}

function updateWorldChunks() {
    const playerCX = Math.round(camera.position.x / CHUNK_SIZE);
    const playerCZ = Math.round(camera.position.z / CHUNK_SIZE);

    const neededChunks = new Set();
    for (let x = -PRELOAD_RADIUS; x <= PRELOAD_RADIUS; x++) {
        for (let z = -PRELOAD_RADIUS; z <= PRELOAD_RADIUS; z++) {
            neededChunks.add(getChunkKey(playerCX + x, playerCZ + z));
        }
    }

    for (const [key, group] of activeChunks) {
        if (!neededChunks.has(key)) {
            world.remove(group);
            // safe disposal if needed
            activeChunks.delete(key);
        }
    }

    for (const key of neededChunks) {
        if (!activeChunks.has(key)) {
            const [cx, cz] = key.split(':').map(Number);
            activeChunks.set(key, createChunk(cx, cz));
        }
    }
}

function generateEnvironment() {
    world.clear();
    activeChunks.clear();

    world.add(sunGroup);
    world.add(moonGroup);

    // Add persistent central statue
    world.add(createCentralStatue());

    updateWorldChunks();
}

generateEnvironment();
camera.position.set(0, 1.6, 0);

const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') nextPage();
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

// click now mainly handles Pointer Lock. 
// story progress is handled by SPACE key 
/*
window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#story-box')) return;
    if (document.pointerLockElement) {
        // if already locked, maybe shooting or interacting with objects
        // for now, do nothing or
        // nextPage(); 
    }
});
*/

function nextPage() {
    currentPage = (currentPage + 1) % pages.length;
    storyTextElement.innerText = pages[currentPage].text;
    generateEnvironment();
}

camera.rotation.order = 'YXZ';

// mouse Look Variables
let pitch = 0;
let yaw = 0;

document.addEventListener('click', () => {
    document.body.requestPointerLock();
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        //i have no idea why btu it will avoid flitching
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

        camera.rotation.x = pitch;
        camera.rotation.y = yaw;
    }
});

// a little physics
const velocity = new THREE.Vector3();
const maxSpeed = 0.15;
const acceleration = 0.015;
const deceleration = 0.01;
const swayAmount = 0.05;
const swaySpeed = 8;
let swayTime = 0;


function update() {
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();

    // Right / Left Direction
    const rgt = new THREE.Vector3();
    rgt.crossVectors(fwd, camera.up).normalize();

    // Input Vector
    const inputVector = new THREE.Vector3();
    if (keys['KeyW']) inputVector.add(fwd);
    if (keys['KeyS']) inputVector.sub(fwd);
    if (keys['KeyA']) inputVector.sub(rgt);
    if (keys['KeyD']) inputVector.add(rgt);

    // normalize input to prevent faster diagonal movement
    // But we want to keep the direction valid
    if (inputVector.lengthSq() > 0) {
        inputVector.normalize();

        // Acceleration: Move velocity towards target speed in input direction (increase velocity slowly slowly)
        const targetVelocity = inputVector.multiplyScalar(maxSpeed);
        velocity.lerp(targetVelocity, acceleration);
    } else {
        // Deceleration: Lerp velocity towards zero (feels like sliding)
        velocity.lerp(new THREE.Vector3(0, 0, 0), deceleration);
    }

    // Apply movement
    camera.position.add(velocity);


    const speedFraction = velocity.length() / maxSpeed;
    if (speedFraction > 0.1) {
        swayTime += 0.015 * swaySpeed;

        // Tilt (Roll) - leans into the turn slightly or rhythmic sway
        // Actually, simple sway based on strafing velocity is nice
        const strafeVelocity = velocity.dot(rgt); // how much we are moving sideways
        const targetRoll = -strafeVelocity * 0.5; //lean into movement

        // Bobbing (Y-axis)
        // Only bob if moving
        const bobOffset = Math.sin(swayTime) * 0.05 * speedFraction;
        camera.position.y = 1.6 + bobOffset;

        // Apply Roll to camera rotation (We need to be careful with coordinate systems)
        // Since im managing pitch manually in mousemove,i can just add a roll offset there or modify the up vector.
        // A simpler way for sway is just modifying z-rotation lightly :)
        camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, targetRoll, 0.1);

    } else {

        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.6, 0.1);
        camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, 0.1);
        swayTime = 0;
    }


    // Move infinite ground/stars with camera
    ground.position.x = camera.position.x;
    ground.position.z = camera.position.z;
    stars.position.x = camera.position.x;
    stars.position.z = camera.position.z;
}

function animate() {
    requestAnimationFrame(animate);
    updateAtmosphere();
    updateWind(); // NEW
    update();
    updateTrees(); // NEW
    updateWorldChunks();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
