import { Vector2, MeshMatcapMaterial, ShaderMaterial, Vector3 } from "three";
import { noise } from './noise.js';

export class Material extends MeshMatcapMaterial {
    constructor({ color, wireframe, matcap ,uniforms}) {
        super({ color, wireframe, matcap });

        this.onBeforeCompile = (shader) => {

            shader.uniforms.u_pointPosition = uniforms.u_pointPosition;    
            // ---------------------------------------vertexShader
            shader.vertexShader = /*glsl*/ `

            uniform vec3 u_pointPosition;

            #ifdef USE_INSTANCING
                attribute vec3 instanceNormalEffect;
                attribute float instanceLayer;
            #endif

            mat4 scale(float c)
            {
                return mat4(c, 0, 0, 0,
                            0, c, 0, 0,
                            0, 0, c, 0,
                            0, 0, 0, 1);
            }

            
            ` + noise  + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
                "#include <project_vertex>",
            /*glsl*/ `     

            vec4 mvPosition = vec4( transformed, 1.0 );
        
            #ifdef USE_INSTANCING
        
                mat4 instanceMatrixTransformed = instanceMatrix;
                vec3 positionI = vec3(instanceMatrixTransformed[3]);

                float distance =  distance(positionI, u_pointPosition) / 100.0;
                float noisePerlin =  noise(positionI)*0.3;
                float distanceN =  clamp(distance + noisePerlin, 0.0, 1.0);

                // //Scale  
                float scalefactor = mix(1.0,0.0,smoothstep(0.8,1.0,distanceN)); 

                if( scalefactor < 0.5){
                    scalefactor = 0.0;
                }
                mat4 scaleInstance = scale(scalefactor);       

                // //Rotation
                // mat4 rot = rotation3d(normalize(vec3(1.0 + N, 0.5 + N, 0.8 + N)), 3.1415 * 1.0 * (1.0 - distance) * timeFactor);
                 mat4 m4 = instanceMatrixTransformed * scaleInstance;
                 mvPosition = (m4) * mvPosition;

                // //Position
                vec3 positionMix = mix(vec3(0), instanceNormalEffect * (3.0 * instanceLayer), smoothstep(0.2,1.0,distanceN));
                mvPosition = mvPosition + vec4(positionMix,0.0);

            #endif

            mvPosition = modelViewMatrix * mvPosition;
            gl_Position = projectionMatrix * mvPosition;
            `
            );


            // ---------------------------------------fragmentShader
            shader.fragmentShader = /*glsl*/  `
            
            ` + shader.fragmentShader;

        };
    }
}


