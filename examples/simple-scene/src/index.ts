import { Engine } from "../../../src/Engine";
import { Scene } from "../../../src/Scene";
import { vec3 } from "gl-matrix";
import { OrbitCamera } from "../../../src/cameras/OrbitCamera";
import { GameObject } from "../../../src/GameObject";
import { createAttributesFromArrays } from "../../../src/webgl/utils";
import { loadGLB } from "../../../src/webgl/gltf";
import { AnimationState } from "../../../src/animation/AnimationState";
import { TranslationAnimationChannel } from "../../../src/animation/TranslationAnimationChannel";

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
scene.pointLights[0].position = vec3.fromValues(0, 5, 0);
scene.pointLights[0].color = vec3.fromValues(1, 1, 1);

function createExplosion(
	north: number,
	east: number,
	south: number,
	west: number
) {
	const vertices = [
		-0.5,
		0,
		-0.5, // nw
		0.5,
		0,
		-0.5, // ne
		0.5,
		0,
		0.5, // se
		-0.5,
		0,
		0.5, // sw
	];
	const indices = [0, 1, 2, 2, 3, 0];

	if (north) {
		vertices.push(-0.5, 0, -0.5 - north);
		vertices.push(0.5, 0, -0.5 - north);
		indices.push(vertices.length - 2, vertices.length - 1, vertices[1]);
		indices.push(vertices[1], vertices[0], vertices.length - 2);
	}

	return createAttributesFromArrays(engine.gl, {
		position: {
			numComponents: 3,
			data: vertices,
		},
		indices: {
			numComponents: 3,
			data: indices,
		},
	});
}

const model = loadGLB(engine.gl, engine.programs.standard, require('./explosion.glb'));
const bigger = new AnimationState();
bigger.channels.push(new TranslationAnimationChannel(model.getObjectById('Bone.001', true), [0, 5], [
  vec3.fromValues(0, 1, 0),
  vec3.fromValues(0, 2, 0)
]));
model.animation.registerState('Bigger', bigger);
model.animation.initialState = 'Bigger';

scene.addGameObject(model);

engine.scene = scene;
engine.start();
