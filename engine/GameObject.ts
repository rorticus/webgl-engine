import { mat3, mat4, quat, vec3 } from "gl-matrix";
import { GameComponent } from "./components/GameComponent";
import { Renderable } from "./renderable/Renderable";

export class GameObject {
	id: string;
	parent: GameObject | null;
	children: GameObject[];
	visible: boolean;
	components: GameComponent[];
	renderable?: Renderable;

	up: vec3;
	position: vec3;
	rotation: quat;
	scale: vec3;
	modelMatrix: mat4;
	matrixWorld: mat4;

	matrixWorldNeedsUpdate: boolean;

	constructor() {
		this.parent = null;
		this.children = [];
		this.visible = true;
		this.components = [];

		this.up = vec3.fromValues(0, 1, 0);
		this.position = vec3.fromValues(0, 0, 0);
		this.rotation = quat.create();
		this.scale = vec3.fromValues(1, 1, 1);
		this.modelMatrix = mat4.create();
		this.matrixWorld = mat4.create();

		this.matrixWorldNeedsUpdate = true;
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
		this.rotateOnAxis([1, 0, 0], angle);
	}

	rotateY(angle: number) {
		this.rotateOnAxis([0, 1, 0], angle);
	}

	rotateZ(angle: number) {
		this.rotateOnAxis([0, 0, 1], angle);
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
		vec3.transformMat4(v1, vector, this.matrixWorld);

		return v1;
	}

	worldToLocal() {
		const m1 = mat4.create();

		return (vector: vec3) => {
			mat4.invert(m1, this.matrixWorld);
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
		mat4.identity(this.modelMatrix);
		mat4.fromQuat(this.modelMatrix, this.rotation);
		mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);

		this.modelMatrix[12] = this.position[0];
		this.modelMatrix[13] = this.position[1];
		this.modelMatrix[14] = this.position[2];

		this.matrixWorldNeedsUpdate = true;
	}

	updateMatrixWorld(force = false) {
		this.updateMatrix();

		let forceUpdate = force;

		if (this.matrixWorldNeedsUpdate || force) {
			if (!this.parent) {
				mat4.copy(this.matrixWorld, this.modelMatrix);
			} else {
				mat4.mul(this.matrixWorld, this.parent.matrixWorld, this.modelMatrix);
			}

			forceUpdate = true;
		}

		this.children.forEach((child) => child.updateMatrixWorld(forceUpdate));
	}

	update(deltaInSeconds: number) {
		this.updateMatrixWorld();
		this.components.forEach((component) => component.update(deltaInSeconds));
	}
}
