import {
	BufferInfo,
	GlAccessor,
	GlAccessorType,
	GlBuffer,
	GlBufferAndView,
	GlBufferView,
	ProgramInfo,
} from "./interfaces";
import {
	createBufferFromTypedArray,
	createTexture,
	nativeArrayFromAccessor,
	numberOfComponentsForType,
} from "./utils";
import { mat4, quat, vec3 } from "gl-matrix";
import { GameObject } from "../GameObject";
import { Skin } from "./Skin";
import { AnimationState, AnimationWrapMode } from "../animation/AnimationState";
import { RotationAnimationChannel } from "../animation/RotationAnimationChannel";
import { AnimationChannel } from "../animation/AnimationChannel";
import { ScaleAnimationChannel } from "../animation/ScaleAnimationChannel";
import { TranslationAnimationChannel } from "../animation/TranslationAnimationChannel";

export interface GltfAnimationSampler {
	/** The index of an accessor containing keyframe input values, e.g., time **/
	input: number;
	/** Interpolation algorithm, default LINEAR **/
	interpolation?: string;
	/** The index of an accessor, containing keyframe output values. */
	output: number;
}

export interface GltfAnimationChannel {
	/** The index of a sampler in this animation used to compute the value for the target. **/
	sampler: number;
	/** The index of the node and TRS property to target. **/
	target: {
		/** The index of the node to target. **/
		node?: number;
		/**
		 * The name of the node's TRS property to modify, or the "weights" of the Morph Targets it instantiates.
		 * For the "translation" property, the values that are provided by the sampler are the translation along the
		 * x, y, and z axes. For the "rotation" property, the values are a quaternion in the order (x, y, z, w), where
		 * w is the scalar. For the "scale" property, the values are the scaling factors along the x, y, and z axes.
		 */
		path: "rotation" | "scale" | "translation" | "weights";
	};
}

export interface GltfAnimation {
	channels: GltfAnimationChannel[];
	samplers: GltfAnimationSampler[];
	name?: string;
}

export interface GltfPrimitive {
	attributes: Record<string, number>;
	indices?: number;
	material?: number;
}

export interface GltfMaterial {
	name?: string;
	normalTexture?: any;
	occlusionTexture?: any;
	emissiveTexture?: any;
	emissiveFactor?: [number, number, number];
	alphaMode?: string;
	alphaCutoff?: number;
	doubleSided?: boolean;
	pbrMetallicRoughness?: {
		baseColorFactor?: [number, number, number, number];
		baseColorTexture?: {
			index: number;
			texCoord: number;
		};
		metallicFactor?: number;
		roughnessFactor?: number;
		metallicRoughnessTexture?: number;
	};
}

export interface GltfMesh {
	name: string;
	primitives: GltfPrimitive[];
}

export interface GltfNode {
	name?: string;
	rotation?: [number, number, number, number];
	translation?: [number, number, number];
	scale?: [number, number, number];
	matrix?: [
		number,
		number,
		number,
		number,
		number,
		number,
		number,
		number,
		number,
		number,
		number,
		number,
		number,
		number,
		number,
		number
	];
	mesh?: number;
	children?: number[];
	skin?: number;
}

export interface GltfSkin {
	inverseBindMatrices?: number;
	skeleton?: number;
	joints: number[];
	name?: string;
}

export interface GltfImage {
	uri?: string;
	mimeType?: string;
	bufferView?: number;
	name?: string;
}

export interface GltfTexture {
	source: number;
}

export interface GltfScene {
	name?: string;
	nodes?: number[];
}

export interface GltfAccessor {
	bufferView: number;
	componentType: number;
	count: number;
	max: number[];
	min: number[];
	type: GlAccessorType;
	byteOffset?: number;
}

export interface GltfBufferView {
	buffer: number;
	byteLength: number;
	byteOffset?: number;
	byteStride?: number;
	target?: number;
}

export interface GltfBuffer {
	byteLength: number;
	uri: string;
}

export interface GltfRoot {
	meshes: GltfMesh[];
	accessors: GltfAccessor[];
	bufferViews: GltfBufferView[];
	buffers: GltfBuffer[];
	materials?: GltfMaterial[];
	scenes?: GltfScene[];
	scene?: number;
	nodes?: GltfNode[];
	images?: GltfImage[];
	textures?: GltfTexture[];
	skins?: GltfSkin[];
	animations?: GltfAnimation[];
}

export function loadGLTF(
	gl: WebGLRenderingContext,
	programInfo: ProgramInfo,
	json: GltfRoot,
	binaryBuffers?: Uint8Array[]
) {
	const buffers = json.buffers.map((buffer, index) => {
		if (buffer.uri) {
			const arrayBuffer = new Uint8Array(buffer.byteLength);

			const str = atob(buffer.uri.split(",")[1]);

			for (let i = 0; i < buffer.byteLength; i++) {
				arrayBuffer[i] = str.charCodeAt(i);
			}

			return {
				byteLength: buffer.byteLength,
				arrayBuffer: arrayBuffer.buffer,
			} as GlBuffer;
		} else {
			const arrayBuffer = binaryBuffers[index];
			return {
				byteLength: arrayBuffer.byteLength,
				arrayBuffer: arrayBuffer.buffer,
			};
		}
	});

	const bufferViews = json.bufferViews.map(
		(bufferView) =>
			({
				buffer: buffers[bufferView.buffer],
				byteLength: bufferView.byteLength,
				byteOffset: bufferView.byteOffset || 0,
				byteStride: bufferView.byteStride || 0,
				target: bufferView.target || gl.ARRAY_BUFFER,
			} as GlBufferView)
	);

	const accessors = json.accessors.map((accessor) => {
		const glAccessor = {
			bufferView: bufferViews[accessor.bufferView],
			byteOffset: accessor.byteOffset || 0,
			componentType: accessor.componentType,
			count: accessor.count,
			type: accessor.type,
		} as GlAccessor;

		return {
			...glAccessor,
			nativeArray: nativeArrayFromAccessor(gl, glAccessor),
		};
	});

	const scene = new GameObject();

	const {
		scene: sceneIndex = 0,
		scenes = [],
		nodes = [],
		animations = [],
	} = json;

	const gltfNodes = nodes.map((node) => {
		const n = new GameObject();
		n.id = node.name;

		if (node.rotation) {
			n.rotation = quat.fromValues(...node.rotation);
		}

		if (node.translation) {
			n.position = vec3.fromValues(...node.translation);
		}

		if (node.scale) {
			n.scale = vec3.fromValues(...node.scale);
		}

		if (node.matrix) {
			const matrix = mat4.fromValues(...node.matrix);
			mat4.getTranslation(n.position, matrix);
			mat4.getRotation(n.rotation, matrix);
			mat4.getScaling(n.scale, matrix);
		}

		if (node.mesh !== undefined) {
			const mesh = json.meshes[node.mesh];

			if (mesh) {
				n.renderable = {
					programInfo,
					renderables: mesh.primitives.map((primitive) => ({
						attributes: createAttributesFromPrimitive(gl, accessors, primitive),
						uniforms:
							primitive.material !== undefined
								? materialToUniforms(
										gl,
										json,
										json.materials[primitive.material],
										bufferViews
								  )
								: {
										u_color: vec3.fromValues(1.0, 0.0, 0.0),
								  },
					})),
				};
			}
		}

		return n;
	});

	nodes.forEach((node, index) => {
		if (node.children) {
			node.children.forEach((child) => {
				gltfNodes[index].add(gltfNodes[child]);
			});
		}
	});

	const skins = (json.skins || []).map((skin) => {
		const joints = skin.joints.map((index) => gltfNodes[index]);
		return new Skin(gl, joints, accessors[skin.inverseBindMatrices]);
	});

	nodes.forEach((node, index) => {
		if (node.skin !== undefined && gltfNodes[index].renderable) {
			gltfNodes[index].renderable.skin = skins[node.skin];
		}
	});

	if (sceneIndex < scenes.length) {
		const { name = "", nodes = [] } = scenes[sceneIndex];

		scene.id = name;

		nodes.forEach((node) => {
			scene.add(gltfNodes[node]);
		});
	}

	// animations
	let nameIndex = 1;

	animations.map((animation) => {
		const {
			name = `animation${nameIndex++}`,
			channels = [],
			samplers = [],
		} = animation;

		const animationChannels: AnimationChannel[] = [];

		channels.forEach((channel) => {
			const { sampler: samplerIndex = 0, target } = channel;
			const sampler = samplers[samplerIndex];
			const targetNode = gltfNodes[target.node];
			const targetPath = target.path;

			const {
				input: inputAccessorIndex,
				interpolation = "LINEAR",
				output: outputAccessorIndex,
			} = sampler;

			if (targetPath === "rotation") {
				const keyframes = accessors[inputAccessorIndex]
					.nativeArray as Float32Array;
				const output = accessors[outputAccessorIndex]
					.nativeArray as Float32Array;

				animationChannels.push(
					new RotationAnimationChannel(
						targetNode,
						Array.from(keyframes),
						Array.from(keyframes).map((_, index) => {
							return output.subarray(4 * index, 4 * index + 4) as quat;
						})
					)
				);
			} else if (targetPath === "scale") {
				const keyframes = accessors[inputAccessorIndex]
					.nativeArray as Float32Array;
				const output = accessors[outputAccessorIndex]
					.nativeArray as Float32Array;

				animationChannels.push(
					new ScaleAnimationChannel(
						targetNode,
						Array.from(keyframes),
						Array.from(keyframes).map((_, index) => {
							return output.subarray(3 * index, 3 * index + 3) as vec3;
						})
					)
				);
			} else if (targetPath === "translation") {
				const keyframes = accessors[inputAccessorIndex]
					.nativeArray as Float32Array;
				const output = accessors[outputAccessorIndex]
					.nativeArray as Float32Array;

				animationChannels.push(
					new TranslationAnimationChannel(
						targetNode,
						Array.from(keyframes),
						Array.from(keyframes).map((_, index) => {
							return output.subarray(3 * index, 3 * index + 3) as vec3;
						})
					)
				);
			}
		});

		const animationState = new AnimationState();
		animationState.wrapMode = AnimationWrapMode.Loop;
		animationState.channels = animationChannels;

		scene.animation.registerState(name, animationState);
	});

	return scene;
}

export function createAttributesFromPrimitive(
	gl: WebGLRenderingContext,
	accessors: GlAccessor[],
	primitive: GltfPrimitive
): BufferInfo {
	const bufferInfo: BufferInfo = {
		attribs: Object.keys(primitive.attributes).reduce((attrs, name) => {
			const accessor = accessors[primitive.attributes[name]];

			return {
				...attrs,
				[`a_${name.toLowerCase()}`]: {
					buffer: createBufferFromTypedArray(
						gl,
						accessor.nativeArray,
						accessor.bufferView.target
					),
					numItems: accessor.count,
					itemSize: numberOfComponentsForType(accessor.type),
					type: gl.STATIC_DRAW,
					normalize: false,
					stride: 0,
					offset: 0,
					componentType: accessor.componentType,
				} as GlBufferAndView,
			};
		}, {}),
	};

	let indices = primitive.indices;
	if (indices !== undefined) {
		bufferInfo.indices = createBufferFromTypedArray(
			gl,
			accessors[primitive.indices].nativeArray,
			gl.ELEMENT_ARRAY_BUFFER
		);

		bufferInfo.numElements = accessors[primitive.indices].count;
		bufferInfo.elementType = accessors[primitive.indices].componentType || gl.UNSIGNED_SHORT;
	} else {
		bufferInfo.numElements = accessors[primitive.attributes["POSITION"]].count;
	}

	return bufferInfo;
}

function Uint8ToBase64(u8Arr: Uint8Array) {
	var CHUNK_SIZE = 0x8000; //arbitrary number
	var index = 0;
	var length = u8Arr.length;
	var result = "";
	var slice;
	while (index < length) {
		slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
		result += String.fromCharCode.apply(null, slice);
		index += CHUNK_SIZE;
	}
	return btoa(result);
}

export function materialToUniforms(
	gl: WebGLRenderingContext,
	root: GltfRoot,
	material: GltfMaterial,
	bufferViews: GlBufferView[]
) {
	const { pbrMetallicRoughness } = material;

	if (pbrMetallicRoughness) {
		const {
			baseColorFactor = [1, 1, 1, 1],
			baseColorTexture,
		} = pbrMetallicRoughness;

		if (baseColorTexture) {
			const gltfTexture = root.textures[baseColorTexture.index];
			if (gltfTexture) {
				const texture = createTexture(gl, gl.TEXTURE_2D);

				const gltfImage = root.images[gltfTexture.source];
				if (gltfImage.uri) {
					const image = new Image();
					image.onload = () => {
						gl.bindTexture(gl.TEXTURE_2D, texture);
						gl.texImage2D(
							gl.TEXTURE_2D,
							0,
							gl.RGBA,
							gl.RGBA,
							gl.UNSIGNED_BYTE,
							image
						);
						gl.generateMipmap(gl.TEXTURE_2D);
					};
					image.src = gltfImage.uri;

					return {
						u_color: [1, 1, 1],
						[`u_texture${baseColorTexture.texCoord || 0}`]: texture,
					  	u_hasTexture: true
					};
				} else if (gltfImage.bufferView) {
					const bufferView = bufferViews[gltfImage.bufferView];

					const nativeArray = new Uint8Array(
						bufferView.buffer.arrayBuffer,
						bufferView.byteOffset,
						bufferView.byteLength
					);
					//
					const image = new Image();
					image.onload = () => {
						gl.bindTexture(gl.TEXTURE_2D, texture);
						gl.texImage2D(
							gl.TEXTURE_2D,
							0,
							gl.RGBA,
							gl.RGBA,
							gl.UNSIGNED_BYTE,
							image
						);
						gl.generateMipmap(gl.TEXTURE_2D);
					};
					image.src = `data:${gltfImage.mimeType};base64,${Uint8ToBase64(
						nativeArray
					)}`;

					return {
						u_color: [1, 1, 1],
						[`u_texture${baseColorTexture.texCoord}`]: texture,
					  	u_hasTexture: true
					};
				}
			}
		}

		return {
			u_color: [baseColorFactor[0], baseColorFactor[1], baseColorFactor[2]],
		  	u_hasTexture: false
		};
	}

	return {
		u_color: [1, 1, 1, 1],
	  	u_hasTexture: false
	};
}

export function loadGLB(
	gl: WebGLRenderingContext,
	programInfo: ProgramInfo,
	data: ArrayBuffer
) {
	const dataView = new DataView(data);

	// header
	const magic = dataView.getUint32(0, true);
	const version = dataView.getUint32(4, true);
	const length = dataView.getUint32(8, true);

	if (version !== 2) {
		throw new Error("Invalid GLB file, only version 2 is supported");
	}

	const chunks = [];
	let offset = 12;
	while (offset < length) {
		const chunkLength = dataView.getUint32(offset, true);
		const chunkType = dataView.getUint32(offset + 4, true);
		const chunkData = new Uint8Array(
			data.slice(offset + 8, offset + 8 + chunkLength)
		);

		chunks.push({
			type: chunkType,
			data: chunkData,
		});

		offset += chunkLength + 8;
	}

	// 0x4e4f534a is ASCII for "JSON"
	const jsonChunk = chunks.find((chunk) => chunk.type === 0x4e4f534a);

	// 0x004E4942 is ASCII for "BIN"
	const binaryChunks = chunks.filter((chunk) => chunk.type === 0x004e4942);

	if (jsonChunk) {
		const json = new TextDecoder().decode(jsonChunk.data);

		return loadGLTF(
			gl,
			programInfo,
			JSON.parse(json),
			binaryChunks.map((chunk) => chunk.data)
		);
	}

	throw new Error("Invalid GLB file, no JSON chunk found");
}
