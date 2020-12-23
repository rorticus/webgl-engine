import { GameComponentContext } from "../interfaces";
import { AnimationAction } from "./AnimationAction";
import { AnimationChannel } from "./AnimationChannel";

export enum AnimationWrapMode {
	None,
	Loop,
	Bounce,
}

export class AnimationState {
	time: number = 0;
	totalTime: number = 0;
	channels: AnimationChannel[] = [];
	actions: AnimationAction[] = [];
	wrapMode: AnimationWrapMode = AnimationWrapMode.None;
	duration: number = 0;
	timeScale = 1;
	onEnter?: () => void;
	onExit?: () => void;

	reset() {
		this.time = 0;
		this.totalTime = 0;
	}

	update(context: GameComponentContext, weight = 1) {
		this.time += context.deltaInSeconds * this.timeScale;
		this.totalTime += context.deltaInSeconds;

		if (this.duration === 0) {
			this.duration = Math.max(
				...this.channels.map((channel) => channel.getDuration())
			);
		}

		if (this.time > this.duration) {
			if (this.wrapMode === AnimationWrapMode.None) {
				return;
			} else if (this.wrapMode === AnimationWrapMode.Loop) {
				while (this.time > this.duration) {
					this.time -= this.duration;
				}
			} else if (this.wrapMode === AnimationWrapMode.Bounce) {
				while (this.time > this.duration * 2) {
					this.time -= this.duration * 2;
				}

				if (this.time > this.duration) {
					this.time = this.duration * 2 - this.time;
				}
			}
		}

		this.channels.forEach((channel) => {
			const value = channel.getValue(this.time);
			channel.apply(value, weight);
		});

		this.actions.forEach((action) => action.process(this.time));
	}
}
