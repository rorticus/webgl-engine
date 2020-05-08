import { GlBuffer, Renderable } from "./Renderable";

export class Triangle implements Renderable {
	private vertices: number[] = [-1, -1, 0, -1, 1, 0, 1, 1, 0];
	private normals: number[] = [0, 0, 1, 0, 0, 1, 0, 0, 1];
	private indices: number[] = [0, 1, 2];

	private indexBuffer: GlBuffer;
	private vertexBuffer: GlBuffer;
	private normalBuffer: GlBuffer;

	createBuffers(gl: WebGLRenderingContext) {
		this.indexBuffer = {
			buffer: gl.createBuffer(),
			itemSize: 1,
			numItems: this.indices.length,
		};

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer.buffer);
		gl.bufferData(
			gl.ELEMENT_ARRAY_BUFFER,
			new Uint16Array(this.indices),
			gl.STATIC_DRAW
		);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		this.vertexBuffer = {
			buffer: gl.createBuffer(),
			itemSize: 3,
			numItems: 3,
		};

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer.buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(this.normals),
			gl.STATIC_DRAW
		);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		this.normalBuffer = {
			buffer: gl.createBuffer(),
			itemSize: 3,
			numItems: 3,
		};

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer.buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(this.normals),
			gl.STATIC_DRAW
		);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	render(gl: WebGLRenderingContext) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer.buffer);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer.buffer);

		gl.drawElements(
			gl.TRIANGLES,
			this.indexBuffer.numItems,
			gl.UNSIGNED_SHORT,
			0
		);
	}
}
