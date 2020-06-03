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
import { quat, vec3 } from "gl-matrix";
import { GameObject } from "../GameObject";

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
	mesh?: number;
	children?: number[];
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
}

export function loadGLTF(
	gl: WebGLRenderingContext,
	programInfo: ProgramInfo,
	json: GltfRoot
) {
	const buffers = json.buffers.map((buffer) => {
		const arrayBuffer = new Uint8Array(buffer.byteLength);

		const str = atob(buffer.uri.split(",")[1]);

		for (let i = 0; i < buffer.byteLength; i++) {
			arrayBuffer[i] = str.charCodeAt(i);
		}

		return {
			byteLength: buffer.byteLength,
			arrayBuffer: arrayBuffer.buffer,
		} as GlBuffer;
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

	const accessors = json.accessors.map(
		(accessor) =>
			({
				bufferView: bufferViews[accessor.bufferView],
				byteOffset: accessor.byteOffset || 0,
				componentType: accessor.componentType,
				count: accessor.count,
				type: accessor.type,
			} as GlAccessor)
	);

	const scene = new GameObject();

	const { scene: sceneIndex = 0, scenes = [], nodes = [] } = json;

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

	if (sceneIndex < scenes.length) {
		const { name = "", nodes = [] } = scenes[sceneIndex];

		scene.id = name;

		nodes.forEach((node) => {
			scene.add(gltfNodes[node]);
		});
	}

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
						nativeArrayFromAccessor(gl, accessor),
						accessors[primitive.indices].bufferView.target
					),
					numItems: accessor.count,
					itemSize: numberOfComponentsForType(accessor.type),
					type: gl.STATIC_DRAW,
					normalize: false,
					stride: 0,
					offset: 0,
				} as GlBufferAndView,
			};
		}, {}),
	};

	let indices = primitive.indices;
	if (indices) {
		bufferInfo.indices = createBufferFromTypedArray(
			gl,
			nativeArrayFromAccessor(gl, accessors[primitive.indices]),
			gl.ELEMENT_ARRAY_BUFFER
		);
		bufferInfo.numElements = accessors[primitive.indices].count;
	} else {
		bufferInfo.numElements = 0;
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
				};
			}
		}

		return {
			u_color: [baseColorFactor[0], baseColorFactor[1], baseColorFactor[2]],
		};
	}

	return {
		u_color: [1, 1, 1, 1],
	};
}
