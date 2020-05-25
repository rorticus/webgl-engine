import { Engine } from "../../../src/Engine";
import { Scene } from "../../../src/Scene";
import { GameObject } from "../../../src/GameObject";
import { vec3 } from "gl-matrix";
import { createCubeVertices, triangle } from "../../../src/webgl/primitives";
import { createAttributesFromArrays } from "../../../src/webgl/utils";
import { createProgram } from "../../../src/webgl/program";
import { GameComponent } from "../../../src/components/GameComponent";
import {loadGLTF} from "../../../src/webgl/gltf";

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

const program = createProgram(engine.gl, simpleVertex, simpleFragment);

const pizzaScene = loadGLTF(engine.gl, program, require('./pizza.json'));
console.log(pizzaScene);
pizzaScene.addComponent(new Rotater());

const scene = new Scene();
scene.pointLights[0].position = vec3.fromValues(0, 0, 15);
scene.pointLights[0].color = vec3.fromValues(1, 1, 1);
scene.camera.radius = 2;

scene.addGameObject(pizzaScene);

engine.scene = scene;
engine.start();
