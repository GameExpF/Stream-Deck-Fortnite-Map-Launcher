import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { exec } from 'child_process';

/**
 * An example action class that displays a count that increments by one each time the button is pressed.
 */
@action({ UUID: "dev.gameexpf.fortnite-map-launcher.launch" })
export class MapLauncher extends SingletonAction<LauncherSettings> {
	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<LauncherSettings>): Promise<void> {
		await this.updateMapImage(ev.action, ev.payload.settings);
		await this.updateKeyName(ev.action, ev.payload.settings);
	}

	override async onSendToPlugin(ev: SendToPluginEvent<any, any>) {
		streamDeck.logger.info(ev.payload)
	}

	override async onWillAppear(ev: WillAppearEvent<LauncherSettings>): Promise<void> {
		const { settings } = ev.payload;
		await this.updateMapImage(ev.action, settings);
		await this.updateKeyName(ev.action, settings);
	}

	private async updateKeyName(action: any, settings: LauncherSettings): Promise<void> {
		const titleFormat = settings.titleFormat || "index";
		const mapCode = settings.mapCode || "";
		if (mapCode.length !== 14) {
			return await action.setTitle("");
		}
		switch (titleFormat) {
			case ("code"):
				await action.setTitle(`${mapCode.split("-").join("\n")}`);
				break;
			case ("name"):
				const mapName = settings.mapName || "";
				await action.setTitle(`${mapName}`);
				break;
			default:
				await action.setTitle("");
				break;
		}
	}

	private async updateMapImage(action: any, settings: LauncherSettings): Promise<void> {
		await action.setImage("imgs/actions/map-launcher/fortnite.png");
	}

	override async onKeyDown(ev: KeyDownEvent<LauncherSettings>): Promise<void> {
		this.launchMap(ev);
	}

	private async launchMap(ev: KeyDownEvent<LauncherSettings>): Promise<void> {
		const { settings } = ev.payload;

		const mapCode = settings.mapCode || "";
		const launchLocally = settings.localPC || true;
		if (mapCode.length === 14) {
			if (launchLocally === true) {
				const uri = `com.epicgames.launcher://apps/fn%3A4fe75bbc5a674f4f9b356b5c90567da5%3AFortnite?action=launch&silent=true&arg=-IslandOverride%3D${mapCode}?play`;
				const command = `start "" "${uri}"`;
				exec(command, (error) => {
					if (error) {
						streamDeck.logger.error(`Launch error: ${error}`);
						ev.action.showAlert();
					} else {
						streamDeck.logger.info(`Launched the map successfuly`);
					}
				});
			} else {
				await streamDeck.system.openUrl(`https://play.fn.gg/island/${mapCode}`);
			}
		} else {
			await ev.action.showAlert();
		}
	}

	private async refreshMapData() {
		streamDeck.logger.info("Refreshing map data");
	}
}

type LauncherSettings = {
	mapName?: string;
	mapCode?: string;
	localPC?: boolean;
	titleFormat?: string;
	isConnected?: boolean;
};
