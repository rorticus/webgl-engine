import { Engine } from "../../../src/Engine";
import { Scene } from "../../../src/Scene";
import { vec3 } from "gl-matrix";
import { loadGLB } from "../../../src/webgl/gltf";
import { OrbitCamera } from "../../../src/cameras/OrbitCamera";
import { AnimationWrapMode } from "../../../src/animation/AnimationState";

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

document.body.appendChild(canvas);

const engine = new Engine(canvas);

const mushroom = loadGLB(
	engine.gl,
	engine.programs.standard,
	require("./bomb.glb")
);

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
scene.pointLights[0].position = vec3.fromValues(0, 5, 5);
scene.pointLights[0].color = vec3.fromValues(1, 1, 1);

mushroom.animation.configure('Spawn', {
	wrap: AnimationWrapMode.None
});

mushroom.animation.initialState = "Spawn";

console.log(mushroom.animation.states);

scene.addGameObject(mushroom);

engine.scene = scene;
engine.start();
