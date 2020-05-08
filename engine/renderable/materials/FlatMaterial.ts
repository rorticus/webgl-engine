import {Material, MaterialRenderingContext} from "./Material";

const vertexShaderSource = this.createShader(
    "x-shader/x-vertex",
    `
    attribute vec3 aVertexPosition;
    uniform mat4 mvMatrix;
    uniform mat4 pMatrix;
    uniform mat4 nMatrix;
        
    varying vec3 transformedNormal;
    varying vec3 vertexPos;
    
    void main(void) {
    	vec4 vertexPos4 = mvMatrix * vec4(aVertexPosition, 1.0);
    	vertexPos = vertexPos4.xyz;
    	    	
    	transformedNormal = vec3(nMatrix * vec4(aVertexPosition, 1.0));
    	
        gl_Position = pMatrix * vertexPos4;
    }
		`
);
const fragmentShaderSource = this.createShader(
    "x-shader/x-fragment",
    `
    precision mediump float;
    
    void main(void) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
`
);

export class FlatMaterial extends Material {
    private vertexPositionAttribute: GLint;

    constructor(gl: WebGLRenderingContext) {
        super();

        const fragmentShader = this.createShader(
            gl,
            "x-shader/x-fragment",
            fragmentShaderSource
        );
        const vertexShader = this.createShader(
            gl,
            "x-shader/x-vertex",
            vertexShaderSource
        );

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        this._shaderProgram = shaderProgram;

        this.vertexPositionAttribute = gl.getAttribLocation(
            shaderProgram,
            "aVertexPosition"
        );
        gl.enableVertexAttribArray(this.vertexPositionAttribute);

        this.pMatrixUniform = gl.getUniformLocation(shaderProgram, "pMatrix");
        this.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "mvMatrix");
        this.nMatrixUniform = gl.getUniformLocation(shaderProgram, "nMatrix");
    }

    render(gl: WebGLRenderingContext, context: MaterialRenderingContext) {
        super.render(gl, context);

        // normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, context.normalBuffer.buffer);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, context.indexBuffer.buffer);

        gl.bindBuffer(gl.ARRAY_BUFFER, context.vertexBuffer.buffer);
        gl.vertexAttribPointer(this.vertexPositionAttribute, context.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
}