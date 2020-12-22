export interface SoundOptions {
	defaultGain?: number;
}

declare namespace window {
	const webkitAudioContext: typeof AudioContext;
}

export class SoundService {
	private _audioContext?: AudioContext;
	private _gainNode?: GainNode;
	private _soundEffects: Record<string, AudioBuffer> = {};

	constructor({ defaultGain = 1 }: SoundOptions = {}) {
		this._audioContext = new (window.webkitAudioContext || AudioContext)();
		if (this._audioContext) {
			this._gainNode = this._audioContext?.createGain();
			if (this._gainNode) {
				this._gainNode.gain.value = defaultGain;
				this._gainNode?.connect(this._audioContext.destination);
			}

			this._audioContext?.addEventListener('statechange', () => console.log(this._audioContext?.state));
		}
	}

	resume() {
		this._audioContext?.resume();
	}

	private _loadBuffer(buffer: ArrayBuffer): Promise<AudioBuffer> {
		return new Promise<AudioBuffer>((resolve) => {
			this._audioContext?.decodeAudioData(buffer, (buffer) => {
				resolve(buffer);
			});
		});
	}

	async loadSoundEffect(name: string, data: ArrayBuffer) {
		this._soundEffects[name] = await this._loadBuffer(data);
	}

	start(name: string, callback?: () => void) {
		if (this._audioContext && this._gainNode) {
			const source = this._audioContext.createBufferSource();
			source.buffer = this._soundEffects[name];
			source.connect(this._gainNode);
			source.start(0);
			source.addEventListener("ended", function cb() {
				callback?.();
				source.removeEventListener("ended", cb);
			});
		}
	}
}
