import { AnimationChannel } from "./AnimationChannel";
import { vec3 } from "gl-matrix";

export class TranslationAnimationChannel extends AnimationChannel<vec3> {
	getValue(time: number): vec3 {
		const [min, max, t] = this.getBounds(time);

		const result = vec3.create();

		vec3.lerp(result, min, max, t);

		return result;
	}

	apply(value: vec3, weight = 1) {
		vec3.lerp(
			this.gameObject.position,
			this.gameObject.position,
			value,
			weight
		);
	}
}
