import * as THREE from 'three'
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Material } from "./Material";
import * as dat from 'dat.gui';

async function main() {
    //GUI
    const gui = new dat.GUI();

    // Canvas
    const canvas = document.querySelector('canvas.webgl')

    // Scene
    const scene = new THREE.Scene();

    const pointer = new THREE.Vector2(0, -1.0);

    //Texture 
    const textureloader = new THREE.TextureLoader();
    const matCapTexture3 = textureloader.load("MatCap/matcap8.jpg");
    /**
     * Object
     */

    const sizeBoxInstance = 10;
    const geometry = new THREE.BoxGeometry(sizeBoxInstance, sizeBoxInstance, sizeBoxInstance);
    geometry.scale(0.95, 0.95, 0.05);

    let uniforms = {
        u_pointPosition: { value: new Vector3(0, 0, 0) }
    }
    const material = new Material({ color: 0xffffff, wireframe: false, matcap: matCapTexture3, uniforms });


    const sizeField = 8;
    const COUNT_POINTS = sizeField * sizeField * 6 * 4;
    // const material = new THREE.MeshMatcapMaterial({ color: 0xffffff, wireframe: false, matcap: matCapTexturegrey });
    const mesh = new THREE.InstancedMesh(geometry, material, COUNT_POINTS);
    let instanceAttribute = fuilsBilder(mesh, sizeField, sizeBoxInstance);
    mesh.instanceNormalEffect = new THREE.InstancedBufferAttribute(new Float32Array(instanceAttribute.instanceNormalEffect.flat()), 3);
    mesh.geometry.setAttribute('instanceNormalEffect', mesh.instanceNormalEffect);
    mesh.instanceLayer = new THREE.InstancedBufferAttribute(new Float32Array(instanceAttribute.instanceLayer), 1);
    mesh.geometry.setAttribute('instanceLayer', mesh.instanceLayer);

    scene.add(mesh);

    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    scene.add(plane)
    // const helper = new THREE.PlaneHelper(plane, 10, 0xffff00);
    // scene.add(helper);

    const pointerCenter = new THREE.Object3D();
    pointerCenter.t = 0.0;
    scene.add(pointerCenter)

    /**
     * Helper
     */
    const geometry_HelperCUBE = new THREE.BoxGeometry(1, 1, 1);
    const material_HelperCUBE = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const mesh_HelperCUBE = new THREE.Mesh(geometry_HelperCUBE, material_HelperCUBE);
    material_HelperCUBE.wireframe = true;
    scene.add(mesh_HelperCUBE);
    const axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);

    //Create a closed wavey loop
    const linePointer = sizeField * sizeBoxInstance;
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, linePointer, linePointer),
        new THREE.Vector3(linePointer, linePointer, linePointer),
        new THREE.Vector3(linePointer, linePointer, 0),

        new THREE.Vector3(linePointer, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, linePointer)
    ], true,'catmullrom',0);

    const points = curve.getPoints(50);
    const geometryLine = new THREE.BufferGeometry().setFromPoints(points);
    const materialLine = new THREE.LineBasicMaterial({ color: 0xffff00 });
    // Create the final object to add to the scene
    const curveObject = new THREE.Line(geometryLine, materialLine);
    scene.add(curveObject);

    mesh_HelperCUBE.visible = false;
    axesHelper.visible = false;
    curveObject.visible = false;
    

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
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 500);
    camera.position.x = 120;
    camera.position.y = 120;
    camera.position.z = 120;
    scene.add(camera);

    // Controls
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true

    window.addEventListener('resize', onResize);
    
    gui.add(pointerCenter, "t", 0.0, 1.0, 0.01).setValue(0.0).name("t");


    // Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    })
    renderer.setSize(sizes.width, sizes.height)

    // Animate
    const clock = new THREE.Clock()

    const tick = () => {
        const elapsedTime = clock.getElapsedTime()

        // Update controls
        controls.update();

        curve.getPoint(Math.sin(elapsedTime * 0.1), pointerCenter.position);

        mesh_HelperCUBE.position.set(pointerCenter.position.x, pointerCenter.position.y, pointerCenter.position.z);

        uniforms.u_pointPosition.value = mesh_HelperCUBE.position.toArray();
 
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


function fuilsBilder(mesh, sizeField, sizeBoxInstance) {

    let count = 0;
    let offset = sizeBoxInstance * 0.5;
    const instanceNormalEffect = [];
    const instanceLayer = [];

    //XY
    for (let layer = 0; layer < 4; layer++) {

        for (let i = 0; i < sizeField; i++) {

            for (let j = 0; j < sizeField; j++) {

                let normalEffect = new Vector3(0, 0, 1);

                let matrix = new THREE.Matrix4();

                let posInstans = new THREE.Vector3(
                    i * (sizeBoxInstance) + offset,
                    j * (sizeBoxInstance) + offset,
                    sizeField * (sizeBoxInstance));

                posInstans.z += layer * 0.5;

                let scale = 1.0 - layer * 0.1;
                matrix.makeScale(scale, scale, 1.0);

                matrix.setPosition(posInstans);

                mesh.setMatrixAt(count, matrix);

                mesh.setColorAt(count, new THREE.Vector3(1.0, 1.0, 1.0));

                instanceNormalEffect.push(normalEffect.toArray());
                instanceLayer.push(layer);

                count++

            }
        }
    }

    //XZ
    for (let layer = 0; layer < 4; layer++) {

        for (let i = 0; i < sizeField; i++) {

            for (let k = 0; k < sizeField; k++) {

                let normalEffect = new Vector3(0, 1, 0);

                let matrix = new THREE.Matrix4();

                let posInstans = new THREE.Vector3(
                    i * (sizeBoxInstance) + offset,
                    sizeField * (sizeBoxInstance),
                    k * (sizeBoxInstance) + offset);

                posInstans.y += layer * 0.5;

                let scale = 1.0 - layer * 0.1;
                let quaternion = new THREE.Quaternion();
                quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
                matrix.compose(posInstans, quaternion, new Vector3(scale, scale, 1.0))

                mesh.setMatrixAt(count, matrix);

                mesh.setColorAt(count, new THREE.Vector3(1.0, 1.0, 1.0));
                instanceNormalEffect.push(normalEffect.toArray());
                instanceLayer.push(layer);
                count++

            }
        }
    }

    //YZ
    for (let layer = 0; layer < 4; layer++) {
        for (let j = 0; j < sizeField; j++) {

            for (let k = 0; k < sizeField; k++) {

                let normalEffect = new Vector3(1, 0, 0);
                let matrix = new THREE.Matrix4();

                let posInstans = new THREE.Vector3(
                    sizeField * (sizeBoxInstance),
                    j * (sizeBoxInstance) + offset,
                    k * (sizeBoxInstance) + offset);

                posInstans.x += layer * 0.5;

                let scale = 1.0 - layer * 0.1;
                let quaternion = new THREE.Quaternion();
                quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
                matrix.compose(posInstans, quaternion, new Vector3(scale, scale, 1.0))


                mesh.setMatrixAt(count, matrix);

                mesh.setColorAt(count, new THREE.Vector3(1.0, 1.0, 1.0));
                instanceNormalEffect.push(normalEffect.toArray());
                instanceLayer.push(layer);
                count++

            }
        }
    }

    //back side

    //XY
    for (let layer = 0; layer < 4; layer++) {

        for (let i = 0; i < sizeField; i++) {

            for (let j = 0; j < sizeField; j++) {

                let normalEffect = new Vector3(0, 0, -1);

                let matrix = new THREE.Matrix4();

                let posInstans = new THREE.Vector3(
                    i * (sizeBoxInstance) + offset,
                    j * (sizeBoxInstance) + offset,
                    0);

                posInstans.z -= layer * 0.5;

                let scale = 1.0 - layer * 0.1;
                matrix.makeScale(scale, scale, 1.0);

                matrix.setPosition(posInstans);

                mesh.setMatrixAt(count, matrix);

                mesh.setColorAt(count, new THREE.Vector3(1.0, 1.0, 1.0));

                instanceNormalEffect.push(normalEffect.toArray());
                instanceLayer.push(layer);

                count++

            }
        }
    }
    
    //XZ
    for (let layer = 0; layer < 4; layer++) {

        for (let i = 0; i < sizeField; i++) {

            for (let k = 0; k < sizeField; k++) {

                let normalEffect = new Vector3(0, -1, 0);

                let matrix = new THREE.Matrix4();

                let posInstans = new THREE.Vector3(
                    i * (sizeBoxInstance) + offset,
                    0,
                    k * (sizeBoxInstance) + offset);

                posInstans.y -= layer * 0.5;

                let scale = 1.0 - layer * 0.1;
                let quaternion = new THREE.Quaternion();
                quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
                matrix.compose(posInstans, quaternion, new Vector3(scale, scale, 1.0))

                mesh.setMatrixAt(count, matrix);

                mesh.setColorAt(count, new THREE.Vector3(1.0, 1.0, 1.0));
                instanceNormalEffect.push(normalEffect.toArray());
                instanceLayer.push(layer);
                count++

            }
        }
    }

    //YZ
    for (let layer = 0; layer < 4; layer++) {
        for (let j = 0; j < sizeField; j++) {

            for (let k = 0; k < sizeField; k++) {

                let normalEffect = new Vector3(-1, 0, 0);
                let matrix = new THREE.Matrix4();

                let posInstans = new THREE.Vector3(
                    0,
                    j * (sizeBoxInstance) + offset,
                    k * (sizeBoxInstance) + offset);

                posInstans.x -= layer * 0.5;

                let scale = 1.0 - layer * 0.1;
                let quaternion = new THREE.Quaternion();
                quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
                matrix.compose(posInstans, quaternion, new Vector3(scale, scale, 1.0))


                mesh.setMatrixAt(count, matrix);

                mesh.setColorAt(count, new THREE.Vector3(1.0, 1.0, 1.0));
                instanceNormalEffect.push(normalEffect.toArray());
                instanceLayer.push(layer);
                count++

            }
        }
    }



    return {
        instanceNormalEffect, instanceLayer
    }

}