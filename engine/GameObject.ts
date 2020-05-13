import { mat3, mat4, quat, vec3 } from "gl-matrix";
import { GameComponent } from "./components/GameComponent";
import { setBuffersAndAttributes, setUniforms } from "./webgl/utils";
import { Renderable } from "./webgl/interfaces";

export class GameObject {
	id: string;
	parent: GameObject | null;
	children: GameObject[];
	visible: boolean;
	components: GameComponent[];
	renderable?: Renderable;

	// transformation
	up: vec3;
	position: vec3;
	rotation: quat;
	scale: vec3;

	// transformation as matrices
	localMatrix: mat4;
	worldMatrix: mat4;

	constructor() {
		this.parent = null;
		this.children = [];
		this.visible = true;
		this.components = [];

		this.up = vec3.fromValues(0, 1, 0);
		this.position = vec3.fromValues(0, 0, 0);
		this.rotation = quat.create();
		this.scale = vec3.fromValues(1, 1, 1);
		this.localMatrix = mat4.create();
		this.worldMatrix = mat4.create();
	}

	addComponent(component: GameComponent) {
		this.components.push(component);
	}

	rotate(radianX: number, radianY: number, radianZ: number) {
		quat.rotateX(this.rotation, this.rotation, radianX);
		quat.rotateY(this.rotation, this.rotation, radianY);
		quat.rotateZ(this.rotation, this.rotation, radianZ);
	}

	setRotationFromAxisAngle(axis: vec3, angle: number) {
		quat.setAxisAngle(this.rotation, axis, angle);
	}

	setRotationFromMatrix(m: mat3) {
		quat.fromMat3(this.rotation, m);
	}

	setRotationFromQuaternion(q: quat) {
		this.rotation = quat.clone(q);
	}

	rotateOnAxis(axis: vec3, angle: number) {
		quat.setAxisAngle(this.rotation, axis, angle);
	}

	rotateX(angle: number) {
		this.rotateOnAxis(vec3.fromValues(1, 0, 0), angle);
	}

	rotateY(angle: number) {
		this.rotateOnAxis(vec3.fromValues(0, 1, 0), angle);
	}

	rotateZ(angle: number) {
		this.rotateOnAxis(vec3.fromValues(0, 0, 1), angle);
	}

	translateOnAxis(axis: vec3, distance: number) {
		const v1 = vec3.create();
		vec3.copy(v1, axis);
		vec3.transformQuat(v1, v1, this.rotation);
		vec3.scale(v1, v1, distance);
		vec3.add(this.position, this.position, v1);
	}

	localToWorld(vector: vec3) {
		const v1 = vec3.create();
		vec3.transformMat4(v1, vector, this.worldMatrix);

		return v1;
	}

	worldToLocal() {
		const m1 = mat4.create();

		return (vector: vec3) => {
			mat4.invert(m1, this.worldMatrix);
			const v1 = vec3.create();
			vec3.transformMat4(v1, vector, m1);
			return v1;
		};
	}

	add(object: GameObject) {
		if (object === this) {
			return;
		}

		if (object.parent) {
			object.parent.remove(object);
		}

		object.parent = this;
		this.children.push(object);
	}

	remove(object: GameObject) {
		const index = this.children.indexOf(object);

		if (index !== -1) {
			object.parent = undefined;
			this.children.splice(index, 1);
		}
	}

	traverse(callback: (o: GameObject) => void) {
		callback(this);
		this.children.forEach(callback);
	}

	getObjectById(id: string, recursive = false): GameObject | undefined {
		for (let i = 0; i < this.children.length; i++) {
			const child = this.children[i];

			if (child.id === id) {
				return child;
			}

			if (recursive) {
				const childRecurse = child.getObjectById(id, recursive);
				if (childRecurse !== undefined) {
					return childRecurse;
				}
			}
		}

		return undefined;
	}

	getDescendants(): GameObject[] {
		return this.children.reduce((children, child) => {
			return [...children, ...child.getDescendants()];
		}, []);
	}

	updateMatrix() {
		mat4.identity(this.localMatrix);
		mat4.fromQuat(this.localMatrix, this.rotation);
		mat4.scale(this.localMatrix, this.localMatrix, this.scale);

		this.localMatrix[12] = this.position[0];
		this.localMatrix[13] = this.position[1];
		this.localMatrix[14] = this.position[2];
	}

	computeWorldMatrix() {
		this.updateMatrix();

		if (!this.parent) {
			mat4.copy(this.worldMatrix, this.localMatrix);
		} else {
			mat4.mul(this.worldMatrix, this.parent.worldMatrix, this.localMatrix);
		}

		this.children.forEach((child) => child.computeWorldMatrix());
	}

	update(deltaInSeconds: number) {
		this.computeWorldMatrix();
		this.components.forEach((component) => component.update(deltaInSeconds));
	}

	render(gl: WebGLRenderingContext) {
		if (this.renderable) {
			gl.useProgram(this.renderable.programInfo.program);
			setUniforms(this.renderable.programInfo, this.renderable.uniforms);
			setBuffersAndAttributes(
				gl,
				this.renderable.programInfo,
				this.renderable.attributes
			);

			gl.drawElements(
				gl.TRIANGLES,
				this.renderable.attributes.numElements,
				gl.UNSIGNED_SHORT,
				0
			);
		}
	}
}
