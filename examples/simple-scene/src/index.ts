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
uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;
 
attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;
 
varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;
 
void main() {
  v_texCoord = a_texcoord;
  v_position = (u_worldViewProjection * a_position);
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
  gl_Position = v_position;
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
