/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3, Vector2, Clock } from 'three';
import { FlyControls } from './FlyControls.js';
//import { FirstPersonControls } from './FirstPersonControls.js';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GameScene } from 'scenes';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
//import { MeshToonMaterial, DoubleSide, TetrahedronBufferGeometry, PlaneBufferGeometry, Mesh } from 'three';

// Initialize core ThreeJS components
const gameScene = new GameScene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });

// Set up camera
camera.position.set(6, 3, -10);
camera.lookAt(new Vector3(0, 0, 0));

/*
camera.add(gameScene.tetra);
gameScene.tetra.position.set(0, 0, 0);
*/

// Set up renderer and canvas
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.appendChild(canvas);

// Set up controls
/*
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 16;
controls.update();
*/
//const controls = new FirstPersonControls(camera, canvas);
const controls = new FlyControls(camera, canvas);
controls.autoForward = false;
controls.movementSpeed = 0.02;


// Bloom Pass Rendering
var renderScene = new RenderPass(gameScene, camera);
var bloomPass = new UnrealBloomPass( new Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = 0;
bloomPass.strength = 2;
bloomPass.radius = 0.37;
bloomPass.exposure = 1;


var composer = new EffectComposer(renderer);
composer.renderToScreen = true
composer.addPass(renderScene);
composer.addPass(bloomPass);



// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    //controls.update();
    controls.update(20); // empirically determined...what do you guys think?
    renderer.render(gameScene, camera);

    composer.render();

    gameScene.update && gameScene.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);
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

// Check if splash screen is up; If not, spawn fuel
function checkSplashAndSpawn() {
    // Check if splash screen is still displayed
    const splash = document.getElementById('splash');
    // Check if there are fewer than 10 fuel elements spawned
    if (splash.style.display === 'none' && gameScene.numSpawnedFuels < 10) {
        gameScene.spawnFuel();
    }
    console.log(gameScene.numSpawnedFuels);
}

// Wrapper to spawn fuel every 3s
window.setInterval(function () {
    checkSplashAndSpawn();
}, 3000);
