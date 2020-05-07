export class Material {
    protected _shaderProgram: WebGLShader;

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
}