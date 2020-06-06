export const vertexShader = `
const int NUM_POSITIONAL_LIGHTS = 2;

uniform mat4 u_matrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_worldInverseTranspose;
uniform vec3 u_lightWorldPosition[NUM_POSITIONAL_LIGHTS];
uniform sampler2D u_jointTexture;
uniform float u_numJoints;

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord_0;
attribute vec4 a_weights_0;
attribute vec4 a_joints_0;

varying vec3 v_normal;
varying vec3 v_surfaceToLight[NUM_POSITIONAL_LIGHTS];
varying vec3 v_position;
varying vec2 v_texcoord0;

#define ROW0_U ((0.5 + 0.0) / 4.0)
#define ROW1_U ((0.5 + 1.0) / 4.0)
#define ROW2_U ((0.5 + 2.0) / 4.0)
#define ROW3_U ((0.5 + 3.0) / 4.0)

mat4 getBoneMatrix(float jointNdx) {
    float v = (jointNdx + 0.5) / u_numJoints;
    
    return mat4(
        texture2D(u_jointTexture, vec2(ROW0_U, v)),
        texture2D(u_jointTexture, vec2(ROW1_U, v)),
        texture2D(u_jointTexture, vec2(ROW2_U, v)),
        texture2D(u_jointTexture, vec2(ROW3_U, v))    
    );
}
 
void main() {
  mat4 skinMatrix = getBoneMatrix(a_joints_0[0]) * a_weights_0[0] + 
                    getBoneMatrix(a_joints_0[1]) * a_weights_0[1] +
                    getBoneMatrix(a_joints_0[2]) * a_weights_0[2] +
                    getBoneMatrix(a_joints_0[3]) * a_weights_0[3];

  mat4 world = u_matrix * skinMatrix;
  vec4 surfacePosition = world * vec4(a_position, 1.0);
  
  gl_Position = u_projectionMatrix * world * surfacePosition;
  v_normal = mat3(u_worldInverseTranspose) * a_normal;
  v_position = surfacePosition.xyz;
  v_texcoord0 = a_texcoord_0; 
  
  // point lighting
  vec3 surfaceWorldPosition = surfacePosition.xyz;
  
  for(int i = 0; i < NUM_POSITIONAL_LIGHTS; i++) {
  	vec4 lightPosition = vec4(u_lightWorldPosition[i], 1.0);
  	v_surfaceToLight[i] = surfaceWorldPosition - lightPosition.xyz;
  }  
}`;

export const fragmentShader = `
precision mediump float;

uniform vec3 u_color;
uniform vec3 u_ambientColor;
uniform sampler2D u_texture0;

const int NUM_POSITIONAL_LIGHTS = 2;

varying vec3 v_normal;
varying vec3 v_surfaceToLight[NUM_POSITIONAL_LIGHTS];
uniform vec3 u_lightWorldColor[NUM_POSITIONAL_LIGHTS];
varying vec3 v_position;
varying vec2 v_texcoord0;

vec3 calculateAmbientColor(void) {
	return u_ambientColor;
}

vec3 calculatePositionalLights(vec3 normal) {
	vec3 diffuse = vec3(0.0, 0.0, 0.0);
	
	for(int i = 0; i < NUM_POSITIONAL_LIGHTS; i++) {
		vec3 lightDirection = normalize(v_surfaceToLight[i]);
		float light = max(dot(normal, -lightDirection), 0.0);
		
		diffuse += u_lightWorldColor[i] * texture2D(u_texture0, v_texcoord0).xyz * light;				
	}
	
	return diffuse;
}

void main() {
	vec3 normal = normalize(v_normal);
	
	vec3 iSpecular = vec3(0.0, 0.0, 0.0);
		
	vec3 iColor = calculateAmbientColor() + calculatePositionalLights(normal) + iSpecular;
				
  	gl_FragColor = vec4(iColor, 1.0);
}
`;