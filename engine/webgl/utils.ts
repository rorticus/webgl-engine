import {
	AttribSetter,
	BufferInfo,
	GlBuffer,
	Primitive,
	ProgramInfo,
	Renderable,
	UniformSetter,
} from "./interfaces";

function isBuiltIn(info: WebGLActiveInfo) {
	const name = info.name;
	return name.indexOf("gl_") === 0 || name.indexOf("webgl_") === 0;
}

function setterForUniform(
	gl: WebGLRenderingContext,
	info: WebGLActiveInfo,
	location: WebGLUniformLocation
) {
	switch (info.type) {
		case gl.FLOAT:
			return (v: number) => {
				gl.uniform1f(location, v);
			};
		case gl.FLOAT_VEC2:
			return (v: Float32List) => {
				gl.uniform2fv(location, v);
			};
		case gl.FLOAT_VEC3:
			return (v: Float32List) => {
				gl.uniform3fv(location, v);
			};
		case gl.FLOAT_VEC4:
			return (v: Float32List) => {
				gl.uniform4fv(location, v);
			};
		case gl.INT:
		case gl.BOOL:
			return (v: number) => {
				gl.uniform1i(location, v);
			};
		case gl.INT_VEC2:
			return (v: Int32List) => {
				gl.uniform2iv(location, v);
			};
		case gl.INT_VEC3:
			return (v: Int32List) => {
				gl.uniform3iv(location, v);
			};
		case gl.INT_VEC4:
			return (v: Int32List) => {
				gl.uniform4iv(location, v);
			};
		case gl.FLOAT_MAT2:
			return (v: Float32List) => {
				gl.uniformMatrix2fv(location, false, v);
			};
		case gl.FLOAT_MAT3:
			return (v: Float32List) => {
				gl.uniformMatrix3fv(location, false, v);
			};
		case gl.FLOAT_MAT4:
			return (v: Float32List) => {
				gl.uniformMatrix4fv(location, false, v);
			};
		default:
			console.error(`Invali uniform type ${info.type}`, info);
			throw new Error(`Invalid uniform type ${info.type}`);
	}
}

function setterForAttrib(
	gl: WebGLRenderingContext,
	info: WebGLActiveInfo,
	location: GLint
) {
	switch (info.type) {
		case gl.FLOAT:
		case gl.FLOAT_VEC2:
		case gl.FLOAT_VEC3:
		case gl.FLOAT_VEC4:
			return (b: GlBuffer) => {
				gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
				gl.enableVertexAttribArray(location);
				gl.vertexAttribPointer(location, b.itemSize, gl.FLOAT, false, 0, 0);
			};
		case gl.INT:
		case gl.INT_VEC2:
		case gl.INT_VEC3:
		case gl.INT_VEC4:
			return (b: GlBuffer) => {
				gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
				gl.enableVertexAttribArray(location);
				gl.vertexAttribPointer(location, b.itemSize, gl.INT, false, 0, 0);
			};
		default:
			console.error(`Invalid attribute type ${info.type}`, info);
			throw new Error(`Invalid attribute type ${info.type}`);
	}
}

export function createUniformSetters(
	gl: WebGLRenderingContext,
	program: WebGLProgram
) {
	const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

	let uniforms: Record<string, UniformSetter> = {};

	for (let i = 0; i < numUniforms; i++) {
		const uniformInfo = gl.getActiveUniform(program, i);
		if (isBuiltIn(uniformInfo)) {
			continue;
		}

		let name = uniformInfo.name;
		if (name.substr(-3) === "[0]") {
			name = name.substr(0, name.length - 3);
		}

		const location = gl.getUniformLocation(program, uniformInfo.name);
		if (location) {
			uniforms[name] = {
				setter: setterForUniform(gl, uniformInfo, location),
				location,
				info: uniformInfo,
			};
		}
	}

	return uniforms;
}

export function createAttributeSetters(
	gl: WebGLRenderingContext,
	program: WebGLProgram
) {
	const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

	let attributes: Record<string, AttribSetter> = {};

	for (let i = 0; i < numAttributes; i++) {
		const attribInfo = gl.getActiveAttrib(program, i);
		if (isBuiltIn(attribInfo)) {
			continue;
		}

		let name = attribInfo.name;
		if (name.substr(-3) === "[0]") {
			name = name.substr(0, name.length - 3);
		}

		const location = gl.getAttribLocation(program, attribInfo.name);
		if (location !== -1) {
			attributes[name] = {
				setter: setterForAttrib(gl, attribInfo, location),
				location,
				info: attribInfo,
			};
		}
	}

	return attributes;
}

export function createProgramInfoFromProgram(
	gl: WebGLRenderingContext,
	program: WebGLProgram
): ProgramInfo {
	gl.useProgram(program);

	return {
		program,
		uniformSetters: createUniformSetters(gl, program),
		attribSetters: createAttributeSetters(gl, program),
	};
}

function setAttributes(
	setters: ProgramInfo["attribSetters"],
	attribs: BufferInfo["attribs"]
) {
	for (let name in attribs) {
		const setter = setters[name];
		if (setter) {
			setter.setter(attribs[name]);
		}
	}
}

export function setBuffersAndAttributes(
	gl: WebGLRenderingContext,
	programInfo: ProgramInfo,
	buffers: BufferInfo
) {
	setAttributes(programInfo.attribSetters, buffers.attribs);
	if (buffers.indices) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
	}
}

export function setUniforms(
	programInfo: ProgramInfo,
	uniforms: Renderable["uniforms"]
) {
	const setters = programInfo.uniformSetters;

	for (var name in uniforms) {
		const setter = setters[name];
		if (setter) {
			setter.setter(uniforms[name]);
		}
	}
}

function createBufferFromTypedArray(
	gl: WebGLRenderingContext,
	typedArray: Float32Array | Uint16Array,
	type: number = gl.ARRAY_BUFFER
) {
	const buffer = gl.createBuffer();
	gl.bindBuffer(type, buffer);
	gl.bufferData(type, typedArray, gl.STATIC_DRAW);

	return buffer;
}

export function createAttribsFromArrays(
	gl: WebGLRenderingContext,
	arrays: Primitive
): Record<string, GlBuffer> {
	const attribs: Record<string, GlBuffer> = {};

	attribs["a_position"] = {
		buffer: createBufferFromTypedArray(
			gl,
			new Float32Array(arrays.position.data)
		),
		numItems: arrays.position.data.length / arrays.position.numComponents,
		itemSize: arrays.position.numComponents,
		type: gl.STATIC_DRAW,
		normalize: false,
		stride: 0,
		offset: 0,
	};

	attribs["a_normal"] = {
		buffer: createBufferFromTypedArray(
			gl,
			new Float32Array(arrays.normal.data)
		),
		numItems: arrays.normal.data.length / arrays.normal.numComponents,
		itemSize: arrays.normal.numComponents,
		type: gl.STATIC_DRAW,
		normalize: false,
		stride: 0,
		offset: 0,
	};

	return attribs;
}

export function createAttributesFromArrays(
	gl: WebGLRenderingContext,
	primitive: Primitive
): BufferInfo {
	const bufferInfo: BufferInfo = {
		attribs: createAttribsFromArrays(gl, primitive),
	};

	let indices = primitive.indices;
	if (indices) {
		const typedIndices = new Uint16Array(indices.data);
		bufferInfo.indices = createBufferFromTypedArray(
			gl,
			typedIndices,
			gl.ELEMENT_ARRAY_BUFFER
		);
		bufferInfo.numElements = typedIndices.length;
	} else {
		bufferInfo.numElements = primitive.position.data.length / 3;
	}

	return bufferInfo;
}
