/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3, Vector2 } from 'three';
import { Controls } from './Controls.js';
import { GameScene } from 'scenes';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { World, NaiveBroadphase } from 'cannon';
// If out of bounds, from the 50x50 position from the start
// Spawn asteroids in game scene there's a variable in,  gamescene.
// then barrel roll.

// Constants
const MAX_FUEL_SECONDS = 30;

// Cannon js physics things...
const world = new World();
world.gravity.set(0, 0, 0);
world.broadphase = new NaiveBroadphase();
world.solver.iterations = 10;

// Initialize core ThreeJS components
const camera = new PerspectiveCamera();
// Set up camera
resetPlayerPosition();

const gameScene = new GameScene(camera, world);
const renderer = new WebGLRenderer({ antialias: true });

// Set up renderer and canvas
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.appendChild(canvas);

// Set up controls
const controls = new Controls(camera, canvas);
controls.autoForward = true;
controls.movementSpeed = 0.0025;
controls.rollSpeed = 0.001;
// add event listener to document.body
document.body.addEventListener(
    'click',
    function () {
        //lock mouse on screen
        controls.isLocked = true;
        controls.lock();
    },
    false
);

// Bloom Pass Rendering
const renderScene = new RenderPass(gameScene, camera);
var bloomPass = new UnrealBloomPass(
    new Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
);
bloomPass.threshold = 0;
bloomPass.strength = 1.25;
bloomPass.radius = 0.37;
bloomPass.exposure = 1;
bloomPass.renderToScreen = true;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    controls.update(20); // empirically determined...what do you guys think?
    updatePhysics();

    renderer.autoClear = false;

    renderer.clear();

    camera.layers.set(1);
    composer.render();

    renderer.clearDepth();
    camera.layers.set(0);
    renderer.render(gameScene, camera);

    gameScene.update && gameScene.update(timeStamp);

    window.requestAnimationFrame(onAnimationFrameHandler);

    // Update HUD values
    updateHUD();
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);

    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);

function updatePhysics() {
    // Step the physics world
    world.step(1 / 60);
}

// Update HUD values
function updateHUD() {
    document.getElementById('fuelCollectedVal').innerHTML =
        gameScene.numCollectedFuels;
    document.getElementById('timeElapsedVal').innerHTML =
        gameScene.gameTimeRem + 's of fuel remaining';
    document.getElementById('timeRemainingProg').value =
        (gameScene.gameTimeRem / MAX_FUEL_SECONDS) * 100;
}

// Check if splash screen is up; If not, spawn fuel
function checkSplashAndSpawn() {
    // Check if splash screen is still displayed
    const splash = document.getElementById('splash');
    // Check if there are fewer than 10 fuel elements spawned
    if (
        splash.style.display === 'none' &&
        gameScene.numSpawnedFuels < gameScene.MAX_FUEL_SPAWNS
    ) {
        gameScene.spawnFuel();
    }
}

// Check if splash screen is up; If not, spawn asteroid
function checkSplashAndSpawnAsteroid() {
    // Check if splash screen is still displayed
    const splash = document.getElementById('splash');
    // Check if there are fewer than 9 asteroid elements spawned
    if (
        splash.style.display === 'none' &&
        gameScene.numSpawnedAsteroids < gameScene.MAX_ASTEROIDS_SPAWNS
    ) {
        gameScene.spawnAsteroid();
    }
}

// Check if splash screen is up; If not, spawn powerup
function checkSplashAndSpawnPowerup() {
    // Check if splash screen is still displayed
    const splash = document.getElementById('splash');
    // Check if there are fewer than 9 powerup elements spawned
    if (
        splash.style.display === 'none' &&
        gameScene.numSpawnedPowerups < gameScene.MAX_POWERUP_SPAWNS
    ) {
        gameScene.spawnPowerup();
    }
}

// Update time remaining
window.setInterval(function () {
    const finishGame = document.getElementById('finishGameScreen');
    const hud = document.getElementById('hud');

    // Reset to start screen if fuel/time runs out
    if (gameScene.gameTimeRem <= 0) {
        // Populate post-game stats
        const finishGameTime = new Date().getTime() - elapsedTime;
        document.getElementById('finishGameTime').innerHTML =
            'Time Elapsed: ' + Math.floor(finishGameTime / 1000) + 's';

        document.getElementById('finishGameFuel').innerHTML =
            'Fuel Collected: ' + gameScene.numCollectedFuels;

        finishGame.style.display = 'block';
        hud.style.display = 'none';

        // Reset the important parts of scene
        gameScene.resetScene();
        document.getElementById('collisionMessage').innerHTML = '';
    }

    // Only decrement time if HUD is up; indicates gameScene is active
    if (hud.style.display === 'block') {
        gameScene.gameTimeRem -= 1;
    }
}, 1000);

// Wrapper to spawn fuel every 2.5s
window.setInterval(function () {
    checkSplashAndSpawn();
}, 2500);

// Wrapper to spawn powerup every 2s
window.setInterval(function () {
    checkSplashAndSpawnPowerup();
}, 2000);

// Wrapper to spawn asteroid every 1.5s
window.setInterval(function () {
    checkSplashAndSpawnAsteroid();
}, 1000);

// Resets player position to default after starting game
function resetPlayerPosition() {
    camera.position.set(0, 0, 0);
    camera.lookAt(new Vector3(0, 0, 0));
    camera.layers.enable(1);
}
// Listener for restarting position
document.getElementById('startButton').addEventListener('click', () => {
    resetPlayerPosition(), gameScene.resetScene();
});

// Disable right click; right-click leads to weird control errors
document.addEventListener(
    'contextmenu',
    function (e) {
        e.preventDefault();
    },
    false
);
