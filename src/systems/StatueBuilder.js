import * as THREE from 'three';

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

export function createCentralStatue() {
    const statueGroup = new THREE.Group();
    const stoneColor = 0x888888;
    const lightStone = 0xaaaaaa;
    const darkStone = 0x555555;
    const mossColor = 0x224422;

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
        const eyeGeo = new THREE.CapsuleGeometry(0.04, 0.08, 4, 8);
        const lEye = createStyledMesh(eyeGeo, eyeColor);
        lEye.position.set(-0.12, 0.05, 0.3);
        lEye.rotation.z = Math.PI / 2;
        const rEye = createStyledMesh(eyeGeo, eyeColor);
        rEye.position.set(0.12, 0.05, 0.3);
        rEye.rotation.z = Math.PI / 2;
        headGroup.add(lEye, rEye);
        const browGeo = new THREE.BoxGeometry(0.12, 0.02, 0.05);
        const lBrow = createStyledMesh(browGeo, stoneColor);
        lBrow.position.set(-0.12, 0.12, 0.32);
        lBrow.rotation.z = 0.1;
        const rBrow = createStyledMesh(browGeo, stoneColor);
        rBrow.position.set(0.12, 0.12, 0.32);
        rBrow.rotation.z = -0.1;
        headGroup.add(lBrow, rBrow);
        if (type !== 'dwarf') {
            const nose = createStyledMesh(new THREE.ConeGeometry(0.04, 0.1, 4), stoneColor);
            nose.position.set(0, 0, 0.35);
            nose.rotation.x = -0.2;
            headGroup.add(nose);
        }
    }

    const base = createStyledMesh(new THREE.CylinderGeometry(8, 9, 1.5, 16), darkStone);
    const mid = createStyledMesh(new THREE.CylinderGeometry(7, 7.5, 1, 16), stoneColor);
    mid.position.y = 1.25;
    const top = createStyledMesh(new THREE.CylinderGeometry(6.5, 7, 0.8, 16), lightStone);
    top.position.y = 2.15;
    statueGroup.add(base, mid, top);

    for (let i = 0; i < 15; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 6.0 + Math.random() * 2.5;
        const moss = createStyledMesh(new THREE.DodecahedronGeometry(0.3, 0), mossColor);
        moss.position.set(Math.cos(a) * r, 0.8 + Math.random() * 1, Math.sin(a) * r);
        statueGroup.add(moss);
    }

    const himmel = new THREE.Group();
    const hHead = new THREE.Group();
    hHead.add(createStyledMesh(new THREE.SphereGeometry(0.35, 16, 16), lightStone));
    addFaceFeatures(hHead);
    const bangPath = [new THREE.Vector3(-0.3, 0.3, 0), new THREE.Vector3(-0.25, 0.1, 0.3), new THREE.Vector3(0, 0.2, -0.1)];
    hHead.add(createCurveMesh(bangPath, lightStone));
    hHead.position.y = 2.3;
    himmel.add(hHead);
    const coatPts = [];
    for (let i = 0; i <= 10; i++) coatPts.push(new THREE.Vector2(0.3 + i * 0.05, i * 0.22));
    const coat = createLathe(coatPts, stoneColor);
    coat.rotation.x = Math.PI;
    coat.position.y = 2.2;
    himmel.add(coat);
    const capePath = [new THREE.Vector3(0, 2.1, -0.2), new THREE.Vector3(0.1, 1.2, -0.8), new THREE.Vector3(0.4, 0.2, -1.0)];
    const cape = createStyledMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(capePath), 8, 0.4, 8, false), darkStone);
    himmel.add(cape);
    const sword = new THREE.Group();
    const blade = createStyledMesh(new THREE.BoxGeometry(0.08, 2.8, 0.15), lightStone);
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

    const frieren = new THREE.Group();
    const fHead = new THREE.Group();
    fHead.add(createStyledMesh(new THREE.SphereGeometry(0.32, 16, 16), lightStone));
    addFaceFeatures(fHead, 'elf');
    const tailPathL = [new THREE.Vector3(-0.2, 0.2, -0.1), new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(-0.7, -1.2, 0.1)];
    const tailPathR = [new THREE.Vector3(0.2, 0.2, -0.1), new THREE.Vector3(0.5, 0, 0), new THREE.Vector3(0.7, -1.2, 0.1)];
    fHead.add(createCurveMesh(tailPathL, lightStone));
    fHead.add(createCurveMesh(tailPathR, lightStone));
    fHead.position.y = 2.0;
    frieren.add(fHead);
    const dressPts = [new THREE.Vector2(0.2, 2.0), new THREE.Vector2(0.35, 1.2), new THREE.Vector2(0.65, 0)];
    const dress = createLathe(dressPts, stoneColor);
    frieren.add(dress);
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

    const heiter = new THREE.Group();
    const heHead = new THREE.Group();
    heHead.add(createStyledMesh(new THREE.SphereGeometry(0.35, 16, 16), lightStone));
    addFaceFeatures(heHead);
    heHead.position.y = 2.2;
    heiter.add(heHead);
    const robePts = [new THREE.Vector2(0.35, 2.2), new THREE.Vector2(0.5, 1.2), new THREE.Vector2(0.6, 0)];
    const robes = createLathe(robePts, stoneColor);
    heiter.add(robes);
    const stolePath = [new THREE.Vector3(-0.35, 2.1, 0.1), new THREE.Vector3(0, 1.9, 0.3), new THREE.Vector3(0.35, 2.1, 0.1)];
    heiter.add(createCurveMesh(stolePath, darkStone));
    const hStaff = new THREE.Group();
    hStaff.add(createStyledMesh(new THREE.CylinderGeometry(0.06, 0.06, 5.0), darkStone));
    hStaff.add(createStyledMesh(new THREE.SphereGeometry(0.2, 8, 8), lightStone)).position.y = 2.6;
    hStaff.position.set(0.6, 1.8, 0);
    heiter.add(hStaff);
    heiter.position.set(1.8, 2.5, 1.2);
    heiter.rotation.y = -0.2;
    heiter.scale.set(1.4, 1.4, 1.4);
    statueGroup.add(heiter);

    const eisen = new THREE.Group();
    const eHead = new THREE.Group();
    eHead.add(createStyledMesh(new THREE.SphereGeometry(0.42, 16, 16), darkStone));
    addFaceFeatures(eHead, 'dwarf');
    const hornL = createStyledMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.35, 0.2, 0), new THREE.Vector3(-0.65, 0.6, 0.1)]), 4, 0.08, 8), lightStone);
    const hornR = createStyledMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.35, 0.2, 0), new THREE.Vector3(0.65, 0.6, 0.1)]), 4, 0.08, 8), lightStone);
    eHead.add(hornL, hornR);
    const beardC = createStyledMesh(new THREE.ConeGeometry(0.25, 0.7, 16), lightStone);
    beardC.position.set(0, -0.45, 0.35);
    beardC.rotation.x = -0.3;
    eHead.add(beardC);
    eHead.position.y = 1.4;
    eisen.add(eHead);
    const armor = createStyledMesh(new THREE.CylinderGeometry(0.65, 0.7, 1.5, 8), darkStone);
    armor.position.y = 0.75;
    eisen.add(armor);
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
