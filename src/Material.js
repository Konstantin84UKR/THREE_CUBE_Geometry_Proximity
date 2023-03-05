import { Vector2, MeshMatcapMaterial, ShaderMaterial, Vector3 } from "three";
import { noise } from './noise.js';

export class Material extends MeshMatcapMaterial {
    constructor({ color, wireframe, matcap ,uniforms}) {
        super({ color, wireframe, matcap });

        this.onBeforeCompile = (shader) => {

            shader.uniforms.u_pointPosition = uniforms.u_pointPosition;    
            shader.uniforms.u_mixFactor = uniforms.u_mixFactor; 
            shader.uniforms.u_time = uniforms.u_time; 
            shader.uniforms.u_groupMatrix = uniforms.u_groupMatrix; 


            // ---------------------------------------vertexShader
            shader.vertexShader = /*glsl*/ `

            uniform vec3 u_pointPosition;
            uniform float u_mixFactor;
            uniform float u_time;
            uniform mat4 u_groupMatrix;
            
            #ifdef USE_INSTANCING
                attribute vec3 instancePositionNoise;
                attribute mat4 instancePositionMatrix; // IPM
            #endif


            mat4 rotation3d(vec3 axis, float angle) {
            axis = normalize(axis);
            float s = sin(angle);
            float c = cos(angle);
            float oc = 1.0 - c;

            return mat4(
                oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0
            );
            }

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

                float mixfactor = 0.1;
                vec3 positionIPM = vec3(instancePositionMatrix[3]);
                vec3 positionI = vec3(instanceMatrixTransformed[3]);
                float N = noise(positionIPM) * 0.2;
                float distance =  clamp(distance(positionI, u_pointPosition)/250.0 + N,0.0,1.0);
                vec3 positionMix = mix(vec3(0),positionIPM, (1.0 - distance) * u_mixFactor);
                float timeFactor = sin(u_time) * 1.0 * (1.0 - distance) * u_mixFactor;
                
                
                //Scale  
                // mat4 scaleInstance = scale(0.1 + (1.0 - distance) * u_mixFactor);  
                mat4 scaleInstance = scale(0.1 + (distance) * u_mixFactor);    
                //Rotation
                mat4 rot = rotation3d(normalize(vec3(1.0 + N, 0.5 + N, 0.8 + N)), 3.1415 * 1.0 * (1.0 - distance) * timeFactor);
                mat4 m4 = instanceMatrixTransformed * rot * scaleInstance;
                mvPosition = (m4) * mvPosition;
                
                //Position
                positionMix = mix(positionMix, positionMix * 0.9, timeFactor );
                mvPosition = mvPosition + vec4(positionMix,0.0);
                
                transformedNormal = objectNormal;
                m = mat3( instanceMatrixTransformed );
                transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
                transformedNormal = m * transformedNormal;
                vNormal = normalMatrix * mat3(rot) * transformedNormal;
                //  vNormal =  vec3(instanceMatrix * rot * vec4(transformedNormal,0.0));
            
            #endif

            mvPosition = modelViewMatrix * mvPosition;
            gl_Position = projectionMatrix * mvPosition;
            `
                );


            // ---------------------------------------fragmentShader
            shader.fragmentShader = /*glsl*/  `

            
            ` + shader.fragmentShader;

            //     shader.fragmentShader = shader.fragmentShader.replace(
            //         "#include <output_fragment>",
            // /*glsl*/ `#include <output_fragment>       

            // diffuseColor = vec4(1.0,0.0,0.5 , 1.0);
            
            // gl_FragColor = diffuseColor; `
            
            // );

        };
    }
}


