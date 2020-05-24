import {
	BufferInfo,
	GlAccessor,
	GlAccessorType,
	GlBuffer,
	GlBufferView,
	Primitive,
} from "./interfaces";
import {
	createBufferFromTypedArray,
	nativeArrayFromAccessor,
	numberOfComponentsForType,
} from "./utils";
import { vec3 } from "gl-matrix";

export interface GltfPrimitive {
	attributes: Record<string, number>;
	indices?: number;
	material?: number;
}

export interface GltfMesh {
	name: string;
	primitives: GltfPrimitive[];
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
}

export function loadGLTF(gl: WebGLRenderingContext, json: GltfRoot) {
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

	const meshes = json.meshes.reduce((meshes, mesh) => {
		meshes[mesh.name] = mesh.primitives.map((primitive) => ({
			attributes: createAttributesFromPrimitive(gl, accessors, primitive),
			uniforms: {
				u_color: vec3.fromValues(1.0, 0.0, 0.0),
			},
		}));
		return meshes;
	}, {} as any);

	return {
		meshes,
	};
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
				},
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
