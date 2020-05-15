import { Engine } from "../../../engine/Engine";
import { Scene } from "../../../engine/Scene";
import { GameObject } from "../../../engine/GameObject";
import { vec3 } from "gl-matrix";
import { createCubeVertices, triangle } from "../../../engine/webgl/primitives";
import { createAttributesFromArrays } from "../../../engine/webgl/utils";
import { createProgram } from "../../../engine/webgl/program";
import { GameComponent } from "../../../engine/components/GameComponent";

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

const simpleVertex = `
uniform mat4 u_matrix;
uniform mat4 u_projectionMatrix;

attribute vec3 a_position;
 
void main() {
  gl_Position = u_projectionMatrix * u_matrix * vec4(a_position, 1.0);
  gl_PointSize = 10.0;
}`;

const simpleFragment = `
precision mediump float;

void main() {
  gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
}
`;

class Rotater implements GameComponent {
	priority = 1;

	update(gameObject: GameObject, deltaInSeconds: number): void {
		gameObject.rotate(0.01, 0.01, 0);
	}
}

document.body.appendChild(canvas);

const engine = new Engine(canvas);

const program = createProgram(engine.gl, simpleVertex, simpleFragment);

const scene = new Scene();

const cubeModel = createCubeVertices(3);

function createCube(pos: number[]) {
	const cube = new GameObject();
	cube.position = vec3.fromValues(pos[0], pos[1], pos[2]);
	cube.renderable = {
		programInfo: program,
		uniforms: {},
		attributes: createAttributesFromArrays(engine.gl, cubeModel),
	};
	cube.addComponent(new Rotater());

	const subCube = new GameObject();
	subCube.position = vec3.fromValues(0, -4, 0);
	subCube.renderable = {
		programInfo: program,
		uniforms: {},
		attributes: createAttributesFromArrays(engine.gl, cubeModel)
	};
	subCube.scale = vec3.fromValues(0.25, 0.25, 0.25);
	subCube.addComponent(new Rotater());

	cube.add(subCube);

	return cube;
}

const rotate = () => {
	scene.camera.cameraAngleInRadians += 0.01;
	setTimeout(rotate, 33);
};
// rotate();

for (let y = -2; y < 2; y++) {
	for (let x = -2; x < 2; x++) {
		scene.addGameObject(createCube([x * 4, 0, y * 4]));
	}
}

engine.scene = scene;
engine.start();
