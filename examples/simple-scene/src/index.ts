import { Engine } from "../../../src/Engine";
import { Scene } from "../../../src/Scene";
import { vec3 } from "gl-matrix";
import { loadGLB } from "../../../src/webgl/gltf";
import { OrbitCamera } from "../../../src/cameras/OrbitCamera";
import { AnimationWrapMode } from "../../../src/animation/AnimationState";
import { createTexture, loadTextureFromSource } from "../../../src/webgl/utils";

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

document.body.appendChild(canvas);

const engine = new Engine(canvas);

const mushroom = loadGLB(
	engine.gl,
	engine.programs.standard,
	require("./character1.glb")
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
orbitCamera.lookAt = vec3.fromValues(0, 2, 0);

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

scene.addGameObject(mushroom);
const character = mushroom.getObjectById("characterMedium", true);
const texture = createTexture(engine.gl);
character.renderable.renderables[0].uniforms[
	"u_texture0"
] = texture;
loadTextureFromSource(
  engine.gl,
  texture,
  engine.gl.TEXTURE_2D,
  engine.gl.TEXTURE_2D,
  require("./robot.png").default
)
character.renderable.renderables[0].uniforms["u_hasTexture"] = true;

mushroom.animation.transitionTo('Twerk', 0);

engine.scene = scene;
engine.start();

class MovingComponent {
	tag: 'Moving';
	count = 0;

	update() {
	}

	increment() {
		this.count++;

		console.log('incremented');
	}

	decrement() {
		this.count--;
	}
}

mushroom.addComponent(new MovingComponent());
const moving = mushroom.findComponent<MovingComponent>('moving');
moving.increment();