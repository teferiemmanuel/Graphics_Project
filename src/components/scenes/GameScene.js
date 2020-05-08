import {
    AudioListener,
    Audio,
    AudioLoader,
    Scene,
    Vector3,
    CubeTextureLoader,
} from 'three';
import { Fuel, Player, Asteroid, Powerup } from 'objects';
import { BasicLights } from 'lights';
import Corneria from '../audio/corneria_ultimate.mp3';

const introDOM = document.getElementById('splash');
const STARTING_SECONDS = 15;
const STARTING_FUELS = 1;
const STARTING_COLLECTED_FUELS = 0;

//Asteroid generation parameters:
const STARTING_ASTEROIDS = 3;

class GameScene extends Scene {
    constructor(camera) {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            updateList: [],
        };

        this.camera = camera;

        // Add meshes to scene
        const lights = new BasicLights();
        const asteroid = new Asteroid(this, new Vector3(0, 0, 15));
        const fuel = new Fuel(this, 'yellow', new Vector3(0, 0, 5));
        const powerup = new Powerup(this, 'orange', new Vector3(0, 0, -5));
        const player = new Player(this, this.camera.position);
        this.playerBounds = player.boundingSphere;
        this.createBackground();

        // add audio to scene
        const listener = new AudioListener();
        // create a global audio source
        const music = new Audio(listener);
        // load a sound and set it as the Audio object's buffer
        const audioLoader = new AudioLoader();
        audioLoader.load(Corneria, function (buffer) {
            music.setBuffer(buffer);
            music.setLoop(false);
            music.setVolume(0.3);
            music.pause();
        });

        this.music = music;
        // Set scene info for HUD
        this.gameTimeRem = STARTING_SECONDS;
        this.numSpawnedFuels = STARTING_FUELS;
        this.numSpawnedAsteroids = STARTING_ASTEROIDS;

        this.numCollectedFuels = STARTING_COLLECTED_FUELS;

        // asteroid
        asteroid.position.x = 0;
        asteroid.position.y = 0;
        asteroid.position.z = 0;

        this.add(lights, fuel, player, asteroid, powerup);
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { updateList } = this.state;
        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
        // deals with music playing (don't want to clash with opening music)
        if (!this.music.isPlaying && introDOM.style.display == 'none') {
            this.music.play();
        }
    }

    // Randomly spawn fuel in bounded area
    spawnFuel() {
        // Random position
        const xRandom =
            this.camera.position.x +
            (Math.floor(Math.random() * 16) - 1) * randNegative();
        const yRandom =
            this.camera.position.y +
            (Math.floor(Math.random() * 16) - 1) * randNegative();
        const zRandom =
            this.camera.position.z +
            (Math.floor(Math.random() * 16) - 1) * randNegative();
        const positionVec = new Vector3(xRandom, yRandom, zRandom);
        console.log(this.camera.position);
        // Random color
        const colorOptions = ['red', 'green', 'yellow'];
        const colorChosen = colorOptions[Math.floor(Math.random() * 3)];
        const fuel = new Fuel(this, colorChosen, positionVec);

        this.add(fuel);
        this.numSpawnedFuels++;
    }

    // Randomly spawn asteroids in bounded area
    spawnAsteroid() {
        // spawn in Random position around player
        const xRandom =
            this.camera.position.x +
            (Math.floor(Math.random() * 16) - 1) * randNegative();
        const yRandom =
            this.camera.position.y +
            (Math.floor(Math.random() * 16) - 1) * randNegative();
        const zRandom =
            this.camera.position.z +
            (Math.floor(Math.random() * 16) - 1) * randNegative();
        const positionVec = new Vector3(xRandom, yRandom, zRandom);

        const asteroid = new Asteroid(this, positionVec);

        this.add(asteroid);
        this.numSpawnedAsteroids++;
    }

    hasPowerupCollision() {
        let powerupObjs = this.getAllPowerupObjects();
        for (var i = 0; i < powerupObjs.length; i++) {
            if (
                powerupObjs[i].boundingSphere.intersectsSphere(
                    this.playerBounds
                )
            ) {
                this.powerupCollision = powerupObjs[i];
                return true;
            }
        }
        this.powerupCollision = null;
        return false;
    }

    hasFuelCollision() {
        let fuelObjs = this.getAllFuelObjects();
        for (var i = 0; i < fuelObjs.length; i++) {
            if (
                fuelObjs[i].boundingSphere.intersectsSphere(this.playerBounds)
            ) {
                this.fuelCollision = fuelObjs[i];
                return true;
            }
        }
        this.fuelCollision = null;
        return false;
    }

    // may not work if children in getAllAsteroidObjects is wrong.
    hasAsteroidCollision() {
        let aObjs = this.getAllAsteroidObjects();
        for (var i = 0; i < aObjs.length; i++) {
            if (aObjs[i].boundingSphere.intersectsSphere(this.playerBounds)) {
                this.asteroidCollision = aObjs[i];
                return true;
            }
        }
        this.asteroidCollision = null;
        return false;
    }

    getAllFuelObjects() {
        let fuelObjs = [];
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i] instanceof Fuel) {
                fuelObjs.push(this.children[i]);
            }
        }
        return fuelObjs;
    }

    // return asteroids, used in collision detection.
    getAllAsteroidObjects() {
        let aObjs = [];
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i] instanceof Asteroid) {
                aObjs.push(this.children[i]);
            }
        }
        return aObjs;
    }

    getAllPowerupObjects() {
        let powerupObjs = [];
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i] instanceof Powerup) {
                powerupObjs.push(this.children[i]);
            }
        }
        return powerupObjs;
    }

    // creates a space background scene that can be used by the renderer
    createBackground() {
        const loader = new CubeTextureLoader();
        const texture = loader.load([
            'textures/right.jpg',
            'textures/left.jpg',
            'textures/top.jpg',
            'textures/bottom.jpg',
            'textures/front.jpg',
            'textures/back.jpg',
        ]);

        this.background = texture;
    }

    handleCollectedFuel(collectedFuel) {
        //console.log(collectedFuel);
        // for now, let's dispose of them
        this.remove(collectedFuel);

        collectedFuel.innerRing.geometry.dispose();
        collectedFuel.innerRing.material.dispose();

        collectedFuel.outerRing.geometry.dispose();
        collectedFuel.outerRing.material.dispose();

        collectedFuel.energyOrb.geometry.dispose();
        collectedFuel.energyOrb.material.dispose();

        this.fuelCollision == null;
    }

    handleAsteroidCollision(asteroidCollision) {
        // for now, let's dispose of them
        this.remove(asteroidCollision);

        asteroidCollision.rockSurface.geometry.dispose();
        asteroidCollision.rockSurface.material.dispose();

        asteroidCollision.rockOutline.geometry.dispose();
        asteroidCollision.rockOutline.material.dispose();

        this.asteroidCollision == null;
    }

    handlePowerupCollision(powerupCollision) {
        // for now, let's dispose of them
        this.remove(powerupCollision);

        powerupCollision.powerup_in.geometry.dispose();
        powerupCollision.powerup_in.material.dispose();

        powerupCollision.powerup_out.geometry.dispose();
        powerupCollision.powerup_out.material.dispose();

        this.powerupCollision == null;
    }

    // Reset objects in scene for new game
    resetScene() {
        // Reset objects
        this.gameTimeRem = STARTING_SECONDS;
        this.numSpawnedFuels = STARTING_FUELS;
        this.numCollectedFuels = STARTING_COLLECTED_FUELS;
        this.children = [];

        // Re-add essential objects
        this.add(new BasicLights());
        this.add(new Asteroid(this, new Vector3(0, 0, 15)));
        this.createBackground();
    }
}

// Helper function to help generate negative numbers
function randNegative() {
    return Math.floor(Math.random() * 2) == 1 ? 1 : -1;
}

export default GameScene;
