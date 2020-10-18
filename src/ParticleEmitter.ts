import { vec3 } from "gl-matrix";
import { projection } from "gl-matrix/src/gl-matrix/mat3";
import { GameObject } from "./GameObject";
import { SceneRenderContext } from "./interfaces";
import { GlAccessorType, ProgramInfo } from "./webgl/interfaces";
import { createBufferFromTypedArray, numberOfComponentsForType, setBuffersAndAttributes, setUniforms } from "./webgl/utils";

export interface Particle {
    position: vec3;
    size: number;
}

export class ParticleEmitter extends GameObject {
    particles: Particle[] = [];
    particleProgramInfo: ProgramInfo;

    constructor(programInfo: ProgramInfo) {
        super();
        this.particleProgramInfo = programInfo;
    }

    render(context: SceneRenderContext) {
        const gl = context.gl;

        gl.useProgram(this.particleProgramInfo.program);

        const viewport = gl.getParameter(gl.VIEWPORT);
        const fovy = 60;
        const heightOfNearPlane = Math.abs(viewport[3] - viewport[1]) / (2 * Math.tan(0.5 * fovy * Math.PI / 180.0));

        setUniforms(this.particleProgramInfo, {
            u_projectionMatrix: context.projectionMatrix,
            u_matrix: this.worldMatrix,
            u_heightOfNearPlane: heightOfNearPlane
        });

        const positionArray = new Float32Array(this.particles.length * 3);
        const sizeArray = new Float32Array(this.particles.length);

        for(let i = 0; i < this.particles.length; i++) {
            positionArray[i * 3 + 0] = this.particles[i].position[0];
            positionArray[i * 3 + 1] = this.particles[i].position[1];
            positionArray[i * 3 + 2] = this.particles[i].position[2];

            sizeArray[i] = this.particles[i].size;
        }

        setBuffersAndAttributes(gl, this.particleProgramInfo, {
            attribs: {
                a_position: {
                    buffer: createBufferFromTypedArray(
                        gl,
                        positionArray
                    ),
                    numItems: this.particles.length,
                    itemSize: numberOfComponentsForType(GlAccessorType.VEC3),
                    type: gl.STATIC_DRAW,
                    normalize: false,
                    stride: 0,
                    offset: 0,
                    componentType: gl.FLOAT
                },
                a_size: {
                    buffer: createBufferFromTypedArray(
                        gl,
                        sizeArray
                    ),
                    numItems: this.particles.length,
                    itemSize: numberOfComponentsForType(GlAccessorType.SCALAR),
                    type: gl.STATIC_DRAW,
                    normalize: false,
                    stride: 0,
                    offset: 0,
                    componentType: gl.FLOAT
                }
            }
        });

        gl.drawArrays(
            gl.POINTS,
            0,
            this.particles.length
        );
    }
}

export default ParticleEmitter;
