import { Engine } from "../../../engine/Engine";
import { Scene } from "../../../engine/Scene";
import { GameObject } from "../../../engine/GameObject";
import { vec3 } from "gl-matrix";
import { createCubeVertices, triangle } from "../../../engine/webgl/primitives";
import { createAttributesFromArrays } from "../../../engine/webgl/utils";
import { createProgram } from "../../../engine/webgl/program";
import { GameComponent } from "../../../engine/components/GameComponent";
import {loadGLTF} from "../../../engine/webgl/gltf";

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

const gltf = require('./banana.json');

const simpleVertex = `
const int NUM_POSITIONAL_LIGHTS = 2;

uniform mat4 u_matrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_worldInverseTranspose;
uniform vec3 u_lightWorldPosition[NUM_POSITIONAL_LIGHTS];

attribute vec3 a_position;
attribute vec3 a_normal;

varying vec3 v_normal;
varying vec3 v_surfaceToLight[NUM_POSITIONAL_LIGHTS];
varying vec3 v_position;
 
void main() {
  vec4 surfacePosition = u_matrix * vec4(a_position, 1.0);
	
  gl_Position = u_projectionMatrix * surfacePosition;
  v_normal = mat3(u_worldInverseTranspose) * a_normal;
  v_position = surfacePosition.xyz; 
  
  // point lighting
  vec3 surfaceWorldPosition = surfacePosition.xyz;
  
  for(int i = 0; i < NUM_POSITIONAL_LIGHTS; i++) {
  	vec4 lightPosition = vec4(u_lightWorldPosition[i], 1.0);
  	v_surfaceToLight[i] = surfaceWorldPosition - lightPosition.xyz;
  }  
}`;

const simpleFragment = `
precision mediump float;

uniform vec3 u_color;
uniform vec3 u_ambientColor;

const int NUM_POSITIONAL_LIGHTS = 2;

varying vec3 v_normal;
varying vec3 v_surfaceToLight[NUM_POSITIONAL_LIGHTS];
uniform vec3 u_lightWorldColor[NUM_POSITIONAL_LIGHTS];
varying vec3 v_position;

vec3 calculateAmbientColor(void) {
	return u_ambientColor;
}

vec3 calculatePositionalLights(vec3 normal) {
	vec3 diffuse = vec3(0.0, 0.0, 0.0);
	
	for(int i = 0; i < NUM_POSITIONAL_LIGHTS; i++) {
		vec3 lightDirection = normalize(v_surfaceToLight[i]);
		float light = max(dot(normal, -lightDirection), 0.0);
		
		diffuse += u_lightWorldColor[i] * u_color * light;				
	}
	
	return diffuse;
}

void main() {
	vec3 normal = normalize(v_normal);
	
	vec3 iSpecular = vec3(0.0, 0.0, 0.0);
		
	vec3 iColor = calculateAmbientColor() + calculatePositionalLights(normal) + iSpecular;
				
  	gl_FragColor = vec4(iColor, 1.0);
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

const cubeMeshes = loadGLTF(engine.gl, gltf);

const program = createProgram(engine.gl, simpleVertex, simpleFragment);

const scene = new Scene();
scene.pointLights[0].position = vec3.fromValues(0, 0, 15);
scene.pointLights[0].color = vec3.fromValues(1, 1, 1);

// scene.pointLights[1].position = vec3.fromValues(10, 0, 0);
// scene.pointLights[1].color = vec3.fromValues(1, 1, 1);

function createCube(pos: number[]) {
	const cube = new GameObject();
	cube.position = vec3.fromValues(pos[0], pos[1], pos[2]);
	cube.renderable = {
		programInfo: program,
		renderables: cubeMeshes.meshes['Mesh banana']
	};
	// cube.scale = vec3.fromValues(1, 1, 0.25);
	// cube.rotateX(Math.PI);
	cube.addComponent(new Rotater());

	// const subCube = new GameObject();
	// subCube.position = vec3.fromValues(0, -4, 0);
	// subCube.renderable = {
	// 	programInfo: program,
	// 	uniforms: {
	// 		u_color: vec3.fromValues(1.0, 1.0, 0.0)
	// 	},
	// 	attributes: createAttributesFromArrays(engine.gl, cubeModel)
	// };
	// subCube.scale = vec3.fromValues(0.25, 0.25, 0.25);
	// subCube.addComponent(new Rotater());

	// cube.add(subCube);

	return cube;
}

const rotate = () => {
	scene.camera.cameraAngleInRadians += 0.01;
	setTimeout(rotate, 33);
};
// rotate();

// for (let y = -2; y < 2; y++) {
// 	for (let x = -2; x < 2; x++) {
// 		scene.addGameObject(createCube([x * 4, 0, y * 4]));
// 	}
// }

scene.camera.radius = 2;
scene.addGameObject(createCube([0, 0, 0]));

engine.scene = scene;
engine.start();
