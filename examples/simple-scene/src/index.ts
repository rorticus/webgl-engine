import { Engine } from "../../../src/Engine";
import { Scene } from "../../../src/Scene";
import { GameObject } from "../../../src/GameObject";
import { vec3 } from "gl-matrix";
import { createCubeVertices, triangle } from "../../../src/webgl/primitives";
import {
	createAttributesFromArrays,
	createSkyboxTexture,
} from "../../../src/webgl/utils";
import { createProgram } from "../../../src/webgl/program";
import { GameComponent } from "../../../src/components/GameComponent";
import { loadGLTF } from "../../../src/webgl/gltf";
import { OrbitCamera } from "../../../src/cameras/OrbitCamera";

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

// const joint1 = texturedCube.getObjectById("leg_joint_L_1", true);
// joint1.rotate(0,  (45 * Math.PI) / 180, 0);

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
orbitCamera.azimuth = 45 * Math.PI / 180;

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

scene.addGameObject(texturedCube);

engine.scene = scene;
engine.start();
