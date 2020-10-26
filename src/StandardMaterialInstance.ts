import { vec4 } from "gl-matrix";
import { MaterialInstance } from "./interfaces";

export class StandardMaterialInstance implements MaterialInstance {
	outlineColor?: [number, number, number, number] | vec4 = undefined;

	getUniforms(): { [key: string]: any } {
		const p: { [key: string]: any } = {};

		if (this.outlineColor) {
			p.u_hasOutline = true;
			p.u_outlineColor = this.outlineColor;
		} else {
            p.u_hasOutline = false;
        }

		return p;
	}
}
