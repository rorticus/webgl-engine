export const vertexShader = `
const int NUM_POSITIONAL_LIGHTS = 2;

uniform mat4 u_matrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_worldInverseTranspose;
uniform vec3 u_lightWorldPosition[NUM_POSITIONAL_LIGHTS];

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord_0;

varying vec3 v_normal;
varying vec3 v_surfaceToLight[NUM_POSITIONAL_LIGHTS];
varying vec3 v_position;
varying vec2 v_texcoord0;
 
void main() {
  vec4 surfacePosition = u_matrix * vec4(a_position, 1.0);
	
  gl_Position = u_projectionMatrix * surfacePosition;
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