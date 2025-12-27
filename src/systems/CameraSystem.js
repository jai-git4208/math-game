import * as THREE from 'three';

export class CameraSystem {
    constructor(sceneManager, inputManager) {
        this.camera = sceneManager.camera;
        this.inputManager = inputManager;

       //physics stuff
        this.velocity = new THREE.Vector3();
        this.maxSpeed = 0.15;
        this.acceleration = 0.015;
        this.deceleration = 0.01;
        this.swayAmount = 0.05;
        this.swaySpeed = 8;

       
        this.swayTime = 0;
        this.uiOpacity = 1.0;

       
        this.pitch = 0;
        this.yaw = 0;
    }

    update() {
        
        const mouseDelta = this.inputManager.getMouseDelta();
        this.yaw += mouseDelta.yaw;
        this.pitch += mouseDelta.pitch;

        //Clamp Pitch
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

        this.camera.rotation.x = this.pitch;
        this.camera.rotation.y = this.yaw;

        const fwd = new THREE.Vector3();
        this.camera.getWorldDirection(fwd);
        fwd.y = 0;
        fwd.normalize();

        const rgt = new THREE.Vector3();
        rgt.crossVectors(fwd, this.camera.up).normalize();

        const inputVector = new THREE.Vector3();
        if (this.inputManager.isKeyDown('KeyW')) inputVector.add(fwd);
        if (this.inputManager.isKeyDown('KeyS')) inputVector.sub(fwd);
        if (this.inputManager.isKeyDown('KeyA')) inputVector.sub(rgt);
        if (this.inputManager.isKeyDown('KeyD')) inputVector.add(rgt);

        if (inputVector.lengthSq() > 0) {
            inputVector.normalize();
            const targetVelocity = inputVector.multiplyScalar(this.maxSpeed);
            this.velocity.lerp(targetVelocity, this.acceleration);
        } else {
            this.velocity.lerp(new THREE.Vector3(0, 0, 0), this.deceleration);
        }

        this.camera.position.add(this.velocity);

        
        const speedFraction = this.velocity.length() / this.maxSpeed;

        
        const targetOpacity = speedFraction > 0.1 ? 0.0 : 1.0;
        this.uiOpacity = THREE.MathUtils.lerp(this.uiOpacity, targetOpacity, 0.05);

        if (speedFraction > 0.1) {
            this.swayTime += 0.015 * this.swaySpeed;

            const strafeVelocity = this.velocity.dot(rgt);
            const targetRoll = -strafeVelocity * 0.5;

            const bobOffset = Math.sin(this.swayTime) * 0.05 * speedFraction;
            this.camera.position.y = 1.6 + bobOffset;

            this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, targetRoll, 0.1);
        } else {
            this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 1.6, 0.1);
            this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, 0, 0.1);
            this.swayTime = 0;
        }
    }

    getUiOpacity() {
        return this.uiOpacity;
    }
}
