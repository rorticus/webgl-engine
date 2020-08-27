import { GlAccessor, GlBuffer, GlBufferAndView } from "./interfaces";
import { GltfAccessor } from "./gltf";
import { mat4 } from "gl-matrix";
import { GameObject } from "../GameObject";

export class Skin {
	joints: any[];
	inverseBindMatrices: Float32Array[] = [];
	jointMatrices: Float32Array[] = [];
	jointData: Float32Array;
	jointTexture: WebGLTexture;

	constructor(
		gl: WebGLRenderingContext,
		joints: any[],
		inverseBindMatrixData: GlAccessor
	) {
		this.joints = joints;
		this.jointData = new Float32Array(joints.length * 16);

		for (let i = 0; i < joints.length; i++) {
			this.inverseBindMatrices.push(
				new Float32Array(
					inverseBindMatrixData.bufferView.buffer.arrayBuffer,
					inverseBindMatrixData.bufferView.byteOffset +
						inverseBindMatrixData.byteOffset +
						Float32Array.BYTES_PER_ELEMENT * 16 * i,
					16
				)
			);
			this.jointMatrices.push(
				new Float32Array(
					this.jointData.buffer,
					Float32Array.BYTES_PER_ELEMENT * 16 * i,
					16
				)
			);
		}

		const texture = gl.createTexture();
		if (!texture) {
			throw new Error("Failed to create joint texture");
		}

		this.jointTexture = texture;
		gl.bindTexture(gl.TEXTURE_2D, this.jointTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}

	update(gl: WebGLRenderingContext, node: GameObject) {
		if (!node.worldMatrix) {
			return;
		}

		const globalWorldInverse = mat4.create();
		mat4.invert(globalWorldInverse, node.worldMatrix);

		for (let j = 0; j < this.joints.length; j++) {
			const dst = this.jointMatrices[j] as mat4;
			mat4.mul(dst, globalWorldInverse, this.joints[j].worldMatrix);
			mat4.mul(dst, dst, this.inverseBindMatrices[j] as mat4);
		}

		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

		gl.bindTexture(gl.TEXTURE_2D, this.jointTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			4,
			this.joints.length,
			0,
			gl.RGBA,
			gl.FLOAT,
			this.jointData
		);

		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
		// const fb = gl.createFramebuffer();
		// gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		// gl.framebufferTexture2D(
		// 	gl.FRAMEBUFFER,
		// 	gl.COLOR_ATTACHMENT0,
		// 	gl.TEXTURE_2D,
		// 	this.jointTexture,
		// 	0
		// );
		//
		//
		// const textureData = new Float32Array(32);
		// gl.readPixels(0, 0, 4, 2, gl.RGBA, gl.FLOAT, textureData);
		//
		// console.table(
		// 	Array.from(textureData).map((td, index) => [
		// 		td,
		// 		this.jointData[index],
		// 	])
		// );
		// // console.log(textureData);
		// // console.log(this.jointData);
		// debugger;
	}
}
