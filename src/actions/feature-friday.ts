import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, KeyUpEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { exec } from 'child_process';

@action({ UUID: "dev.gameexpf.fortnite-map-launcher.fchqfflaunch" })
export class FeatureFridayLauncher extends SingletonAction<FeatureFridaySettings> {
	private _keyDownMap = new Map<string, number>();

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<FeatureFridaySettings>): Promise<void> {
		streamDeck.logger.info("Updating according to the new info");
		await this.updateTesterImage(ev.action, ev.payload.settings);
		await this.updateKeyName(ev.action, ev.payload.settings);
	}

	override async onWillAppear(ev: WillAppearEvent<FeatureFridaySettings>): Promise<void> {
		const { settings } = ev.payload;
		await this.updateTesterImage(ev.action, settings);
		await this.updateKeyName(ev.action, settings);
	}

	private async updateKeyName(action: any, settings: FeatureFridaySettings): Promise<void> {
		let globalSettings : GlobalSettings = await streamDeck.settings.getGlobalSettings();
		const titleFormat = settings.titleFormat || "index";
		const mapIndex = settings.mapIndex || "none";
		const tester = settings.tester || "none";
		const testerMaps = globalSettings.featureFridayData.maps.filter(m => m.teamLeader === tester);
		const mapCode = testerMaps[+mapIndex - 1];
		if (mapIndex === "none" || !mapCode) {
			return await action.setTitle("");
		}
		switch (titleFormat) {
			case ("index"):
				await action.setTitle(mapIndex);
				break;
			case ("code"):
				await action.setTitle(`${mapCode.code.split("-").join("\n")}`);
				break;
			case ("name"):
				const mapName = testerMaps[+mapIndex].title;
				await action.setTitle(`${mapName}`);
				break;
			default:
				await action.setTitle("");
				break;
		}
	}

	private async updateTesterImage(action: any, settings: FeatureFridaySettings): Promise<void> {
		if (settings.isComplete === true) {
			return action.setImage("imgs/actions/feature-friday/checkmark.png");
		}
		const showAvatar = settings.testerAvatar
		if (showAvatar === true || showAvatar === undefined) {
			switch (settings.tester) {
				case "HQ Crew":
					await action.setImage("imgs/actions/feature-friday/avatars/hq.png");
					break;
				case "MobileScrap":
					await action.setImage("imgs/actions/feature-friday/avatars/mobilescrap.png");
					break;
				case "Hay":
					await action.setImage("imgs/actions/feature-friday/avatars/hay.png");
					break;
				case "Olilz":
					await action.setImage("imgs/actions/feature-friday/avatars/olilz.png");
					break;
				case "Rebel":
					await action.setImage("imgs/actions/feature-friday/avatars/rebel.png");
					break;
				case "WornSnow":
					await action.setImage("imgs/actions/feature-friday/avatars/wornsnow.png");
					break;
				case "ChocolateChipGr":
					await action.setImage("imgs/actions/feature-friday/avatars/ccgr.png");
					break;
				default:
					await action.setImage("imgs/actions/feature-friday/fchq.png");
					break;
			}
		} else {
			await action.setImage("imgs/actions/feature-friday/fchq.png");
		}
	}

	override async onKeyDown(ev: KeyDownEvent<FeatureFridaySettings>): Promise<void> {
		this._keyDownMap.set(ev.action.id, Date.now());
	}

	override async onKeyUp(ev: KeyUpEvent<FeatureFridaySettings>): Promise<void> {
		const startTime = this._keyDownMap.get(ev.action.id);
		if (!startTime) return;
		this._keyDownMap.delete(ev.action.id);

		if (Date.now() - startTime > 500) {
			const { settings } = ev.payload;
			settings.isComplete = !settings.isComplete;
			await ev.action.setSettings(settings);
			await this.updateTesterImage(ev.action, settings);
		} else {
			await this.launchMap(ev);
		}
	}

	private async launchMap(ev: KeyDownEvent<FeatureFridaySettings> | KeyUpEvent<FeatureFridaySettings>): Promise<void> {
		const { settings } = ev.payload;

		const curMap = settings.mapIndex || "none";

		if (curMap === "none") {
			return ev.action.showAlert();
		}

		let globalSettings : GlobalSettings = await streamDeck.settings.getGlobalSettings();

		const tester = settings.tester || "none";
		const mapIndex = settings.mapIndex || "none";
		const testerMaps = globalSettings.featureFridayData.maps.filter(m => m.teamLeader === tester);
		const mapCode = testerMaps[+mapIndex - 1];
		const launchLocally = settings.localPC;

		if (mapCode && mapCode.code.length === 14) {
			if (launchLocally === true || launchLocally === undefined) {
				const uri = `com.epicgames.launcher://apps/fn%3A4fe75bbc5a674f4f9b356b5c90567da5%3AFortnite?action=launch&silent=true&arg=-IslandOverride%3D${mapCode.code}?play`;
				const command = `start "" "${uri}"`;
				exec(command, (error) => {
					if (error) {
						streamDeck.logger.error(`Launch error: ${error}`);
						return ev.action.showAlert();
					} else {
						streamDeck.logger.info(`Launched ${mapCode.code} successfuly`);
					}
				});
			} else {
				await streamDeck.system.openUrl(`https://play.fn.gg/island/${mapCode.code}`);
			}
		} else {
			return ev.action.showAlert();
		}
	}
}

type FeatureFridaySettings = {
	titleFormat?: string;
	mapIndex?: string;
	tester?: string;
	localPC?: boolean;
	testerAvatar?: boolean;
	isComplete?: boolean;
};

type GlobalSettings = {
	featureFridayData: {
		maps: [
			{
				title: string;
				code: string;
				teamLeader: string;
			}
		]
	}
}