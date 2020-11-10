import { GameObject } from "./GameObject";
import { Scene } from "./Scene";
import { MouseService } from "./services/MouseService";
import { ProgramInfo } from "./webgl/interfaces";
import { createProgram } from "./webgl/program";

import {
	fragmentShader as standardFragmentShader,
	vertexShader as standardVertexShader,
} from "./webgl/shaders/standard";

import {
	vertexShader as skyboxVertexShader,
	fragmentShader as skyboxFragmentShader,
} from "./webgl/shaders/skybox";

import {
	vertexShader as spriteVertexShader,
	fragmentShader as spriteFragmentShader,
} from "./webgl/shaders/sprite";

import {
	vertexShader as particlesVertexShader,
	fragmentShader as particlesFragmentShader,
} from "./webgl/shaders/particles";

import { KeyboardService } from "./services/KeyboardService";
import { StandardMaterialInstance } from "./StandardMaterialInstance";

interface Programs {
	standard: ProgramInfo;
	skybox: ProgramInfo;
	sprite: ProgramInfo;
	particle: ProgramInfo;
}

export class Engine {
	private _canvas: HTMLCanvasElement;
	private _paused: boolean;
	private _lastFrameTime: number;
	private _gdt: number;
	private _step: number = 1;
	private _scene: Scene;
	private _gl: WebGLRenderingContext;

	backgroundColor = [0, 0, 0];

	fpsUpdated?: (fps: number) => void;

	programs: Programs;

	mouseService: MouseService;
	keyboardService: KeyboardService;

	get gl() {
		return this._gl;
	}

	set fps(value: number) {
		this._step = 1 / value;
	}

	set scene(value: Scene) {
		this._scene = value;
	}

	constructor(canvas: HTMLCanvasElement) {
		this._canvas = canvas;

		const names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];

		let gl: WebGLRenderingContext | null = null;

		for (let i = 0; i < names.length; i++) {
			try {
				gl = canvas.getContext(names[i], {
					premultipliedAlpha: false,
				}) as WebGLRenderingContext;
				break;
			} catch (e) {}
		}

		if (gl === null) {
			throw new Error("Failed to initialize webgl");
		}

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

		// getting this extension has the side effect of allowing gl.FLOAT texture types (which we need for skinning)
		gl.getExtension("OES_texture_float");
		gl.getExtension("OES_element_index_uint");

		this.programs = {
			standard: createProgram(gl, standardVertexShader, standardFragmentShader, new StandardMaterialInstance()),
			skybox: createProgram(gl, skyboxVertexShader, skyboxFragmentShader),
			sprite: createProgram(gl, spriteVertexShader, spriteFragmentShader),
			particle: createProgram(
				gl,
				particlesVertexShader,
				particlesFragmentShader
			),
		};

		this._gl = gl;
		this._paused = true;
		this._lastFrameTime = 0;
		this._gdt = 0;
		this.fps = 30;
		this._scene = new Scene();

		this.mouseService = new MouseService(canvas);
		this.keyboardService = new KeyboardService();

		let elapsedTime = 0;
		let frameCount = 0;
		const frame = () => {
			const now = Date.now();
			const dt = Math.min(1, (now - this._lastFrameTime) / 1000);
			this._gdt += dt;

			while (this._gdt > this._step) {
				this._gdt -= this._step;
				this.update(this._step);
			}

			this.render();

			frameCount++;
			this._lastFrameTime = now;

			elapsedTime += dt;

			if (elapsedTime > 1) {
				this.fpsUpdated && this.fpsUpdated(frameCount);
				frameCount = 0;
				elapsedTime -= 1;
			}

			requestAnimationFrame(frame);
		};

		frame();
	}

	start() {
		this._paused = false;

		this._lastFrameTime = 0;
		this._gdt = 0;
	}

	pause() {
		this._paused = true;
	}

	update(deltaInSeconds: number) {
		if (this._paused) {
			return;
		}

		this._scene.update({
			engine: this,
			deltaInSeconds,
		});

		this.keyboardService.clearPressState();
	}

	render() {
		const viewportWidth = this._canvas.width;
		const viewportHeight = this._canvas.height;

		const gl = this._gl;

		gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], 1);
		gl.enable(gl.DEPTH_TEST);
		gl.viewport(0, 0, viewportWidth, viewportHeight);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		this._scene.render(viewportWidth, viewportHeight, gl);
	}
}
