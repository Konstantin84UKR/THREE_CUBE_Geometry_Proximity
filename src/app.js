import * as THREE from 'three'
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Material } from "./Material";
import * as dat from 'dat.gui';

async function main(){
//GUI
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0,-1.0);

let planeSettings = {
    originPlane: new THREE.Vector3(),
    planeIntersect: new THREE.Vector3(),
    planeDistans : 500   
}

//Texture 
const textureloader = new THREE.TextureLoader();
const matCapTexture3 = textureloader.load("MatCap/matcap8.jpg")

/**
 * Object
 */

//Model For Point

// const geometryModelForPoints = new THREE.TorusKnotGeometry(200, 40, 600, 30, 3, 4);
const geometryModelForPoints =   new THREE.BoxGeometry(250, 250, 250, 30, 30, 30);
// const geometryModelForPoints = new THREE.TorusGeometry(250, 50, 8, 50);

const COUNT_POINTS = geometryModelForPoints.attributes.position.count;
const arratPoints = geometryModelForPoints.attributes.position.array;


//MeshMatcapMaterial
const sizeBoxInstance = 10
const geometry = new THREE.BoxGeometry(sizeBoxInstance, sizeBoxInstance, sizeBoxInstance);

let uniforms = {
    u_pointPosition: { value: new THREE.Vector3(0, 0, 0) },
    u_mixFactor: { value: 0.0 },
    u_time:  { value: 0 },
    u_groupMatrix: { value: new THREE.Matrix4().identity()},
    u_distanceEffect: { value: 250.0 },
    u_noiseScale: { value: 1.0 },
    u_scaleEffect: { value: 1.0 }
}
const material = new Material({ color: 0xffffff, wireframe: false, matcap: matCapTexture3, uniforms });
const mesh = new THREE.InstancedMesh(geometry, material, COUNT_POINTS);

    for (let i = 0; i < COUNT_POINTS; i++) {

        let matrix = new THREE.Matrix4(); 

        let posInstans = new THREE.Vector3(
            arratPoints[i * 3],
            arratPoints[i * 3 + 1], 
            arratPoints[i * 3 + 2]);

        posInstans.multiplyScalar(1);   
    
        matrix.setPosition(posInstans);

        mesh.setMatrixAt(i, matrix);      

        mesh.setColorAt(i, new THREE.Vector3(1.0, 1.0, 1.0));

    }

scene.add(mesh);

const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
scene.add(plane);

const pointerCenter = new THREE.Object3D();
scene.add(pointerCenter)

//Helper
let helpersSettings = {
    visible: false
}

const geometry_HelperCUBE = new THREE.BoxGeometry(10, 10, 10);
const material_HelperCUBE = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const mesh_HelperCUBE = new THREE.Mesh(geometry_HelperCUBE, material_HelperCUBE);
material_HelperCUBE.wireframe = true;
scene.add(mesh_HelperCUBE);

const helperPlane = new THREE.PlaneHelper(plane, 50, 0xffff00);
scene.add(helperPlane);

helperPlane.visible = helpersSettings.visible;
material_HelperCUBE.visible = helpersSettings.visible
/////////////////////////

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth, // 800
    height: window.innerHeight // 600
}

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 2000)
camera.position.z = 700
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

canvas.addEventListener('pointermove', onPointerMove);
window.addEventListener('resize', onResize);


gui.add(uniforms.u_mixFactor, "value", 0.0, 1.0, 0.01).setValue(1.0).name("u_mixFactor");
gui.add(planeSettings , 'planeDistans', 0.100, 1000.0, 10.0).setValue(500.0);
gui.add(helpersSettings, 'visible').setValue(false).onChange(function (newValue) {
        helperPlane.visible = helpersSettings.visible;
        material_HelperCUBE.visible = helpersSettings.visible
    });
gui.add(uniforms.u_distanceEffect, 'value', 100.0, 1000.0, 10.0).setValue(220.0).name("u_distanceEffect");    
gui.add(uniforms.u_noiseScale, 'value', 0.1, 3.0, 0.1).setValue(0.5).name("u_noiseScale");  
gui.add(uniforms.u_scaleEffect, 'value', 0.1, 10.0, 0.1).setValue(1.0).name("u_scaleEffect");  


// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias : true
})
renderer.setSize(sizes.width, sizes.height)

// Animate
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update();

    //Plane 
    let target = new THREE.Vector3();
    camera.getWorldDirection(target);

    planeSettings.originPlane.copy(camera.position).addScaledVector(target, planeSettings.planeDistans);
    plane.setFromNormalAndCoplanarPoint(target.negate(), planeSettings.originPlane);

    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera(pointer, camera);

    // calculate objects intersecting the picking ray
    raycaster.ray.intersectPlane(plane, planeSettings.planeIntersect);
    
    //testBox
    const distPointerCenter = planeSettings.planeIntersect.distanceTo(pointerCenter.position); 
    pointerCenter.position.lerp(planeSettings.planeIntersect, Math.sign(distPointerCenter) * 1.00); 

    mesh_HelperCUBE.position.set(pointerCenter.position.x, pointerCenter.position.y, pointerCenter.position.z);

    uniforms.u_pointPosition.value = mesh_HelperCUBE.position.toArray();
    uniforms.u_time.value = elapsedTime;
       
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = false;
    
    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

    function onPointerMove(event) {

        // calculate pointer position in normalized device coordinates
        // (-1 to +1) for both components

        pointer.x = (event.clientX / sizes.width) * 2 - 1;
        pointer.y = - (event.clientY / sizes.height) * 2 + 1;

    }

    function onResize(event) {
        sizes.width = window.innerWidth;
        sizes.height = window.innerHeight;

        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();

        renderer.setSize(sizes.width, sizes.height);
    }

}

main();