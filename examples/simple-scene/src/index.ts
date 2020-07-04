import { Engine } from "../../../src/Engine";
import { Scene } from "../../../src/Scene";
import { vec3 } from "gl-matrix";
import { loadGLB, loadGLTF } from "../../../src/webgl/gltf";
import { OrbitCamera } from "../../../src/cameras/OrbitCamera";
import { AnimationWrapMode } from "../../../src/animation/AnimationState";
import {
	createAttributesFromArrays,
	createSkyboxTexture,
	createTexture,
	sprite,
} from "../../../src/webgl/utils";
import { quad } from "../../../src/webgl/primitives";
import { GameObject } from "../../../src/GameObject";

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

document.body.appendChild(canvas);

const engine = new Engine(canvas);

const mushroom = loadGLB(
	engine.gl,
	engine.programs.standard,
	require("./map.glb")
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

const scene = new Scene();
scene.camera = orbitCamera;
scene.pointLights[0].position = vec3.fromValues(0, 5, 5);
scene.pointLights[0].color = vec3.fromValues(1, 1, 1);

scene.loadSkymap(engine.gl, engine.programs.skybox, {
	negativeX: require("./skybox1.jpg").default,
	negativeY: require("./skybox2.jpg").default,
	negativeZ: require("./skybox3.jpg").default,
	positiveX: require("./skybox4.jpg").default,
	positiveY: require("./skybox5.jpg").default,
	positiveZ: require("./skybox6.jpg").default,
});

const textCtx = document.createElement("canvas").getContext("2d");

// Puts text in center of canvas.
function makeTextCanvas(text: string, width: number, height: number) {
	textCtx.canvas.width = width;
	textCtx.canvas.height = height;
	textCtx.transform(1, 0, 0, -1, 0, textCtx.canvas.height);
	textCtx.font = "20px monospace";
	textCtx.textAlign = "center";
	textCtx.textBaseline = "middle";
	textCtx.fillStyle = "black";
	textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
	textCtx.fillText(text, width / 2, height / 2);
	return textCtx.canvas;
}

const g = sprite(engine, makeTextCanvas("hmmm", 100, 50));
g.scale = vec3.fromValues(0.25, 0.15, 1);

scene.addGameObject(mushroom);
scene.addGameObject(g);

engine.scene = scene;
engine.start();
