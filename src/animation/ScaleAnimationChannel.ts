import { AnimationChannel } from "./AnimationChannel";
import { vec3 } from "gl-matrix";

export class ScaleAnimationChannel extends AnimationChannel<vec3> {
	getValue(time: number): vec3 {
		const [min, max, t] = this.getBounds(time);

		if (min && !max) {
			return min;
		}

		const result = vec3.create();

		vec3.lerp(result, min, max, t);

		return result;
	}

	apply(value: vec3, weight = 1) {
		vec3.lerp(this.gameObject.scale, this.gameObject.scale, value, weight);
	}
}
