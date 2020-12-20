import { GameObject } from "./GameObject";
import { GameComponent, GameComponentContext } from "./interfaces";

export class SoundComponent implements GameComponent {
	tag?: string | undefined = "SoundComponent";
	resource = "";
	autoStart = true;
	shouldStart = false;
	started = false;
	autoRemove = true;

	update(context: GameComponentContext, gameObject: GameObject) {
		if (this.autoStart && !this.shouldStart && !this.started) {
			this.shouldStart = true;
		}

		if (!this.shouldStart && !this.started) {
			this.started = true;
			context.engine.soundService.start(this.resource, () => {
				if (this.autoRemove) {
					gameObject.removeFromParent();
				}
			});
		}
    }
    
    start() {
        this.shouldStart = true;
    }
}
