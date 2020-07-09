import { AnimationChannel } from "./AnimationChannel";
import { quat } from "gl-matrix";

export class RotationAnimationChannel extends AnimationChannel<quat> {
	getValue(time: number): quat {
		const [min, max, t] = this.getBounds(time);

		const result = quat.create();

		quat.slerp(result, min, max, t);

		return result;
	}

	apply(value: quat, weight = 1) {
		quat.slerp(
			this.gameObject.rotation,
			this.gameObject.rotation,
			value,
			weight
		);
	}
}
