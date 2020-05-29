import { Engine } from "../../../src/Engine";
import { Scene } from "../../../src/Scene";
import { GameObject } from "../../../src/GameObject";
import { vec3 } from "gl-matrix";
import { createCubeVertices, triangle } from "../../../src/webgl/primitives";
import { createAttributesFromArrays } from "../../../src/webgl/utils";
import { createProgram } from "../../../src/webgl/program";
import { GameComponent } from "../../../src/components/GameComponent";
import {loadGLTF} from "../../../src/webgl/gltf";
import {OrbitCamera} from "../../../src/cameras/OrbitCamera";

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
attribute vec2 a_texcoord_0;

varying vec3 v_normal;
varying vec3 v_surfaceToLight[NUM_POSITIONAL_LIGHTS];
varying vec3 v_position;
varying vec2 v_texcoord0;
 
void main() {
  vec4 surfacePosition = u_matrix * vec4(a_position, 1.0);
	
  gl_Position = u_projectionMatrix * surfacePosition;
  v_normal = mat3(u_worldInverseTranspose) * a_normal;
  v_position = surfacePosition.xyz;
  
  v_texcoord0 = a_texcoord_0; 
  
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
uniform sampler2D u_texture0;

const int NUM_POSITIONAL_LIGHTS = 2;

varying vec3 v_normal;
varying vec3 v_surfaceToLight[NUM_POSITIONAL_LIGHTS];
uniform vec3 u_lightWorldColor[NUM_POSITIONAL_LIGHTS];
varying vec3 v_position;
varying vec2 v_texcoord0;

vec3 calculateAmbientColor(void) {
	return u_ambientColor;
}

vec3 calculatePositionalLights(vec3 normal) {
	vec3 diffuse = vec3(0.0, 0.0, 0.0);
	
	for(int i = 0; i < NUM_POSITIONAL_LIGHTS; i++) {
		vec3 lightDirection = normalize(v_surfaceToLight[i]);
		float light = max(dot(normal, -lightDirection), 0.0);
		
		diffuse += u_lightWorldColor[i] * texture2D(u_texture0, v_texcoord0).xyz * light;				
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

const program = createProgram(engine.gl, simpleVertex, simpleFragment);

const texturedCube = loadGLTF(engine.gl, program, require('./textured-cube.json'));

const orbitCamera = new OrbitCamera();

let ox = 0, oy = 0;
let dragging = false;

function frame() {
	if(!dragging && engine.mouseService.leftMouseDown) {
		dragging = true;
		ox = engine.mouseService.pointerX;
		oy = engine.mouseService.pointerY;
	} else if (dragging && engine.mouseService.leftMouseDown) {
		orbitCamera.azimuth += (engine.mouseService.pointerX - ox) * -Math.PI / 128;
		orbitCamera.elevation += (engine.mouseService.pointerY - oy) * -Math.PI / 128;

		ox = engine.mouseService.pointerX;
		oy = engine.mouseService.pointerY;
	} else if(dragging && !engine.mouseService.leftMouseDown) {
		dragging = false;
	}
	requestAnimationFrame(frame);
}
frame();

orbitCamera.radius = 5;
orbitCamera.elevation = -Math.PI / 4;

const scene = new Scene();
scene.camera = orbitCamera;
scene.pointLights[0].position = vec3.fromValues(0, 5, 15);
scene.pointLights[0].color = vec3.fromValues(1, 1, 1);

scene.addGameObject(texturedCube);

console.log(texturedCube);

engine.scene = scene;
engine.start();
