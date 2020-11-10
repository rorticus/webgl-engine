import { Engine } from "../../../src/Engine";
import { Scene } from "../../../src/Scene";
import { vec3, vec4 } from "gl-matrix";
import { OrbitCamera } from "../../../src/cameras/OrbitCamera";
import { GameObject } from "../../../src/GameObject";
import {
	createAttributesFromArrays,
	createTexture,
	loadTextureFromSource,
} from "../../../src/webgl/utils";
import { loadGLB } from "../../../src/webgl/gltf";
import { AnimationState } from "../../../src/animation/AnimationState";
import { TranslationAnimationChannel } from "../../../src/animation/TranslationAnimationChannel";
import {
	createConicalEmitter,
	ParticleEmitter,
} from "../../../src/ParticleEmitter";
import { StandardMaterialInstance } from "../../../src/StandardMaterialInstance";
import { Camera } from "../../../src/Camera";

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

document.body.appendChild(canvas);

const engine = new Engine(canvas);

const orbitCamera = new Camera();
orbitCamera.position = vec3.fromValues(0, 3, 5);
orbitCamera.lookAt = vec3.fromValues(0, 2, 0);

let ox = 0,
	oy = 0;
let dragging = false;

// function frame() {
// 	if (!dragging && engine.mouseService.leftMouseDown) {
// 		dragging = true;
// 		ox = engine.mouseService.pointerX;
// 		oy = engine.mouseService.pointerY;
// 	} else if (dragging && engine.mouseService.leftMouseDown) {
// 		orbitCamera.azimuth +=
// 			((engine.mouseService.pointerX - ox) * -Math.PI) / 128;
// 		orbitCamera.elevation +=
// 			((engine.mouseService.pointerY - oy) * -Math.PI) / 128;

// 		ox = engine.mouseService.pointerX;
// 		oy = engine.mouseService.pointerY;
// 	} else if (dragging && !engine.mouseService.leftMouseDown) {
// 		dragging = false;
// 	}
// 	requestAnimationFrame(frame);
// }
// frame();

// orbitCamera.radius = 5;
// orbitCamera.elevation = 5;
// orbitCamera.azimuth = (45 * Math.PI) / 180;
// orbitCamera.lookAt = vec3.fromValues(0, 2, 0);

const scene = new Scene();
scene.camera = orbitCamera;
scene.pointLights[0].position = vec3.fromValues(2, 2, 0);
scene.pointLights[0].color = vec3.fromValues(1, 1, 1);

scene.pointLights[1].position = vec3.fromValues(0, 1, -2);
scene.pointLights[1].color = vec3.fromValues(1, 1, 1);

const model = loadGLB(
	engine.gl,
	engine.programs.standard,
	require("./character1.glb")
);
const params = new StandardMaterialInstance();
params.outlineColor = vec4.fromValues(0, 0, 1, 0);
model.children[0].children[0].renderable.materialInstance = params;
scene.addGameObject(model);

engine.scene = scene;
engine.start();
