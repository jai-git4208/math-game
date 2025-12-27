
export class InputManager {
    constructor() {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;

        
        this.deltaYaw = 0;
        this.deltaPitch = 0;

        this.initListeners();
    }

    initListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body) {
                this.deltaYaw -= e.movementX * 0.002;
                this.deltaPitch -= e.movementY * 0.002;
            }
        });
    }

    isKeyDown(code) {
        return !!this.keys[code];
    }

    getMouseDelta() {
        const d = { yaw: this.deltaYaw, pitch: this.deltaPitch };
        

        this.deltaYaw = 0;
        this.deltaPitch = 0;
        return d;
    }

  
}
