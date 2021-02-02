import { vec3 } from "gl-matrix";
import { OrbitCamera } from "../../../src/cameras/OrbitCamera";
import { Engine } from "../../../src/Engine";
import { GameComponentContext } from "../../../src/interfaces";
import { Scene } from "../../../src/Scene";
import { KeyboardKey } from "../../../src/services/KeyboardService";
import { loadGLB } from "../../../src/webgl/gltf";

const stepSound = require("./step.mp3");

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

document.body.appendChild(canvas);

const engine = new Engine(canvas);

engine.soundService.loadSoundEffect("step", stepSound);

const orbitCamera = new OrbitCamera();
orbitCamera.position = vec3.fromValues(0, 3, 5);
orbitCamera.lookAt = vec3.fromValues(0, 2, 0);

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

orbitCamera.radius = 7;
orbitCamera.elevation = 5;
orbitCamera.azimuth = (45 * Math.PI) / 180;
orbitCamera.lookAt = vec3.fromValues(0, 2, 0);

const scene = new Scene();
scene.camera = orbitCamera;
scene.pointLights[0].position = vec3.fromValues(2, 2, 0);
scene.pointLights[0].color = vec3.fromValues(1, 1, 1);

scene.pointLights[1].position = vec3.fromValues(0, 1, -2);
scene.pointLights[1].color = vec3.fromValues(1, 1, 1);

const model = loadGLB(
	engine.gl,
	engine.programs.standard,
	require("./cube-up-down.glb")
);
model.animation.initialState = "CubeAction";
model.animation.getState('CubeAction').addSoundAction(model, 2.2, 2.2 + 0.33, 'step');
scene.addGameObject(model);

model.addComponent((context: GameComponentContext) => {
	if(context.engine.keyboardService.pressed(KeyboardKey.A)) {
		console.log('A');
	}
})

engine.scene = scene;
engine.start();

document.body.addEventListener('click', () => engine.soundService.resume());
