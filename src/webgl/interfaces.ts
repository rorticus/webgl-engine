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

export interface GlTexture {
	texture: WebGLTexture;
	type: number;
}

export interface BufferInfo {
	attribs: Record<string, GlBufferAndView | GlTexture>;
	indices?: WebGLBuffer;
	numElements?: number;
	elementType?: number;
}

export interface SingleRenderable {
	attributes: BufferInfo;
	uniforms: Record<string, any>;
}

export interface Renderable {
	programInfo: ProgramInfo;
	renderables: SingleRenderable[];
}

export interface GlBufferAndView {
	buffer: WebGLBuffer;
	itemSize: number;
	numItems: number;
	type: number;
	normalize: boolean;
	stride: number;
	offset: number;
}

export interface GlBuffer {
	/** Actual data **/
	arrayBuffer: ArrayBuffer;
	/** The length of ths buffer in bytes **/
	byteLength: number;
}

export interface GlBufferView {
	/** Buffer that this view points to **/
	buffer: GlBuffer;
	/** Offset into the buffer **/
	byteOffset: number;
	/** The length in bytes of the entire buffer view **/
	byteLength: number;
	/** The number of bytes between entries **/
	byteStride: number;
	/** gl.ARRAY_BUFFER or gl.ELEMENTS **/
	target: GLenum;
}

export enum GlAccessorType {
	SCALAR = "SCALAR",
	VEC2 = "VEC2",
	VEC3 = "VEC3",
	VEC4 = "VEC4",
	MAT2 = "MAT2",
	MAT3 = "MAT3",
	MAT4 = "MAT4",
}

export type NativeArray =
	| Int8Array
	| Uint8Array
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| Float32Array;

export interface GlAccessor {
	/** BufferView that this Accessor points to **/
	bufferView: GlBufferView;
	/** The byte offset into the buffer view that this accessor starts at **/
	byteOffset: number;
	/** Element component type type like gl.FLOAT, gl.UNSIGNED_SHORT **/
	componentType: GLenum;
	/** The number of elements in the buffer view, not the number of bytes **/
	count: number;
	/** Element type like SCALAR or VEC2 **/
	type: GlAccessorType;
	/** Native array **/
	nativeArray: NativeArray;
}

export interface PrimitiveData {
	numComponents: number;
	data: number[];
}

export interface Primitive {
	position: PrimitiveData;
	texcoord?: PrimitiveData;
	normal?: PrimitiveData;
	indices?: PrimitiveData;
}
