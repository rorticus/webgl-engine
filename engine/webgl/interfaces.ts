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
    indices?: number[];
    numElements?: number;
}

export interface Renderable {
    programInfo: ProgramInfo;
    bufferInfo: BufferInfo;
    uniforms: any;
}

export interface GlBuffer {
    buffer: WebGLBuffer;
    itemSize: number;
    numItems: number;
}
