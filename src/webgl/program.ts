import { MaterialInstance } from "../interfaces";
import { ProgramInfo } from "./interfaces";
import { createProgramInfoFromProgram } from "./utils";

function createShader(gl: WebGLRenderingContext, type: GLenum, source: string) {
	const shader = gl.createShader(type);
	if (!shader) {
		throw new Error("Failed to create GL shader");
	}

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

	console.error(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
	throw new Error("Error creating shader");
}

export function createProgram(
	gl: WebGLRenderingContext,
	vertexShaderSource: string,
	fragmentShaderSource: string,
	defaultInstanceParams?: MaterialInstance
): ProgramInfo {
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	const fragmentShader = createShader(
		gl,
		gl.FRAGMENT_SHADER,
		fragmentShaderSource
	);

	const program = gl.createProgram();
	if (!program) {
		throw new Error("Failed to create GL program");
	}
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	return createProgramInfoFromProgram(gl, program, defaultInstanceParams);
}
