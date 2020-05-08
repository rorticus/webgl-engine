import {Engine} from "../../../engine/Engine";
import {Scene} from "../../../engine/Scene";
import {GameObject} from "../../../engine/GameObject";
import {vec3} from "gl-matrix";
import {Triangle} from "../../../engine/renderable/Triangle";

const canvas = document.createElement('canvas');
canvas.setAttribute('width', '512');
canvas.setAttribute('height', '512');

document.body.appendChild(canvas);

const engine = new Engine(canvas);

const scene = new Scene();

const testObj = new GameObject();
testObj.renderable = new Triangle();
testObj.position = vec3.fromValues(0, 0, 0);

scene.addGameObject(testObj);

engine.scene = scene;
engine.start();