import {Material, MaterialRenderingContext} from "./Material";
import { Light } from "../../Light";
import { Lights } from "../../Lights";
import { GlBuffer } from "../Renderable";

const vertexShaderSource = this.createShader(
	"x-shader/x-vertex",
	`
	const int MAX_BONES = 100;
	uniform bool useSkinning;
	uniform mat4 boneGlobalMatrices[MAX_BONES];
	attribute vec4 skinIndex;
	attribute vec4 skinWeight;
    attribute vec3 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec4 aVertexColor;
    uniform mat4 mvMatrix;
    uniform mat4 pMatrix;
    uniform mat4 nMatrix;
    
    attribute vec2 aTextureCoord;
    varying highp vec2 vTextureCoord;
    
    varying vec3 transformedNormal;
    varying vec3 vertexPos;
    
    const int NUM_POSITIONAL_LIGHTS = 2;
    uniform vec3 uLightPosition[NUM_POSITIONAL_LIGHTS];
    varying vec3 uLightRay[NUM_POSITIONAL_LIGHTS];
    
    mat4 getBoneMatrix(const in float i) {
    	mat4 bone = boneGlobalMatrices[int(i)];
    	return bone;
    }
    void main(void) {
    	vec4 vertexPos4 = mvMatrix * vec4(aVertexPosition, 1.0);
    	vertexPos = vertexPos4.xyz;
    	
    	for(int i = 0; i < NUM_POSITIONAL_LIGHTS; i++) {
    		vec4 newLightPosition = mvMatrix * vec4(uLightPosition[i], 1.0);
    		uLightRay[i] = vertexPos - newLightPosition.xyz;
    	}
    	
    	transformedNormal = vec3(nMatrix * vec4(aVertexPosition, 1.0));
		if(useSkinning) {
			mat4 boneMatX = getBoneMatrix(skinIndex.x);
			mat4 boneMatY = getBoneMatrix(skinIndex.y);
			vec4 skinVertex = vec4(aVertexPosition, 1.0);
			vec4 skinned = boneMatX * skinVertex * skinWeight.x;
			skinned += boneMatY * skinVertex * skinWeight.y;
			skinned = mvMatrix * skinned;
			
			vertexPos = skinned.xyz;
			gl_Position = pMatrix * skinned;
			mat4 skinMatrix = skinWeight.x * boneMatX;
			skinMatrix += skinWeight.y * boneMatY;
			vec4 skinnedNormal = skinMatrix * vec4(aVertexNormal, 0.0);
			transformedNormal = vec3(nMatrix * skinnedNormal);
		} else {
        	gl_Position = pMatrix * vertexPos4;
		}   
		 
        vTextureCoord = aTextureCoord;
    }
		`
);
const fragmentShaderSource = this.createShader(
	"x-shader/x-fragment",
	`
		    precision mediump float;
    varying vec3 transformedNormal;
    varying vec3 vertexPos;
    
    uniform sampler2D uSampler;
    varying highp vec2 vTextureCoord;
    
    const int NUM_DIRECTIONAL_LIGHTS = 1;
    uniform vec3 uLightDirection[NUM_DIRECTIONAL_LIGHTS];
    
    const int NUM_POSITIONAL_LIGHTS = 2;
    varying vec3 uLightRay[NUM_POSITIONAL_LIGHTS];
    
    uniform vec3 uAmbientColor;
    uniform vec3 uDirectionalDiffuseColor[NUM_DIRECTIONAL_LIGHTS];
    uniform vec3 uDirectionalSpecularColor[NUM_DIRECTIONAL_LIGHTS];
    uniform vec3 uPositionalDiffuseColor[NUM_POSITIONAL_LIGHTS];
    uniform vec3 uPositionalSpecularColor[NUM_POSITIONAL_LIGHTS];
    
    uniform vec3 materialDiffuseColor;
    uniform vec3 materialAmbientColor;
    uniform vec3 materialSpecularColor;
    void main(void) {
    	vec3 normal = normalize(transformedNormal);
    	vec3 eyeVector = normalize(-vertexPos);
    	
    	vec3 iAmbient = uAmbientColor * materialAmbientColor;
        
    	vec3 iDiffuse = vec3(0.0, 0.0, 0.0);
    	vec3 iSpecular = vec3(0.0, 0.0, 0.0);
    	float specular = 0.0;
    	
    	for(int i = 0; i < NUM_DIRECTIONAL_LIGHTS; i++) {
    		vec3 lightDirection = normalize(uLightDirection[i]);
    		float directionalLightWeighting = max(dot(normal, -lightDirection), 0.0);
    		
    		iDiffuse += uDirectionalDiffuseColor[i] * materialDiffuseColor * directionalLightWeighting;
    		
    		if(directionalLightWeighting > 0.0) {
    			vec3 halfDir = normalize(-lightDirection + eyeVector);
    			float specAngle = max(dot(halfDir, normal), 0.0);    	
    		
    			specular = pow(specAngle, 4.0);
    			
    			iSpecular += uDirectionalSpecularColor[i] * materialSpecularColor * specular;
    		}
    	}    	
    	
    	for(int i = 0; i < NUM_POSITIONAL_LIGHTS; i++) {
    	    vec3 lightDirection = normalize(uLightRay[i]);
            float directionalLightWeighting = max(dot(normal, -lightDirection), 0.0);
            
            iDiffuse += uPositionalDiffuseColor[i] * materialDiffuseColor * directionalLightWeighting;
            
            if(directionalLightWeighting > 0.0) {
                vec3 halfDir = normalize(-lightDirection + eyeVector);
                float specAngle = max(dot(halfDir, normal), 0.0);
                specular = pow(specAngle, 4.0);
                
                iSpecular += uPositionalSpecularColor[i] * materialSpecularColor * specular;
            }
    	}
    	
    	vec3 iColor = iAmbient + iDiffuse + iSpecular; 
    	
        gl_FragColor = vec4(iColor, 1.0) * texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    }
`
);

export class TexturedLightingMaterial extends Material {
	private vertexPositionAttribute: number;
	private materialDiffuseColor: WebGLUniformLocation;
	private materialSpecularColor: WebGLUniformLocation;
	private materialAmbientColor: WebGLUniformLocation;
	private uAmbientColor: WebGLUniformLocation;
	private uLightPosition: WebGLUniformLocation;
	private directionalColorUniform: WebGLUniformLocation;
	private specularColorUniform: WebGLUniformLocation;
	private uLightDirection: WebGLUniformLocation;
	private uPositionalDiffuseColor: WebGLUniformLocation;
	private uPositionalSpecularColor: WebGLUniformLocation;
	private uDirectionalDiffuseColor: WebGLUniformLocation;
	private uDirectionalSpecularColor: WebGLUniformLocation;
	private uSampler: WebGLUniformLocation;
	private aTextureCoord: GLint;
	private skinIndex: GLint;
	private skinWeight: GLint;
	private useSkinning: WebGLUniformLocation;
	private boneGlobalMatrices: WebGLUniformLocation;
	private vertexNormalAttribute: GLint;

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

		this.vertexNormalAttribute = gl.getAttribLocation(
			shaderProgram,
			"aVertexNormal"
		);
		gl.enableVertexAttribArray(this.vertexNormalAttribute);

		this.aTextureCoord = gl.getAttribLocation(shaderProgram, "aTextureCoord");
		gl.enableVertexAttribArray(this.aTextureCoord);

		this.pMatrixUniform = gl.getUniformLocation(shaderProgram, "pMatrix");
		this.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "mvMatrix");
		this.nMatrixUniform = gl.getUniformLocation(shaderProgram, "nMatrix");
		this.materialDiffuseColor = gl.getUniformLocation(
			shaderProgram,
			"materialDiffuseColor"
		);
		this.materialSpecularColor = gl.getUniformLocation(
			shaderProgram,
			"materialSpecularColor"
		);
		this.materialAmbientColor = gl.getUniformLocation(
			shaderProgram,
			"materialAmbientColor"
		);

		this.uAmbientColor = gl.getUniformLocation(shaderProgram, "uAmbientColor");
		this.uLightDirection = gl.getUniformLocation(
			shaderProgram,
			"uLightDirection"
		);
		this.uPositionalDiffuseColor = gl.getUniformLocation(
			shaderProgram,
			"uPositionalDiffuseColor"
		);
		this.uPositionalSpecularColor = gl.getUniformLocation(
			shaderProgram,
			"uPositionalSpecularColor"
		);
		this.uDirectionalDiffuseColor = gl.getUniformLocation(
			shaderProgram,
			"uDirectionalDiffuseColor"
		);
		this.uDirectionalSpecularColor = gl.getUniformLocation(
			shaderProgram,
			"uDirectionalSpecularColor"
		);

		this.uLightPosition = gl.getUniformLocation(
			shaderProgram,
			"uLightPosition"
		);

		this.uSampler = gl.getUniformLocation(shaderProgram, "uSampler");

		this.skinIndex = gl.getAttribLocation(shaderProgram, "skinIndex");
		this.skinWeight = gl.getAttribLocation(shaderProgram, "skinWeight");
		this.useSkinning = gl.getUniformLocation(shaderProgram, "useSkinning");
		this.boneGlobalMatrices = gl.getUniformLocation(
			shaderProgram,
			"boneGlobalMatrices"
		);
	}

	setup(gl: WebGLRenderingContext) {
		gl.useProgram(this._shaderProgram);

		const l1 = new Light();
		l1.ambientColor = [0.1, 0.1, 0.1];
		l1.diffuseColor = [0.5, 0.5, 0.5];
		l1.specularColor = [1, 1, 1];
		l1.direction = [0, -1.25, -1.25];

		const l2 = new Light();
		l2.diffuseColor = [1, 1, 1];
		l2.specularColor = [0, 0, 0];
		l2.position = [0, 0, -10];

		const l3 = new Light();
		l3.diffuseColor = [1, 1, 1];
		l3.specularColor = [0, 0, 0];
		l3.position = [20, 5, 200];

		const lights = new Lights();
		lights.addLight(l1);
		lights.addLight(l2);
		lights.addLight(l3);

		gl.uniform3fv(this.uAmbientColor, lights.getDataByType("ambientColor"));
		gl.uniform3fv(
			this.uDirectionalDiffuseColor,
			lights.getDataByType("diffuseColor", "direction")
		);
		gl.uniform3fv(
			this.uDirectionalSpecularColor,
			lights.getDataByType("specularColor", "direction")
		);
		gl.uniform3fv(
			this.uPositionalDiffuseColor,
			lights.getDataByType("diffuseColor", "position")
		);
		gl.uniform3fv(
			this.uPositionalSpecularColor,
			lights.getDataByType("specularColor", "position")
		);
		gl.uniform3fv(this.uLightPosition, lights.getDataByType("position"));
		gl.uniform3fv(this.uLightDirection, lights.getDataByType("direction"));
	}

	render(
	    gl: WebGLRenderingContext,
        context: MaterialRenderingContext
	) {
		super.render(gl, context);

		// material color
		gl.uniform3f(this.materialDiffuseColor, context.diffuseColor[0], context.diffuseColor[1], context.diffuseColor[2]);
		gl.uniform3f(this.materialAmbientColor, context.ambientColor[0], context.ambientColor[1], context.ambientColor[2]);
		gl.uniform3f(this.materialSpecularColor, context.specularColor[0], context.specularColor[1], context.specularColor[2]);

		// normal buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, context.normalBuffer.buffer);
		gl.vertexAttribPointer(this.vertexNormalAttribute, context.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

		// texture buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, context.textureBuffer.buffer);
    }
}
