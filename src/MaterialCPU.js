import { Vector2, MeshMatcapMaterial, ShaderMaterial, Vector3 } from "three";
import { noise } from './noise.js';

export class MaterialCPU extends MeshMatcapMaterial {
    constructor({ color, wireframe, matcap, uniforms }) {
        super({ color, wireframe, matcap });

        this.onBeforeCompile = (shader) => {

            shader.uniforms.u_pointPosition = uniforms.u_pointPosition;


            shader.vertexShader = /*glsl*/ `
            uniform vec3 u_pointPosition;
                    
            float rand1(vec2 n) { 
	            return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
            }
            float noise(vec2 p){
                vec2 ip = floor(p);
                vec2 u = fract(p);
                u = u*u*(3.0-2.0*u);
                
                float res = mix(
                    mix(rand1(ip),rand1(ip+vec2(1.0,0.0)),u.x),
                    mix(rand1(ip+vec2(0.0,1.0)),rand1(ip+vec2(1.0,1.0)),u.x),u.y);
                return res*res;
            }
            
            ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
                "#include <displacementmap_vertex>",
            /*glsl*/ `#include <displacementmap_vertex>       
            // vec3 n =  normalMatrix * normal;
            // vec3 dipslacedposition = transformed + noise(u_pointPosition.xy )  * normal ;
            // vec3 dipslacedposition = mainPosition;
            // vec3 tangent = ortohonal(normal );
            // vec3 bitangent = normalize(cross(tangent, normal ));
            // vec3 neighbour1 = transformed + tangent * 0.0001;
            // vec3 neighbour2 = transformed + bitangent * 0.0001;
            // vec3 displacedN1 = neighbour1 + amp * normal  * distorted_position(neighbour1);
            // vec3 displacedN2 = neighbour2 + amp * normal  * distorted_position(neighbour2);
            // vec3 dipslacedTangent = normalize(displacedN1 - dipslacedposition);
            // vec3 dipslacedBitangent = normalize(displacedN2 - dipslacedposition);
            // vec3 dipslacedNormal = normalize(cross(dipslacedBitangent, dipslacedTangent));
            // vNormal = normalMatrix * dipslacedNormal;
            // transformed = dipslacedposition; 
            `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <output_fragment>",
            /*glsl*/ `#include <output_fragment>       
        
            // diffuseColor = vec4( 1.0,1.0,1.0,1.0);
            
            // gl_FragColor = diffuseColor.rgb ; `

            );

        };
    }
}

