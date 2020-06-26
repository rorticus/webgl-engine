import {
	AttribSetter,
	BufferInfo,
	GlAccessor,
	GlAccessorType,
	GlBufferAndView,
	NativeArray,
	Primitive,
	ProgramInfo,
	SingleRenderable,
	UniformSetter,
} from "./interfaces";

function isBuiltIn(info: WebGLActiveInfo) {
	const name = info.name;
	return name.indexOf("gl_") === 0 || name.indexOf("webgl_") === 0;
}

function setterForUniform(
	gl: WebGLRenderingContext,
	info: WebGLActiveInfo,
	location: WebGLUniformLocation,
	unit = 0
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
			if (info.size > 1) {
				return (v: Float32List[]) => {
					const fl = new Float32Array(info.size * 3);
					for (let i = 0; i < v.length; i++) {
						fl.set(v[i], i * 3);
					}
					gl.uniform3fv(location, fl);
				};
			} else {
				return (v: Float32List) => {
					gl.uniform3fv(location, v);
				};
			}
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
			if (info.size > 1) {
				return (v: Float32List[]) => {
					const fl = new Float32Array(info.size * 16);
					for (let i = 0; i < v.length; i++) {
						fl.set(v[i], i * 16);
					}
					gl.uniformMatrix4fv(location, false, fl);
				};
			} else {
				return (v: Float32List) => {
					gl.uniformMatrix4fv(location, false, v);
				};
			}
		case gl.SAMPLER_2D:
			return (v: WebGLTexture) => {
				gl.uniform1i(location, unit);
				gl.activeTexture(gl.TEXTURE0 + unit);
				gl.bindTexture(gl.TEXTURE_2D, v);
			};
		case gl.SAMPLER_CUBE:
			return (v: number) => {
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, v);
				gl.uniform1i(location, v);
			};
		default:
			console.error(`Invalid uniform type ${info.type}`, info);
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
			return (b: GlBufferAndView) => {
				gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
				gl.enableVertexAttribArray(location);
				gl.vertexAttribPointer(
					location,
					b.itemSize,
					b.componentType || gl.FLOAT,
					false,
					b.stride,
					b.offset
				);
			};
		case gl.INT:
		case gl.INT_VEC2:
		case gl.INT_VEC3:
		case gl.INT_VEC4:
			return (b: GlBufferAndView) => {
				gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
				gl.enableVertexAttribArray(location);
				gl.vertexAttribPointer(
					location,
					b.itemSize,
					b.componentType || gl.INT,
					false,
					b.stride,
					b.offset
				);
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
	let textureUnit = 0;

	for (let i = 0; i < numUniforms; i++) {
		const uniformInfo = gl.getActiveUniform(program, i);
		if (uniformInfo) {
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
					setter: setterForUniform(gl, uniformInfo, location, textureUnit),
					location,
					info: uniformInfo,
				};

				if (uniformInfo.type === gl.SAMPLER_2D) {
					textureUnit += uniformInfo.size;
				}
			}
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
		if (attribInfo) {
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

export function disableExistingAttributes(
	gl: WebGLRenderingContext,
	programInfo: ProgramInfo
) {
	for (const attrib in programInfo.attribSetters) {
		gl.disableVertexAttribArray(programInfo.attribSetters[attrib].location);
	}
}

export function setBuffersAndAttributes(
	gl: WebGLRenderingContext,
	programInfo: ProgramInfo,
	buffers: BufferInfo,
	disableExisting = true
) {
	if (disableExisting) {
		disableExistingAttributes(gl, programInfo);
	}

	setAttributes(programInfo.attribSetters, buffers.attribs);

	if (buffers.indices) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
	}
}

export function setUniforms(
	programInfo: ProgramInfo,
	uniforms: SingleRenderable["uniforms"]
) {
	const setters = programInfo.uniformSetters;

	for (var name in uniforms) {
		const setter = setters[name];
		if (setter) {
			setter.setter(uniforms[name]);
		}
	}
}

export function createBufferFromTypedArray(
	gl: WebGLRenderingContext,
	typedArray: NativeArray,
	type: number = gl.ARRAY_BUFFER
) {
	const buffer = gl.createBuffer();

	if (!buffer) {
		throw new Error("Tried to create a GL buffer but failed :(");
	}

	gl.bindBuffer(type, buffer);
	gl.bufferData(type, typedArray, gl.STATIC_DRAW);

	return buffer;
}

export function createTexture(gl: WebGLRenderingContext, type = gl.TEXTURE_2D) {
	const texture = gl.createTexture();
	gl.bindTexture(type, texture);

	gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	if (type !== gl.TEXTURE_CUBE_MAP) {
		// fill it in with a temporary image
		gl.texImage2D(
			type,
			0,
			gl.RGBA,
			1,
			1,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			new Uint8Array([0, 0, 255, 255])
		);
	}

	return texture;
}

export function loadTextureFromSource(
	gl: WebGLRenderingContext,
	texture: WebGLTexture,
	type: GLenum,
	target: GLenum,
	source: string
) {
	gl.bindTexture(type, texture);
	gl.texImage2D(
		target,
		0,
		gl.RGBA,
		1,
		1,
		0,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		new Uint8Array([0, 0, 0, 0])
	);

	const image = new Image();
	image.onload = () => {
		gl.bindTexture(type, texture);
		gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	};
	image.src = source;
}

export function createSkyboxTexture(
	gl: WebGLRenderingContext,
	sources: {
		positiveX: string;
		negativeX: string;
		positiveY: string;
		negativeY: string;
		positiveZ: string;
		negativeZ: string;
	}
) {
	const texture = createTexture(gl, gl.TEXTURE_CUBE_MAP);

	if (texture) {
		loadTextureFromSource(
			gl,
			texture,
			gl.TEXTURE_CUBE_MAP,
			gl.TEXTURE_CUBE_MAP_POSITIVE_X,
			sources.positiveX
		);
		loadTextureFromSource(
			gl,
			texture,
			gl.TEXTURE_CUBE_MAP,
			gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
			sources.negativeX
		);
		loadTextureFromSource(
			gl,
			texture,
			gl.TEXTURE_CUBE_MAP,
			gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
			sources.positiveY
		);
		loadTextureFromSource(
			gl,
			texture,
			gl.TEXTURE_CUBE_MAP,
			gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
			sources.negativeY
		);
		loadTextureFromSource(
			gl,
			texture,
			gl.TEXTURE_CUBE_MAP,
			gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
			sources.positiveZ
		);
		loadTextureFromSource(
			gl,
			texture,
			gl.TEXTURE_CUBE_MAP,
			gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
			sources.negativeZ
		);
	}

	return texture;
}

export function createAttribsFromArrays(
	gl: WebGLRenderingContext,
	arrays: Primitive
): Record<string, GlBufferAndView> {
	const attribs: Record<string, GlBufferAndView> = {};

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

	if (arrays.normal) {
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
	}

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
		bufferInfo.numElements =
			primitive.position.data.length / primitive.position.numComponents;
	}

	return bufferInfo;
}

export function sizeInBytesForDataType(
	gl: WebGLRenderingContext,
	type: GLenum
) {
	switch (type) {
		case gl.BYTE:
			return 1;
		case gl.UNSIGNED_BYTE:
			return 1;
		case gl.SHORT:
			return 2;
		case gl.UNSIGNED_SHORT:
			return 2;
		case gl.UNSIGNED_INT:
			return 4;
		case gl.FLOAT:
			return 4;
	}

	return 0;
}

export function numberOfComponentsForType(type: GlAccessorType) {
	switch (type) {
		case GlAccessorType.SCALAR:
			return 1;
		case GlAccessorType.VEC2:
			return 2;
		case GlAccessorType.VEC3:
			return 3;
		case GlAccessorType.VEC4:
			return 4;
		case GlAccessorType.MAT2:
			return 4;
		case GlAccessorType.MAT3:
			return 9;
		case GlAccessorType.MAT4:
			return 16;
	}

	return 0;
}

export function nativeArrayFromAccessor(
	gl: WebGLRenderingContext,
	accessor: GlAccessor
): NativeArray {
	switch (accessor.componentType) {
		case gl.FLOAT:
			return new Float32Array(
				accessor.bufferView.buffer.arrayBuffer,
				accessor.byteOffset + accessor.bufferView.byteOffset,
				accessor.count * numberOfComponentsForType(accessor.type)
			);
		case gl.BYTE:
			return new Int8Array(
				accessor.bufferView.buffer.arrayBuffer,
				accessor.byteOffset + accessor.bufferView.byteOffset,
				accessor.count * numberOfComponentsForType(accessor.type)
			);
		case gl.UNSIGNED_BYTE:
			return new Uint8Array(
				accessor.bufferView.buffer.arrayBuffer,
				accessor.byteOffset + accessor.bufferView.byteOffset,
				accessor.count * numberOfComponentsForType(accessor.type)
			);
		case gl.INT:
			return new Int32Array(
				accessor.bufferView.buffer.arrayBuffer,
				accessor.byteOffset + accessor.bufferView.byteOffset,
				accessor.count * numberOfComponentsForType(accessor.type)
			);
		case gl.UNSIGNED_INT:
			return new Uint32Array(
				accessor.bufferView.buffer.arrayBuffer,
				accessor.byteOffset + accessor.bufferView.byteOffset,
				accessor.count * numberOfComponentsForType(accessor.type)
			);
		case gl.SHORT:
			return new Int16Array(
				accessor.bufferView.buffer.arrayBuffer,
				accessor.byteOffset + accessor.bufferView.byteOffset,
				accessor.count * numberOfComponentsForType(accessor.type)
			);
		case gl.UNSIGNED_SHORT:
			return new Uint16Array(
				accessor.bufferView.buffer.arrayBuffer,
				accessor.byteOffset + accessor.bufferView.byteOffset,
				accessor.count * numberOfComponentsForType(accessor.type)
			);
	}

	throw new Error(`Unknown native array type ${accessor.componentType}`);
}
