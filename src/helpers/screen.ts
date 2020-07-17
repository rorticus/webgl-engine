import { Engine } from "../Engine";

export function screenSpaceToWorldSpace(engine: Engine, x: number, y: number) {
	const halfWidth = engine.gl.canvas.width / 2;
	const halfHeight = engine.gl.canvas.height / 2;

	return [
		(x - halfWidth) / halfWidth,
		(engine.gl.canvas.height - y - halfHeight) / halfHeight,
		0,
	];
}

export function worldSpaceToScreenSpace(engine: Engine, x: number, y: number) {
	const halfWidth = engine.gl.canvas.width / 2;
	const halfHeight = engine.gl.canvas.height / 2;

	return [
	  x * halfWidth + halfWidth,
	  halfHeight * 2 - (y * halfHeight + halfHeight)
	];
}
