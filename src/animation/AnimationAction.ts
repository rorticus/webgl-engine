export class AnimationAction {
	applied = false;
	start = 0;
	stop = 1 / 60;
	actionCallback: () => void = () => undefined;

	process(t: number) {
		if (t >= this.start && t <= this.stop) {
			if (!this.applied) {
				this.applied = true;
				this.actionCallback();
			}
		} else {
			this.applied = false;
		}
	}
}
