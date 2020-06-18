import { GameComponentContext } from "../interfaces";
import { AnimationChannel } from "./AnimationChannel";

export enum AnimationWrapMode {
	None,
	Loop,
	Bounce,
}

export class AnimationState {
	time: number = 0;
	channels: AnimationChannel[] = [];
	wrapMode: AnimationWrapMode;
	duration: number = 0;

	reset() {
		this.time = 0;
	}

	update(context: GameComponentContext) {
		this.time += context.deltaInSeconds;

		if (this.duration === 0) {
			this.duration = Math.max(
				...this.channels.map((channel) => channel.getDuration())
			);
		}

		let adjustedTime = this.time;

		if (this.time > this.duration) {
			if (this.wrapMode === AnimationWrapMode.None) {
				return;
			} else if (this.wrapMode === AnimationWrapMode.Loop) {
				while (adjustedTime > this.duration) {
					adjustedTime -= this.duration;
				}
			} else if (this.wrapMode === AnimationWrapMode.Bounce) {
				while (adjustedTime > this.duration * 2) {
					adjustedTime -= this.duration * 2;
				}

				if (adjustedTime > this.duration) {
					adjustedTime = this.duration * 2 - adjustedTime;
				}
			}
		}

		this.channels.forEach((channel) => {
			const value = channel.getValue(adjustedTime);
			channel.apply(value);
		});
	}
}
