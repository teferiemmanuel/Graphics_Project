import { Audio, AudioLoader, Vector3, Group, Sphere } from 'three';
import { Body } from 'cannon';
import { Sphere as SpherePhysics } from 'cannon';
import AsteroidCollision from '../../audio/asteroid_collision.mp3';

class Player extends Group {
    constructor(parent, positionVec, world) {
        // Call parent Group() constructor
        super();

        let boundingSphere = createBoundingSphere();

        boundingSphere.center.x = positionVec.x;
        boundingSphere.center.y = positionVec.y;
        boundingSphere.center.z = positionVec.z;

        this.boundingSphere = boundingSphere;
        this.gameScene = parent;
        this.positionVec = positionVec;

        const shape = new SpherePhysics(this.boundingSphere.radius);

        const body = new Body({
            mass: 1,
            position: positionVec.clone(),
        });
        body.addShape(shape);
        world.addBody(body);

        this.body = body;
        this.body.gameScene = parent;

        this.body.addEventListener('collide', function (e) {
            document.getElementById('collisionMessage').innerHTML =
                'OOF! You lost some fuel';
            this.gameScene.gameTimeRem -= 5;

            // create an audio source
            const soundEffect = new Audio(this.gameScene.listener);
            // load a sound and set it as the Audio object's buffer
            const audioLoader = new AudioLoader();
            audioLoader.load(AsteroidCollision, function (buffer) {
                soundEffect.setBuffer(buffer);
                soundEffect.setLoop(false);
                soundEffect.setVolume(0.15);
                soundEffect.play();
            });
        });

        // debugging mesh just in case we need to visualize boudingSphere
        // let energyOrbMesh = createEnergyOrbMesh();

        // energyOrbMesh.position.x = positionVec.x;
        // energyOrbMesh.position.y = positionVec.y;
        // energyOrbMesh.position.z = positionVec.z;
        // this.add(energyOrbMesh);
        // this.energyOrb = energyOrbMesh

        // Add self to parent's update list
        parent.addToUpdateList(this);
    }

    update(timeStamp) {
        this.boundingSphere.center.x = this.positionVec.x;
        this.boundingSphere.center.y = this.positionVec.y;
        this.boundingSphere.center.z = this.positionVec.z;

        this.body.position.copy(this.positionVec.clone());

        // debugging mesh
        // this.energyOrb.position.x = this.positionVec.x;
        // this.energyOrb.position.y = this.positionVec.y;
        // this.energyOrb.position.z = this.positionVec.z;
    }
}

function createBoundingSphere() {
    let boundingSphere = {};

    boundingSphere = new Sphere(new Vector3(), 0.6);
    return boundingSphere;
}

// function createEnergyOrbMesh() {
//   let energyOrb = {}
//
//     energyOrb.material = new MeshBasicMaterial({
//      color: 0xff,
//      side: DoubleSide,
//      wireframe: false,
//    });
//
//   // use orb geometry
//   energyOrb.geometry = new SphereBufferGeometry(.6, 10, 10);
//
//   // create orb mesh
//   energyOrb.mesh = new Mesh( energyOrb.geometry,  energyOrb.material);
//   return energyOrb.mesh;
// }

export default Player;
