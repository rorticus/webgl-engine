import { Engine } from "../../../src/Engine";
import { Scene } from "../../../src/Scene";
import { vec3 } from "gl-matrix";
import { OrbitCamera } from "../../../src/cameras/OrbitCamera";
import { GameObject } from "../../../src/GameObject";
import { createAttributesFromArrays } from "../../../src/webgl/utils";
import { loadGLB } from "../../../src/webgl/gltf";
import { AnimationState } from "../../../src/animation/AnimationState";
import { TranslationAnimationChannel } from "../../../src/animation/TranslationAnimationChannel";
import { ParticleEmitter } from '../../../src/ParticleEmitter';

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

document.body.appendChild(canvas);

const engine = new Engine(canvas);

const orbitCamera = new OrbitCamera();

let ox = 0,
	oy = 0;
let dragging = false;

function frame() {
	if (!dragging && engine.mouseService.leftMouseDown) {
		dragging = true;
		ox = engine.mouseService.pointerX;
		oy = engine.mouseService.pointerY;
	} else if (dragging && engine.mouseService.leftMouseDown) {
		orbitCamera.azimuth +=
			((engine.mouseService.pointerX - ox) * -Math.PI) / 128;
		orbitCamera.elevation +=
			((engine.mouseService.pointerY - oy) * -Math.PI) / 128;

		ox = engine.mouseService.pointerX;
		oy = engine.mouseService.pointerY;
	} else if (dragging && !engine.mouseService.leftMouseDown) {
		dragging = false;
	}
	requestAnimationFrame(frame);
}
frame();

orbitCamera.radius = 5;
orbitCamera.elevation = 5;
orbitCamera.azimuth = (45 * Math.PI) / 180;
orbitCamera.lookAt = vec3.fromValues(0, 0, 0);

const scene = new Scene();
scene.camera = orbitCamera;
scene.pointLights[0].position = vec3.fromValues(2, 2, 0);
scene.pointLights[0].color = vec3.fromValues(1, 1, 1);

scene.pointLights[1].position = vec3.fromValues(0, 1, -2);
scene.pointLights[1].color = vec3.fromValues(1, 1, 1);

const emitter = new ParticleEmitter(engine.programs.particle);

emitter.particles.push({
	position: vec3.fromValues(0, 0, 0),
	size: 0.25
});

emitter.particles.push({
	position: vec3.fromValues(1, 0, 0),
	size: 0.25
});


scene.addGameObject(emitter);

engine.scene = scene;
engine.start();
