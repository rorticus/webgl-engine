export interface UniformSetter {
	setter: (v: any) => void;
	location: WebGLUniformLocation;
	info: WebGLActiveInfo;
}

export interface AttribSetter {
	setter: (v: any) => void;
	location: GLint;
	info: WebGLActiveInfo;
}

export interface ProgramInfo {
	program: WebGLProgram;
	uniformSetters: Record<string, UniformSetter>;
	attribSetters: Record<string, AttribSetter>;
}

export interface BufferInfo {
	attribs: Record<string, any>;
	indices?: WebGLBuffer;
	numElements?: number;
	elementType?: number;
}

export interface Renderable {
	programInfo: ProgramInfo;
	attributes: BufferInfo;
	uniforms: Record<string, any>;
}

export interface GlBuffer {
	buffer: WebGLBuffer;
	itemSize: number;
	numItems: number;
	type: number;
	normalize: boolean;
	stride: number;
	offset: number;
}

export interface PrimitiveData {
	numComponents: number;
	data: number[];
}

export interface Primitive {
	position: PrimitiveData;
	texcoord: PrimitiveData;
	normal: PrimitiveData;
	indices?: PrimitiveData;
}
