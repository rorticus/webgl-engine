import {vec3, vec4} from "gl-matrix";

export interface Face {
    indices: number[];

    normal: vec3;

    vertexNormals: vec3[];
    vertexColors: number[];
    materialIndex: number;
    colorIndex: number;

    uvs: number[];
    vertexUvs: number[][];
}

export interface RawModelMaterial {
    colorAmbient: [number, number, number];
    colorDiffuse: [number, number, number];
    colorSpecular: [number, number, number];
    illumination: number;
    opticalDensity: number;
    specularCoef: number;
    transparency: number;
}

export interface Bone {
    name: string;
    parent: number;
    rotq: number[];
    pos: number[];
    scl?: number[];
}

export interface RawModel {
    metadata: any;
    scale: number;
    materials: RawModelMaterial[];
    vertices: number[];
    normals: number[];
    colors: number[];
    uvs: number[][];
    faces: number[];
    skinWeights?: number[];
    skinIndices?: number[];
    bones?: Bone[];
    animation?: RawAnimation;
}

export interface RawAnimation {
    name: string;
    initialized?: boolean;
    fps: number;
    length: number;
    hierarchy: {
        parent: number;
        keys: {
            index?: number;
            time: number;
            pos: number[];
            rot: number[];
            scl: number[];
        }[];
    }[];
}

function isBitSet(value: number, position: number) {
    return value & (1 << position);
}

export class Geometry {
    vertices: number[] = [];
    colors: number[] = [];
    normals: number[] = [];
    indices: number[] = [];
    faces: Face[] = [];
    materials: RawModelMaterial[] = [];
    uvs: number[][];
    skinWeights: number[] = [];
    skinIndices: number[] = [];
    bones: Bone[] = [];
    animation: any;

    protected indicesFromFaces() {
        this.faces.forEach((face) => {
            this.indices = [...this.indices, ...face.indices];
        });
    }

    protected calculateVertexNormals() {
        const vertexVectors: vec3[] = [];
        const normalVectors: vec3[] = [];

        for (let i = 0; i < this.vertices.length; i += 3) {
            const vector = vec3.fromValues(
                this.vertices[i],
                this.vertices[i + 1],
                this.vertices[i + 2]
            );
            const normal = vec3.create();
            normalVectors.push(normal);
            vertexVectors.push(vector);
        }

        for (let j = 0; j < this.indices.length; j = j + 3) {
            const vector1 = vec3.create();
            vec3.subtract(
                vector1,
                vertexVectors[this.indices[j + 1]],
                vertexVectors[this.indices[j]]
            );

            const vector2 = vec3.create();
            vec3.subtract(
                vector2,
                vertexVectors[this.indices[j + 2]],
                vertexVectors[this.indices[j + 1]]
            );

            const normal = vec3.create();
            vec3.cross(normal, vector1, vector2);

            vec3.add(
                normalVectors[this.indices[j]],
                normalVectors[this.indices[j]],
                normal
            );
            vec3.add(
                normalVectors[this.indices[j + 1]],
                normalVectors[this.indices[j + 1]],
                normal
            );
            vec3.add(
                normalVectors[this.indices[j + 2]],
                normalVectors[this.indices[j + 2]],
                normal
            );
        }

        for (let j = 0; j < normalVectors.length; j++) {
            vec3.normalize(normalVectors[j], normalVectors[j]);

            this.normals.push(normalVectors[j][0]);
            this.normals.push(normalVectors[j][1]);
            this.normals.push(normalVectors[j][2]);
        }
    }

    protected morphedVertexNormalsFromObj() {
        const normalVectors: vec3[] = [];

        for (let i = 0; i < this.faces.length; i++) {
            if (
                this.faces[i].normal !== undefined &&
                this.faces[i].vertexNormals.length === 0
            ) {
                this.faces[i].vertexNormals[0] = vec3.clone(this.faces[i].normal);
                this.faces[i].vertexNormals[1] = vec3.clone(this.faces[i].normal);
                this.faces[i].vertexNormals[2] = vec3.clone(this.faces[i].normal);
            }

            if (normalVectors[this.faces[i].indices[0]] === undefined) {
                normalVectors[this.faces[i].indices[0]] = vec3.clone(
                    this.faces[i].vertexNormals[0]
                );
            } else {
                vec3.add(
                    normalVectors[this.faces[i].indices[0]],
                    normalVectors[this.faces[i].indices[0]],
                    this.faces[i].vertexNormals[0]
                );
            }

            if (normalVectors[this.faces[i].indices[1]] === undefined) {
                normalVectors[this.faces[i].indices[1]] = vec3.clone(
                    this.faces[i].vertexNormals[1]
                );
            } else {
                vec3.add(
                    normalVectors[this.faces[i].indices[1]],
                    normalVectors[this.faces[i].indices[1]],
                    this.faces[i].vertexNormals[1]
                );
            }

            if (normalVectors[this.faces[i].indices[2]] === undefined) {
                normalVectors[this.faces[i].indices[2]] = vec3.clone(
                    this.faces[i].vertexNormals[2]
                );
            } else {
                vec3.add(
                    normalVectors[this.faces[i].indices[2]],
                    normalVectors[this.faces[i].indices[2]],
                    this.faces[i].vertexNormals[2]
                );
            }
        }

        this.normals = [];
        for (let j = 0; j < normalVectors.length; j++) {
            vec3.normalize(normalVectors[j], normalVectors[j]);
            this.normals.push(normalVectors[j][0]);
            this.normals.push(normalVectors[j][1]);
            this.normals.push(normalVectors[j][2]);
        }
    }

    static parseSkin(data: RawModel, geometry: Geometry) {
        if (data.skinWeights) {
            for (let i = 0, l = data.skinWeights.length; i < l; i += 2) {
                const x = data.skinWeights[i];
                const y = data.skinWeights[i + 1];

                geometry.skinWeights.push(x);
                geometry.skinWeights.push(y);
                geometry.skinWeights.push(0);
                geometry.skinWeights.push(0);
            }
        }

        if (data.skinIndices) {
            for (let i = 0, l = data.skinIndices.length; i < l; i += 2) {
                geometry.skinIndices.push(data.skinIndices[i]);
                geometry.skinIndices.push(data.skinIndices[i + 1]);
                geometry.skinIndices.push(0);
                geometry.skinIndices.push(0);
            }
        }

        geometry.bones = data.bones;
        geometry.animation = data.animation;
    }

    static parseJSON(data: RawModel) {
        const faceArray = [];

        const { faces, normals } = data;
        let nUvLayers = 0;

        for (let i = 0; i < data.uvs.length; i++) {
            if (data.uvs[i].length) {
                nUvLayers++;
            }
        }

        let offset = 0;
        let zLength = faces.length;
        let nVertices = 0;
        let face: Face;

        while (offset < zLength) {
            const type = faces[offset++];

            const isQuad = isBitSet(type, 0);
            const hasMaterial = isBitSet(type, 1);
            const hasFaceUv = isBitSet(type, 2);
            const hasFaceVertexUv = isBitSet(type, 3);
            const hasFaceNormal = isBitSet(type, 4);
            const hasFaceVertexNormal = isBitSet(type, 5);
            const hasFaceColor = isBitSet(type, 6);
            const hasFaceVertexColor = isBitSet(type, 7);

            if (isQuad) {
                face = {
                    indices: [
                        faces[offset++],
                        faces[offset++],
                        faces[offset++],
                        faces[offset++],
                    ],
                    vertexNormals: [],
                    materialIndex: 0,
                    normal: vec3.create(),
                    vertexColors: [],
                    colorIndex: 0,
                    uvs: [],
                    vertexUvs: [],
                };
                nVertices = 4;
            } else {
                face = {
                    indices: [faces[offset++], faces[offset++], faces[offset++]],
                    vertexNormals: [],
                    materialIndex: 0,
                    normal: vec3.create(),
                    vertexColors: [],
                    colorIndex: 0,
                    uvs: [],
                    vertexUvs: [],
                };
                nVertices = 3;
            }

            if (hasMaterial) {
                face.materialIndex = faces[offset++];
            }

            if (hasFaceUv) {
                for (let i = 0; i < nUvLayers; i++) {
                    face.uvs[i] = faces[offset++];
                }
            }

            if (hasFaceVertexUv) {
                for (let i = 0; i < nUvLayers; i++) {
                    const uvs = [];
                    for (let j = 0; j < nVertices; j++) {
                        uvs[j] = faces[offset++];
                    }
                    face.vertexUvs[i] = uvs;
                }
            }

            let normalIndex;
            let normal;

            if (hasFaceNormal) {
                normalIndex = faces[offset++] * 3;
                normal = vec3.fromValues(
                    normals[normalIndex++],
                    normals[normalIndex++],
                    normals[normalIndex]
                );
                face.normal = normal;
            }

            if (hasFaceVertexNormal) {
                for (let i = 0; i < nVertices; i++) {
                    normalIndex = faces[offset++] * 3;
                    normal = vec3.fromValues(
                        normals[normalIndex++],
                        normals[normalIndex++],
                        normals[normalIndex]
                    );
                    face.vertexNormals.push(normal);
                }
            }

            if (hasFaceColor) {
                face.colorIndex = faces[offset++];
            }

            if (hasFaceVertexColor) {
                for (let i = 0; i < nVertices; i++) {
                    face.vertexColors.push(faces[offset++]);
                }
            }

            faceArray.push(face);
        }

        return faceArray;
    }

    static parseModel(model: RawModel) {
        const geometry = new Geometry();

        geometry.faces = Geometry.parseJSON(model);
        geometry.vertices = [];
        geometry.materials = model.materials;

        if (model.bones && model.bones.length > 0) {
            Geometry.parseSkin(model, geometry);
        }

        geometry.verticesFromFaceUVs(model.vertices, model.uvs, 0);

        geometry.indicesFromFaces();

        if (model.normals.length > 0) {
            geometry.morphedVertexNormalsFromObj();
        } else {
            geometry.calculateVertexNormals();
        }

        return geometry;
    }

    verticesFromFaceUVs(
        vertices: number[],
        uvs: number[][],
        materialIndex: number
    ) {
        const vertexVectors: vec3[] = [];
        let redundantVertexVectors: number[] = [];
        let redundantSkinIndices: vec4[] = [];
        let redundantSkinWeights: vec4[] = [];

        for (let i = 0; i < vertices.length; i += 3) {
            const vector = vec3.fromValues(
                vertices[i],
                vertices[i + 1],
                vertices[i + 2]
            );
            vertexVectors.push(vector);
        }

        for (let i = 0; i < this.skinIndices.length; i += 4) {
            const vectorA = vec4.fromValues(
                this.skinIndices[i],
                this.skinIndices[i + 1],
                this.skinIndices[i + 2],
                this.skinIndices[i + 3]
            );
            const vectorB = vec4.fromValues(
                this.skinWeights[i],
                this.skinWeights[i + 1],
                this.skinWeights[i + 2],
                this.skinWeights[i + 3]
            );

            redundantSkinIndices.push(vectorA);
            redundantSkinWeights.push(vectorB);
        }

        for (let i = 0; i < this.faces.length; i++) {
            const face = this.faces[i];
            const textureIndices = face.vertexUvs[materialIndex];

            for (let j = 0; j < face.indices.length; j++) {
                if (
                    redundantVertexVectors[textureIndices[j]] == face.indices[j] ||
                    redundantVertexVectors[textureIndices[j]] === undefined
                ) {
                    redundantVertexVectors[textureIndices[j]] = face.indices[j];
                    face.indices[j] = textureIndices[j];
                } else {
                    uvs[materialIndex].push(uvs[materialIndex][textureIndices[j] * 2]);
                    uvs[materialIndex].push(
                        uvs[materialIndex][textureIndices[j] * 2 + 1]
                    );

                    const newIndex = Math.floor(uvs[materialIndex].length / 2) - 1;
                    redundantVertexVectors[newIndex] = face.indices[j];
                    face.indices[j] = newIndex;
                    textureIndices[j] = newIndex;
                }
            }
        }

        let tempSkinIndices = [];
        let tempSkinWeights = [];

        for (let i = 0; i < redundantVertexVectors.length; i++) {
            const vector = vertexVectors[redundantVertexVectors[i]];
            const vectorB = redundantSkinIndices[redundantVertexVectors[i]];
            const vectorC = redundantSkinWeights[redundantVertexVectors[i]];

            this.vertices.push(vector[0]);
            this.vertices.push(vector[1]);
            this.vertices.push(vector[2]);

            if (redundantSkinIndices.length > 0) {
                tempSkinIndices.push(vectorB[0]);
                tempSkinIndices.push(vectorB[1]);
                tempSkinIndices.push(vectorB[2]);
                tempSkinIndices.push(vectorB[3]);
                tempSkinWeights.push(vectorC[0]);
                tempSkinWeights.push(vectorC[1]);
                tempSkinWeights.push(vectorC[2]);
                tempSkinWeights.push(vectorC[3]);
            }
        }

        if (redundantSkinIndices.length > 0) {
            this.skinIndices = tempSkinIndices;
            this.skinWeights = tempSkinWeights;
        }

        this.uvs = uvs;
    }
}