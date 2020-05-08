import {Light} from "../../Light";
import {GlBuffer} from "../Renderable";
import {mat4, vec3} from "gl-matrix";
import {Camera} from "../../Camera";

export class Material {
    protected _shaderProgram: WebGLShader;

    // these are going to be passed to every shader
    protected pMatrixUniform: WebGLUniformLocation;
    protected mvMatrixUniform: WebGLUniformLocation;
    protected nMatrixUniform: WebGLUniformLocation;

    createShader(gl: WebGLRenderingContext, shaderType: string, shaderSource: string) {
        let shader;

        if (shaderType === "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderType === "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        }

        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error("Failed to compile shader");
        }

        return shader;
    }

    setup(gl: WebGLRenderingContext) {}

    render(gl: WebGLRenderingContext, context: MaterialRenderingContext) {
        gl.uniformMatrix4fv(this.pMatrixUniform, false, context.projectionMatrix);
        gl.uniformMatrix4fv(this.mvMatrixUniform, false, context.modelViewMatrix);
        gl.uniformMatrix4fv(this.nMatrixUniform, false, context.normalMatrix);
    }
}

export interface MaterialRenderingContext {
    lights: Light[];
    normalBuffer: GlBuffer;
    textureBuffer: GlBuffer;
    indexBuffer: GlBuffer;
    vertexBuffer: GlBuffer;
    projectionMatrix: mat4;
    modelViewMatrix: mat4;
    normalMatrix: mat4;
    diffuseColor: vec3 | number[];
    ambientColor: vec3 | number[];
    specularColor: vec3 | number[];
}