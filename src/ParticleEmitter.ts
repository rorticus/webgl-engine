import { vec3, vec4 } from "gl-matrix";
import { GameObject } from "./GameObject";
import { GameComponentContext, SceneRenderContext } from "./interfaces";
import { GlAccessorType, ProgramInfo } from "./webgl/interfaces";
import {
	createBufferFromTypedArray,
	numberOfComponentsForType,
	setBuffersAndAttributes,
	setUniforms,
	updateBuffer,
} from "./webgl/utils";

export interface Particle {
	position: vec3;
	size: number;
	color: vec4;
	life: number;
	lifeElapsed: number;
	velocity: vec3;
}

export interface EmitModel {
	(): [position: vec3, velocity: vec3];
}

function randBetween(a: number, b: number) {
	return a + Math.random() * (b - a);
}

export function createConicalEmitter(originRadius: number, dispersalRadius: number) {
	const origin = vec3.create();

	return () => {

		// start point
		const startDist = randBetween(0, originRadius);
		const startAngle = randBetween(0, 360);

		const start = vec3.fromValues(
			startDist, 
			0, 
			0);
		vec3.rotateY(start, start, origin, startAngle * Math.PI / 180);
		
		// end
		const endDist = randBetween(0, dispersalRadius);
		const endAngle = randBetween(0, 360);

		const end = vec3.fromValues(
			endDist, 
			1,
			0);
		vec3.rotateY(end, end, origin, endAngle * Math.PI / 180);

		const velocity = vec3.create();
		vec3.subtract(velocity, end, start);
		vec3.normalize(velocity, velocity);

		return [
			start,
			velocity
		] as [position: vec3, velocity: vec3];
	};
}

export class ParticleEmitter extends GameObject {
	particles: Particle[] = [];
	particleProgramInfo: ProgramInfo;

	private _particlesPerSecond = 50;
	private _particleLifeMin = 0.5;
	private _particleLifeMax = 2;
	private _particleSizeMin = 0.1;
	private _particleSizeMax = 0.2;
	private _gravity = vec3.fromValues(0, -1, 0);

	private _positionArray!: Float32Array;
	private _sizeArray!: Float32Array;
	private _colorArray!: Float32Array;
	private _lifeArray!: Float32Array;

	private _positionBuffer: WebGLBuffer | undefined;
	private _sizeBuffer: WebGLBuffer | undefined;
	private _colorBuffer: WebGLBuffer | undefined;
	private _lifeBuffer: WebGLBuffer | undefined;

	emitModel: EmitModel;

	private _particleTimer = 0;

	constructor(programInfo: ProgramInfo) {
		super();
		this.particleProgramInfo = programInfo;
		this.emitModel = createConicalEmitter(0.1, 0.2);

		this.generateBuffers();
	}

	private generateBuffers() {
		const maxParticles = this._particleLifeMax * this._particlesPerSecond;

		this._positionArray = new Float32Array(maxParticles * 3);
		this._sizeArray = new Float32Array(maxParticles);
		this._colorArray = new Float32Array(maxParticles * 4);
		this._lifeArray = new Float32Array(maxParticles);
	}

	render(context: SceneRenderContext) {
		const gl = context.gl;

		if (context.phase !== 'alpha') {
			context.addToRenderPhase('alpha', this);
			return;
		}

		if (
			!this._positionBuffer ||
			!this._sizeBuffer ||
			!this._colorBuffer ||
			!this._lifeBuffer
		) {
			this._positionBuffer = createBufferFromTypedArray(
				gl,
				new Float32Array(0)
			);
			this._sizeBuffer = createBufferFromTypedArray(gl, new Float32Array(0));
			this._colorBuffer = createBufferFromTypedArray(gl, new Float32Array(0));
			this._lifeBuffer = createBufferFromTypedArray(gl, new Float32Array(0));
		}

		gl.useProgram(this.particleProgramInfo.program);

		const viewport = gl.getParameter(gl.VIEWPORT);
		const fovy = 60;
		const heightOfNearPlane =
			Math.abs(viewport[3] - viewport[1]) /
			(2 * Math.tan((0.5 * fovy * Math.PI) / 180.0));

		setUniforms(this.particleProgramInfo, {
			u_projectionMatrix: context.projectionMatrix,
			u_matrix: this.worldMatrix,
			u_heightOfNearPlane: heightOfNearPlane,
		});

		for (let i = 0; i < this.particles.length; i++) {
			this._positionArray[i * 3 + 0] = this.particles[i].position[0];
			this._positionArray[i * 3 + 1] = this.particles[i].position[1];
			this._positionArray[i * 3 + 2] = this.particles[i].position[2];

			this._sizeArray[i] = this.particles[i].size;

			this._colorArray[i * 4 + 0] = this.particles[i].color[0];
			this._colorArray[i * 4 + 1] = this.particles[i].color[1];
			this._colorArray[i * 4 + 2] = this.particles[i].color[2];
			this._colorArray[i * 4 + 3] = this.particles[i].color[3];

			this._lifeArray[i] =
				this.particles[i].lifeElapsed / this.particles[i].life;
		}

		updateBuffer(gl, this._positionBuffer, this._positionArray);
		updateBuffer(gl, this._sizeBuffer, this._sizeArray);
		updateBuffer(gl, this._colorBuffer, this._colorArray);
		updateBuffer(gl, this._lifeBuffer, this._lifeArray);

		setBuffersAndAttributes(gl, this.particleProgramInfo, {
			attribs: {
				a_position: {
					buffer: this._positionBuffer,
					numItems: this.particles.length,
					itemSize: numberOfComponentsForType(GlAccessorType.VEC3),
					type: gl.STATIC_DRAW,
					normalize: false,
					stride: 0,
					offset: 0,
					componentType: gl.FLOAT,
				},
				a_size: {
					buffer: this._sizeBuffer,
					numItems: this.particles.length,
					itemSize: numberOfComponentsForType(GlAccessorType.SCALAR),
					type: gl.STATIC_DRAW,
					normalize: false,
					stride: 0,
					offset: 0,
					componentType: gl.FLOAT,
				},
				a_color: {
					buffer: this._colorBuffer,
					numItems: this.particles.length,
					itemSize: numberOfComponentsForType(GlAccessorType.VEC4),
					type: gl.STATIC_DRAW,
					normalize: false,
					stride: 0,
					offset: 0,
					componentType: gl.FLOAT,
				},
				a_life: {
					buffer: this._lifeBuffer,
					numItems: this.particles.length,
					itemSize: numberOfComponentsForType(GlAccessorType.SCALAR),
					type: gl.STATIC_DRAW,
					normalize: false,
					stride: 0,
					offset: 0,
					componentType: gl.FLOAT,
				}
			},
		});

		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		gl.drawArrays(gl.POINTS, 0, this.particles.length);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	}

	update(context: GameComponentContext) {
		super.update(context);

		const perSec = 1 / this._particlesPerSecond;

		this._particleTimer += context.deltaInSeconds;
		while (this._particleTimer > perSec) {
			this._particleTimer -= perSec;

			const props = this.emitModel();

			this.particles.push({
				position: props[0],
				size: randBetween(this._particleSizeMin, this._particleSizeMax),
				life: randBetween(this._particleLifeMin, this._particleLifeMax),
				color: vec4.fromValues(1, 1, 1, 1),
				lifeElapsed: 0,
				velocity: props[1],
			});
		}

		const deletion: Particle[] = [];

		const delta = vec3.create();

		this.particles.forEach((particle) => {
			vec3.scale(delta, particle.velocity, context.deltaInSeconds);
			vec3.add(particle.position, particle.position, delta);
			particle.lifeElapsed += context.deltaInSeconds;

			if (particle.lifeElapsed >= particle.life) {
				deletion.push(particle);
			}
		});

		deletion.forEach((p) =>
			this.particles.splice(this.particles.indexOf(p), 1)
		);
	}
}

export default ParticleEmitter;
