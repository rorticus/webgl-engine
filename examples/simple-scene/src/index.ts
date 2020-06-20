import {Engine} from "../../../src/Engine";
import {Scene} from "../../../src/Scene";
import {vec3} from "gl-matrix";
import {loadGLTF} from "../../../src/webgl/gltf";
import {OrbitCamera} from "../../../src/cameras/OrbitCamera";
import {AnimationWrapMode} from "../../../src/animation/AnimationState";

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

document.body.appendChild(canvas);

const engine = new Engine(canvas);

const texturedCube = loadGLTF(
	engine.gl,
	engine.programs.standard,
	require("./fox.json")
);
texturedCube.animation.initialState = 'Survey';

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

orbitCamera.radius = 150;
orbitCamera.elevation = 150;
orbitCamera.azimuth = (45 * Math.PI) / 180;

const scene = new Scene();
scene.camera = orbitCamera;
scene.pointLights[0].position = vec3.fromValues(0, 5, 150);
scene.pointLights[0].color = vec3.fromValues(1, 1, 1);

scene.loadSkymap(engine.gl, engine.programs.skybox, {
	negativeX: require("./skybox1.jpg").default,
	negativeY: require("./skybox2.jpg").default,
	negativeZ: require("./skybox3.jpg").default,
	positiveX: require("./skybox4.jpg").default,
	positiveY: require("./skybox5.jpg").default,
	positiveZ: require("./skybox6.jpg").default,
});

texturedCube.animation.addTransition('Survey', 'Run', (context, gameObject, duration) => {
	return duration > 5;
}, 5);

texturedCube.animation.addTransition('Run', 'Survey', (context, gameObject, duration) => {
	return duration > 5;
}, 5);

scene.addGameObject(texturedCube);

engine.scene = scene;
engine.start();
