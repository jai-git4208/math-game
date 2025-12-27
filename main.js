import { InputManager } from './src/systems/InputManager.js';
import { SceneManager } from './src/systems/SceneManager.js';
import { CameraSystem } from './src/systems/CameraSystem.js';
import { EnvironmentSystem } from './src/systems/EnvironmentSystem.js';
import { NarrativeSystem } from './src/systems/NarrativeSystem.js';

const inputManager = new InputManager();
const sceneManager = new SceneManager();

const cameraSystem = new CameraSystem(sceneManager, inputManager);
const environmentSystem = new EnvironmentSystem(sceneManager);
const narrativeSystem = new NarrativeSystem(environmentSystem);


environmentSystem.generate();

// ill have to trigger narrative progression when space is pressed, the input manager handles key staet so ill add a direct callback or maybe js check in the loop.
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        narrativeSystem.nextPage();
    }
});

function animate() {
    requestAnimationFrame(animate);

   
    cameraSystem.update();
    environmentSystem.update();
    narrativeSystem.update(cameraSystem.getUiOpacity());

    
    sceneManager.render();
}

animate();
