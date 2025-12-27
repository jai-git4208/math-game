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

function createGrass() {
    const grassCount = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    for (let i = 0; i < grassCount; i++) {
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        const h = 0.15 + Math.random() * 0.4;
        positions.push(x, 0, z, x + (Math.random() - 0.5) * 0.2, h, z + (Math.random() - 0.5) * 0.2);

        const shade = 0.4 + Math.random() * 0.4;
        colors.push(0.1 * shade, 0.8 * shade, 0.2 * shade, 0.1 * shade, 0.8 * shade, 0.2 * shade);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7 }));
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

    himmel.position.set(0, 2.5, -1.5);
    statueGroup.add(himmel);

    // --- Frieren (Elf) - Far Left ---
    const frieren = new THREE.Group();
    const fHead = new THREE.Group();
    fHead.add(createStyledMesh(new THREE.SphereGeometry(0.32, 16, 16), lightStone));
    addFaceFeatures(fHead, 'elf');
    // Twin Tails (Longer)
    const tailPathL = [new THREE.Vector3(-0.2, 0.2, -0.1), new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(-0.7, -1.2, 0.1)];
    const tailPathR = [new THREE.Vector3(0.2, 0.2, -0.1), new THREE.Vector3(0.5, 0, 0), new THREE.Vector3(0.7, -1.2, 0.1)];
    fHead.add(createCurveMesh(tailPathL, lightStone));
    fHead.add(createCurveMesh(tailPathR, lightStone));
    fHead.position.y = 2.0; // Taller
    frieren.add(fHead);

    // Dress (Lathe) - Taller
    const dressPts = [new THREE.Vector2(0.2, 2.0), new THREE.Vector2(0.35, 1.2), new THREE.Vector2(0.65, 0)];
    const dress = createLathe(dressPts, stoneColor);
    frieren.add(dress);

    // Improved Staff
    const staff = new THREE.Group();
    staff.add(createStyledMesh(new THREE.CylinderGeometry(0.05, 0.05, 5.0), darkStone)); // Longer staff
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

    frieren.position.set(-2.5, 2.5, 0.5);
    frieren.rotation.y = 0.4;
    statueGroup.add(frieren);

    // --- Heiter (Priest) - Far Right ---
    const heiter = new THREE.Group();
    const heHead = new THREE.Group();
    heHead.add(createStyledMesh(new THREE.SphereGeometry(0.35, 16, 16), lightStone));
    addFaceFeatures(heHead);
    heHead.position.y = 2.2; // Taller
    heiter.add(heHead);

    // Robes - Taller
    const robePts = [new THREE.Vector2(0.35, 2.2), new THREE.Vector2(0.5, 1.2), new THREE.Vector2(0.6, 0)];
    const robes = createLathe(robePts, stoneColor);
    heiter.add(robes);

    // Stole - Longer
    const stolePath = [new THREE.Vector3(-0.35, 2.1, 0.1), new THREE.Vector3(0, 1.9, 0.3), new THREE.Vector3(0.35, 2.1, 0.1)];
    heiter.add(createCurveMesh(stolePath, darkStone));

    // Holy Staff
    const hStaff = new THREE.Group();
    hStaff.add(createStyledMesh(new THREE.CylinderGeometry(0.06, 0.06, 5.0), darkStone));
    hStaff.add(createStyledMesh(new THREE.SphereGeometry(0.2, 8, 8), lightStone)).position.y = 2.6;
    hStaff.position.set(0.6, 1.8, 0);
    heiter.add(hStaff);

    heiter.position.set(2.5, 2.5, 0.5);
    heiter.rotation.y = -0.4;
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
    eHead.position.y = 1.4; // Slightly taller (Dwarves are sturdy but short, but let's give him a bit)
    eisen.add(eHead);

    // Body
    const armor = createStyledMesh(new THREE.CylinderGeometry(0.65, 0.7, 1.5, 8), darkStone); // Taller armor
    armor.position.y = 0.75;
    eisen.add(armor);

    // Axe
    const axe = new THREE.Group();
    axe.add(createStyledMesh(new THREE.CylinderGeometry(0.12, 0.12, 3), darkStone));
    const axeBlade = createStyledMesh(new THREE.BoxGeometry(1.3, 0.9, 0.12), lightStone);
    axeBlade.position.y = 1;
    axe.add(axeBlade);
    axe.rotation.set(0.2, 0.2, 0.2);
    axe.position.set(-0.9, 1.0, 0.4);
    eisen.add(axe);

    eisen.position.set(-0.8, 2.5, 2.0);
    eisen.rotation.y = 0.2;
    statueGroup.add(eisen);

    statueGroup.position.set(0, 0, 40);
    return statueGroup;
}

function updateAtmosphere() {
    const cycle = (Date.now() % dayDuration) / dayDuration;
    const angle = cycle * Math.PI * 2 - Math.PI / 2;
    const radius = 300;

    sunGroup.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -100);
    sunLight.position.copy(sunGroup.position);

    moonGroup.position.set(Math.cos(angle + Math.PI) * radius, Math.sin(angle + Math.PI) * radius, -100);
    moonLight.position.copy(moonGroup.position);

    const noonColor = new THREE.Color(0x87ceeb); // Clear sky blue
    const sunsetColor = new THREE.Color(0xff7f50); // Coral/Orange
    const nightColor = new THREE.Color(0x050510); // Very dark blue/black
    const sunriseColor = new THREE.Color(0xffa07a); // Light salmon

    let currentSky = new THREE.Color();
    let sunIntensity = 0;
    let moonIntensity = 0;
    let starOpacity = 0;

    if (cycle < 0.2) { // Sunrise
        const alpha = cycle / 0.2;
        currentSky.lerpColors(sunriseColor, noonColor, alpha);
        sunIntensity = alpha * 1.5;
        starOpacity = (1 - alpha);
    } else if (cycle < 0.45) { // Day
        currentSky.copy(noonColor);
        sunIntensity = 1.5;
        starOpacity = 0;
    } else if (cycle < 0.55) { // Sunset
        const alpha = (cycle - 0.45) / 0.1;
        currentSky.lerpColors(noonColor, sunsetColor, alpha);
        sunIntensity = (1 - alpha) * 1.5;
        starOpacity = alpha * 0.5;
    } else if (cycle < 0.7) { // Evening Dusk
        const alpha = (cycle - 0.55) / 0.15;
        currentSky.lerpColors(sunsetColor, nightColor, alpha);
        sunIntensity = 0;
        starOpacity = 0.5 + alpha * 0.5;
        moonIntensity = alpha * 0.5;
    } else if (cycle < 0.9) { // Night
        currentSky.copy(nightColor);
        moonIntensity = 0.5;
        starOpacity = 1.0;
    } else { // Pre-dawn
        const alpha = (cycle - 0.9) / 0.1;
        currentSky.lerpColors(nightColor, sunriseColor, alpha);
        moonIntensity = (1 - alpha) * 0.5;
        starOpacity = (1 - alpha);
    }

    scene.background = currentSky;
    if (scene.fog) {
        scene.fog.color.copy(currentSky);
        scene.fog.density = 0.005 + (1 - sunIntensity / 1.5) * 0.01;
    }

    sunLight.intensity = sunIntensity;
    moonLight.intensity = moonIntensity;
    stars.material.opacity = starOpacity;

    ambientLight.intensity = 0.2 + (sunIntensity / 1.5) * 0.5;
    ambientLight.color.lerpColors(new THREE.Color(0x111122), currentSky, 0.4);

    // Update Clock
    const totalMinutes = cycle * 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    clockElement.innerText = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function generateEnvironment() {
    world.clear();
    const config = pages[currentPage];

    world.add(sunGroup);
    world.add(moonGroup);
    world.add(createGrass());

    world.add(createCentralStatue());

    for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 15 + Math.random() * 85;
        world.add(createRock(Math.cos(a) * r, Math.sin(a) * r, 0.5 + Math.random() * 1.5));
    }

    for (let i = 0; i < 35; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 20 + Math.random() * 80;
        world.add(createTree(Math.cos(a) * r, Math.sin(a) * r, 5 + Math.random() * 4));
    }

    if (config.bg === 'party_heroes') {
        const monolith = createStyledMesh(new THREE.BoxGeometry(4, 10, 4), 0xffffff, 0.9, false);
        monolith.position.set(0, 5, 30);
        world.add(monolith);
    } else if (config.bg.includes('statue')) {
        // Placeholder or specific statue adjustments can go here
    }
}

generateEnvironment();
camera.position.set(0, 1.6, 0);

const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') nextPage();
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#story-box')) return;
    nextPage();
});

function nextPage() {
    currentPage = (currentPage + 1) % pages.length;
    storyTextElement.innerText = pages[currentPage].text;
    generateEnvironment();
}

const speed = 0.2;
const turnSpeed = 0.03;

function update() {
    if (keys['KeyA']) camera.rotation.y += turnSpeed;
    if (keys['KeyD']) camera.rotation.y -= turnSpeed;
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    fwd.y = 0; fwd.normalize();
    const rgt = new THREE.Vector3().crossVectors(camera.up, fwd).normalize();
    if (keys['KeyW']) camera.position.addScaledVector(fwd, speed);
    if (keys['KeyS']) camera.position.addScaledVector(fwd, -speed);
    if (keys['KeyQ']) camera.position.addScaledVector(rgt, speed);
    if (keys['KeyE']) camera.position.addScaledVector(rgt, -speed);
    const moving = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] || keys['KeyQ'] || keys['KeyE'];
    camera.position.y = moving ? 1.6 + Math.sin(Date.now() * 0.01) * 0.06 : THREE.MathUtils.lerp(camera.position.y, 1.6, 0.1);
}

function animate() {
    requestAnimationFrame(animate);
    updateAtmosphere();
    update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
