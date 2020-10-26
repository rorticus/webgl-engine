import { mat3, mat4, quat, vec3, vec4 } from "gl-matrix";
import { setBuffersAndAttributes, setUniforms } from "./webgl/utils";
import { Renderable } from "./webgl/interfaces";
import {
	GameComponent,
	GameComponentContext,
	SceneRenderContext,
	RenderPhase,
} from "./interfaces";
import { Engine } from "./Engine";
import { AnimationStateMachine } from "./animation/AnimationStateMachine";

export class GameObject {
	id: string = "";
	parent: GameObject | null;
	children: GameObject[];
	visible: boolean;
	components: GameComponent[];
	renderable?: Renderable;
	animation: AnimationStateMachine;
	renderPhase: RenderPhase = "standard";

	// transformation
	position: vec3;
	rotation: quat;
	scale: vec3;

	// transformation as matrices
	localMatrix: mat4;
	worldMatrix?: mat4;

	constructor() {
		this.parent = null;
		this.children = [];
		this.visible = true;
		this.components = [];

		this.position = vec3.fromValues(0, 0, 0);
		this.rotation = quat.create();
		this.scale = vec3.fromValues(1, 1, 1);
		this.localMatrix = mat4.create();
		this.worldMatrix = undefined;

		this.animation = new AnimationStateMachine();
	}

	addComponent(component: GameComponent | GameComponent["update"]) {
		this.components.push(
			typeof component === "function" ? { update: component } : component
		);
	}

	findComponent<T extends GameComponent = GameComponent>(tag: string) {
		return this.components.find((g) => g.tag === tag) as T;
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
		if (this.worldMatrix) {
			const v1 = vec3.create();
			vec3.transformMat4(v1, vector, this.worldMatrix);
			return v1;
		}

		return vector;
	}

	worldToLocal() {
		const m1 = mat4.create();

		return (vector: vec3) => {
			if (this.worldMatrix) {
				mat4.invert(m1, this.worldMatrix);
				const v1 = vec3.create();
				vec3.transformMat4(v1, vector, m1);
				return v1;
			}

			return vector;
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
			object.parent = null;
			this.children.splice(index, 1);
		}
	}

	removeFromParent() {
		this.parent?.remove(this);
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
		}, [] as GameObject[]);
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

		if (!this.worldMatrix) {
			this.worldMatrix = mat4.create();
		}

		if (!this.parent) {
			mat4.copy(this.worldMatrix, this.localMatrix);
		} else {
			mat4.mul(
				this.worldMatrix,
				this.parent.worldMatrix as mat4,
				this.localMatrix
			);
		}

		this.children.forEach((child) => child.computeWorldMatrix());
	}

	update(context: GameComponentContext) {
		this.components.forEach((component) => component.update(context, this));
		this.animation.update(context, this);

		this.computeWorldMatrix();

		this.children.forEach((child) => child.update(context));
	}

	render(context: SceneRenderContext) {
		const { gl, projectionMatrix, u_ambientColor, pointLights } = context;

		if (context.phase !== this.renderPhase) {
			context.addToRenderPhase(this.renderPhase, this);
			return;
		}

		if (this.renderable && this.worldMatrix) {
			const worldInverseMatrix = mat4.create();
			mat4.invert(worldInverseMatrix, this.worldMatrix);
			mat4.transpose(worldInverseMatrix, worldInverseMatrix);

			gl.useProgram(this.renderable.programInfo.program);
			setUniforms(this.renderable.programInfo, {
				u_projectionMatrix: projectionMatrix,
				u_matrix: this.worldMatrix,
				u_worldInverseTranspose: worldInverseMatrix,
				u_ambientColor,
				u_lightWorldPosition: pointLights.map((light) => light.position),
				u_lightWorldColor: pointLights.map((light) => light.color),
				u_useSkinning: false,
				u_cameraPos: context.u_cameraPos
			});

			if (this.renderable.skin) {
				this.renderable.skin.update(gl, this);
				setUniforms(this.renderable.programInfo, {
					u_jointTexture: this.renderable.skin.jointTexture,
					u_bones: (this.renderable.skin as any).jointMatrices,
					u_numJoints: this.renderable.skin.joints.length,
					u_useSkinning: true,
				});
			}

			this.renderable.renderables.forEach((renderable) => {
				if (this.renderable) {
					setUniforms(this.renderable.programInfo, renderable.uniforms);

					setBuffersAndAttributes(
						gl,
						this.renderable.programInfo,
						renderable.attributes
					);

					if (renderable.attributes.indices) {
						gl.drawElements(
							gl.TRIANGLES,
							renderable.attributes.numElements || 0,
							renderable.attributes.elementType || gl.UNSIGNED_SHORT,
							0
						);
					} else {
						gl.drawArrays(
							gl.TRIANGLES,
							0,
							renderable.attributes.numElements || 0
						);
					}
				}
			});
		}

		this.children.forEach((child) => child.render(context));
	}

	clone(parent?: GameObject) {
		const clone = new GameObject();

		clone.id = this.id;
		clone.position = vec3.clone(this.position);
		clone.rotation = quat.clone(this.rotation);
		clone.scale = vec3.clone(this.scale);
		clone.renderable = this.renderable;
		clone.visible = this.visible;
		clone.children = this.children.map((child) => child.clone(clone));
		clone.components = [...this.components];

		if (parent) {
			clone.parent = parent;
		}

		return clone;
	}
}
