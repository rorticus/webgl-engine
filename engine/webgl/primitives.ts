function augmentTypedArray(typedArray: any, numComponents: number) {
	var cursor = 0;
	typedArray.push = function () {
		for (var ii = 0; ii < arguments.length; ++ii) {
			var value = arguments[ii];
			if (
				value instanceof Array ||
				(value.buffer && value.buffer instanceof ArrayBuffer)
			) {
				for (var jj = 0; jj < value.length; ++jj) {
					typedArray[cursor++] = value[jj];
				}
			} else {
				typedArray[cursor++] = value;
			}
		}
	};
	typedArray.reset = function (opt_index: number) {
		cursor = opt_index || 0;
	};
	typedArray.numComponents = numComponents;
	Object.defineProperty(typedArray, "numElements", {
		get: function get() {
			return (this.length / this.numComponents) | 0;
		},
	});
	return typedArray;
}

function createAugmentedTypedArray(
	numComponents: number,
	numElements: number,
	opt_type?: any
) {
	var Type = opt_type || Float32Array;
	return augmentTypedArray(
		new Type(numComponents * numElements),
		numComponents
	);
}

var CUBE_FACE_INDICES = [
	[3, 7, 5, 1], // right
	[6, 2, 0, 4], // left
	[6, 7, 3, 2], // ??
	[0, 1, 5, 4], // ??
	[7, 6, 4, 5], // front
	[2, 3, 1, 0],
];

export function createCubeVertices(size: number) {
	size = size || 1;
	const k = size / 2;

	const cornerVertices = [
		[-k, -k, -k],
		[+k, -k, -k],
		[-k, +k, -k],
		[+k, +k, -k],
		[-k, -k, +k],
		[+k, -k, +k],
		[-k, +k, +k],
		[+k, +k, +k],
	];

	const faceNormals = [
		[+1, +0, +0],
		[-1, +0, +0],
		[+0, +1, +0],
		[+0, -1, +0],
		[+0, +0, +1],
		[+0, +0, -1],
	];

	const uvCoords = [
		[1, 0],
		[0, 0],
		[0, 1],
		[1, 1],
	];

	const numVertices = 6 * 4;
	const positions = createAugmentedTypedArray(3, numVertices);
	const normals = createAugmentedTypedArray(3, numVertices);
	const texcoords = createAugmentedTypedArray(2, numVertices);
	const indices = createAugmentedTypedArray(3, 6 * 2, Uint16Array);

	for (let f = 0; f < 6; ++f) {
		const faceIndices = CUBE_FACE_INDICES[f];
		for (let v = 0; v < 4; ++v) {
			const position = cornerVertices[faceIndices[v]];
			const normal = faceNormals[f];
			const uv = uvCoords[v];

			// Each face needs all four vertices because the normals and texture
			// coordinates are not all the same.
			positions.push(position);
			normals.push(normal);
			texcoords.push(uv);
		}
		// Two triangles make a square face.
		const offset = 4 * f;
		indices.push(offset + 0, offset + 1, offset + 2);
		indices.push(offset + 0, offset + 2, offset + 3);
	}

	return {
		position: { data: positions, numComponents: positions.numComponents },
		normal: { data: normals, numComponents: normals.numComponents },
		texcoord: { data: texcoords, numComponents: texcoords.numComponents },
		indices: { data: indices, numComponents: indices.numComponents },
	};
}
