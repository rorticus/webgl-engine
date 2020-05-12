import { Engine } from "../../../engine/Engine";
import { Scene } from "../../../engine/Scene";
import { GameObject } from "../../../engine/GameObject";
import { vec3 } from "gl-matrix";
import { createCubeVertices } from "../../../engine/webgl/primitives";
import { createAttributesFromArrays } from "../../../engine/webgl/utils";
import { createProgram } from "../../../engine/webgl/program";

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

const simpleVertex = `
uniform mat4 u_matrix;

attribute vec4 a_position;
 
void main() {
  gl_Position = u_matrix * a_position;
}`;

const simpleFragment = `
precision mediump float;

void main() {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

document.body.appendChild(canvas);

const engine = new Engine(canvas);

const program = createProgram(engine.gl, simpleVertex, simpleFragment);

const scene = new Scene();

const testObj = new GameObject();
testObj.position = vec3.fromValues(0, 0, 0);
testObj.renderable = {
	programInfo: program,
	uniforms: {},
	attributes: createAttributesFromArrays(engine.gl, createCubeVertices(10)),
};

scene.addGameObject(testObj);

engine.scene = scene;
engine.start();
