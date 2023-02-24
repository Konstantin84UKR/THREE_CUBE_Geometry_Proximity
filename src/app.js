import * as THREE from 'three'
import { Vector3, Vector2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Perlin, FBM } from 'three-noise/build/three-noise.module';
import { Material } from "./Material";



// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

const raycaster = new THREE.Raycaster();
const ray = new THREE.Ray();
const pointer = new THREE.Vector2(0,-0.1);
const pointerNDC = new THREE.Vector3(0, 0, 0);
let planeIntersect = new THREE.Vector3();
const tmpM = new THREE.Matrix4();
const currentM = new THREE.Matrix4();
const mainPos = new THREE.Vector3();

//https://www.npmjs.com/package/three-noise
const perlin = new Perlin(Math.random())
const fbm = new FBM(Math.random());

//Texture 
const textureloader = new THREE.TextureLoader();
const matCapTexture = textureloader.load("/MatCap/green.jpg")
const matCapTexture3 = textureloader.load("/MatCap/matcap8.jpg")
const matCapTexture5 = textureloader.load("/MatCap/skin2.png")
const matCapTexture9 = textureloader.load("/MatCap/m1.jpeg")
const matCapTexture10 = textureloader.load("/MatCap/grey.png")

/**
 * Object
 */
//MeshMatcapMaterial
const sizeBoxInstance = 10
const geometry = new THREE.BoxGeometry(sizeBoxInstance, sizeBoxInstance, sizeBoxInstance);

let uniforms = {
    u_pointPosition: { value: new Vector3(10, 10, 10) }
}
const material = new Material({ color: 0xffffff, wireframe: false, matcap: matCapTexture10, uniforms });

const sizeField = 25;

const instances = sizeField * sizeField * sizeField;
const mesh = new THREE.InstancedMesh(geometry, material, instances);
let count = 0;

// создаем массив с данными атрибута (attribute data)
const positionArray = [];


for (let i = 0; i < sizeField; i++) {

    for (let j = 0; j < sizeField; j++) {

        for (let k = 0; k < sizeField; k++) {

        let matrix = new THREE.Matrix4(); 
            let posInstans = new THREE.Vector3(
                i * (sizeBoxInstance + 1) - sizeField / 2 * sizeBoxInstance,
                j * (sizeBoxInstance + 1) - sizeField / 2 * sizeBoxInstance,
                k * (sizeBoxInstance + 1) - sizeField / 2 * sizeBoxInstance);
        matrix.setPosition(posInstans);
        mesh.setMatrixAt(count, matrix);

            let colorPerlin = new THREE.Vector3();
            colorPerlin.copy(posInstans);
            colorPerlin.normalize();
            let colorX = 5 * fbm.get3(colorPerlin.multiplyScalar(5));
            let colorY = 5 * fbm.get3(colorPerlin.multiplyScalar(0.5));
            let colorZ = 0.5 + fbm.get3(colorPerlin.multiplyScalar(4));
        
            mesh.setColorAt(count, new THREE.Vector3(colorX, colorY, colorZ));

        positionArray.push(posInstans);
     

        count ++    
            }
    }
}
mesh.instanceMainPosition = positionArray;
// // создаем InstancedBufferAttribute
// mesh.positionAttribute = new THREE.InstancedBufferAttribute(new Float32Array(positionArray), 3, 1);

// mesh.geometry.setAttribute('instanceColorMainPosition', positionAttribute);

scene.add(mesh);

const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
scene.add(plane)
const helper = new THREE.PlaneHelper(plane, 50, 0xffff00);
scene.add(helper);

const pointerCenter = new THREE.Object3D();
scene.add(pointerCenter)

//HelperCUBE 

const geometry_HelperCUBE = new THREE.BoxGeometry(10, 10, 10);
const material_HelperCUBE = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const mesh_HelperCUBE = new THREE.Mesh(geometry_HelperCUBE, material_HelperCUBE);
material_HelperCUBE.wireframe = true;
scene.add(mesh_HelperCUBE);

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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 1000)
camera.position.z = 450
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

canvas.addEventListener('pointermove', onPointerMove);
window.addEventListener('resize', onResize);

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
    controls.update()


    //Plane 
    let target = new THREE.Vector3();
    camera.getWorldDirection(target);
    let originPlane = new THREE.Vector3();
    originPlane.copy(camera.position).addScaledVector(target,450);
    plane.setFromNormalAndCoplanarPoint(target.negate(), originPlane);

    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera(pointer, camera);

    // calculate objects intersecting the picking ray
    raycaster.ray.intersectPlane(plane, planeIntersect);
    
    //testBox
    const distPointerCenter = planeIntersect.distanceTo(pointerCenter.position); 
    pointerCenter.position.lerp(planeIntersect, Math.sign(distPointerCenter) * 1.00); 

    mesh_HelperCUBE.position.set(pointerCenter.position.x, pointerCenter.position.y, pointerCenter.position.z);

    
    //instances
    for (let i = 0; i < instances -1; i++) {
    
        mesh.getMatrixAt(i, currentM);
        // mesh.getColorAt(i, mainPos);

        mainPos.copy(mesh.instanceMainPosition[i]);
        // let positionInstans = new Vector3();  
        // positionInstans.setFromMatrixPosition(currentM);  

        let vectorToPointer = new Vector3();
        vectorToPointer.copy(mesh_HelperCUBE.position);
        vectorToPointer.sub(mainPos);

        let vectorForPerlin = new Vector3();
        vectorForPerlin.copy(mesh_HelperCUBE.position);
        vectorForPerlin.sub(mainPos);
        vectorForPerlin.multiplyScalar(0.05);

        let nd = 1 * perlin.get3(vectorForPerlin);
    
        // const dist = pointerCenter.position.distanceTo(mainPos);
        const dist = mesh_HelperCUBE.position.distanceTo(mainPos);
        tmpM.makeRotationX(0);
        // tmpM.copyPosition(currentPos);
        // tmpM.setPosition(currentPos);
        // currentM.copy(tmpM);

        // let nd = 100 * perlin.get2(new Vector2(dist, 0.0));
    
        // if (dist < 100 + nd) {
        let curentPosVec = new Vector3();
        let mainPosVec = new Vector3(); 
        vectorForPerlin.copy(mainPos);


         if (dist < 150 + nd * 10) {
            // if (dist < 50 ) {

                let d = 1 - THREE.MathUtils.smoothstep(0, dist, 50 * nd);
        
            // tmpM.makeRotationX(d * 0.5);
            // tmpM.makeRotationY(d * 0.1);
            // tmpM.makeRotationZ(d * 1.3);

             let ndX = 1 * perlin.get3(vectorForPerlin.multiplyScalar(0.1));
             let ndY = 1 * perlin.get3(vectorForPerlin.multiplyScalar(2.0));
             let ndZ = 1 * perlin.get3(vectorForPerlin.multiplyScalar(1.5));

             tmpM.makeRotationX(ndX * 0.5);
             tmpM.makeRotationY(ndY * 0.1);
             tmpM.makeRotationZ(ndZ * 1.3);


            
        
            let noisePosVec = new Vector3(mainPos.x + (ndX) * 50, mainPos.y + (ndY) * 50, mainPos.z + (ndZ) * 150);
            curentPosVec.setFromMatrixPosition(currentM); 
            noisePosVec.sub(curentPosVec);
            noisePosVec.multiplyScalar(0.05);
            curentPosVec.add(noisePosVec);


            tmpM.setPosition(curentPosVec);
            currentM.copy(tmpM);
        }else{

        
            mainPosVec.copy(mainPos);
            curentPosVec.setFromMatrixPosition(currentM);

            mainPosVec.sub(curentPosVec);
            mainPosVec.multiplyScalar(0.05);
            curentPosVec.add(mainPosVec);
            
            tmpM.setPosition(curentPosVec);
            currentM.copy(tmpM);
        }
        mesh.setMatrixAt(i, currentM);

    }

 
    // uniforms.u_pointPosition.value = planeIntersect;
    
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
    sizes.height =  window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
}
