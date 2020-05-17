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
uniform mat4 u_worldInverseTranspose;
uniform vec3 u_lightWorldPosition;

attribute vec3 a_position;
attribute vec3 a_normal;

varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_position;
 
void main() {
  vec4 surfacePosition = u_matrix * vec4(a_position, 1.0);
	
  gl_Position = u_projectionMatrix * surfacePosition;
  v_normal = mat3(u_worldInverseTranspose) * a_normal;
  v_position = surfacePosition.xyz; 
  
  // point lighting
  vec3 surfaceWorldPosition = surfacePosition.xyz;
  vec4 lightPosition = vec4(u_lightWorldPosition, 1.0);
  v_surfaceToLight = surfaceWorldPosition - lightPosition.xyz;  
}`;

const simpleFragment = `
precision mediump float;

uniform vec3 u_color;
uniform vec3 u_ambientColor;
uniform vec3 u_lightWorldColor;

varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_position;

void main() {
	vec3 normal = normalize(v_normal);
	vec3 eyeVector = normalize(-v_position);
	
	vec3 iAmbient = u_ambientColor;
	vec3 iDiffuse = vec3(0.0, 0.0, 0.0);
	vec3 iSpecular = vec3(0.0, 0.0, 0.0);
	
	vec3 lightDirection = normalize(v_surfaceToLight);
	float light = max(dot(normal, -lightDirection), 0.0);
	
	iDiffuse += u_lightWorldColor * u_color * light;
	
	vec3 iColor = iAmbient + iDiffuse + iSpecular;
				
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

const scene = new Scene();
scene.pointLight.position = vec3.fromValues(0, 100, 100);

const cubeModel = createCubeVertices(3);

function createCube(pos: number[]) {
	const cube = new GameObject();
	cube.position = vec3.fromValues(pos[0], pos[1], pos[2]);
	cube.renderable = {
		programInfo: program,
		uniforms: {
			u_color: vec3.fromValues(1.0, 0.0, 0.0)
		},
		attributes: createAttributesFromArrays(engine.gl, cubeModel),
	};
	cube.rotateX(Math.PI);
	cube.addComponent(new Rotater());

	const subCube = new GameObject();
	subCube.position = vec3.fromValues(0, -4, 0);
	subCube.renderable = {
		programInfo: program,
		uniforms: {
			u_color: vec3.fromValues(1.0, 1.0, 0.0)
		},
		attributes: createAttributesFromArrays(engine.gl, cubeModel)
	};
	subCube.scale = vec3.fromValues(0.25, 0.25, 0.25);
	// subCube.addComponent(new Rotater());

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
