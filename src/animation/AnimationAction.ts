export class AnimationAction {
	applied = false;
	t = 0;
	slop = 1 / 60;
	actionCallback: () => void = () => undefined;

	process(t: number) {
		if (Math.abs(t - this.t) >= this.slop) {
			this.applied = false;
		} else if (!this.applied) {
			this.applied = true;
			this.actionCallback();
		}
	}
}
