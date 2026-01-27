import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { exec } from 'child_process';
import { Jimp } from "jimp";

@action({ UUID: "dev.gameexpf.fortnite-map-launcher.launch" })
export class MapLauncher extends SingletonAction<LauncherSettings> {

	override async onSendToPlugin(ev: SendToPluginEvent<any, LauncherSettings>) {
		streamDeck.logger.info(ev.payload)
		switch (ev.payload.command) {
			case "updateMapInfo":
				var info = await ev.action.getSettings();
				info.mapName = ev.payload.payload.map.title;
				info.mapData = ev.payload.payload.map;
				await ev.action.setSettings(info);
				await this.updateKeyName(ev.action, info);
				await this.updateMapImage(ev.action, info);
				break;
			case "resetMapImg":
				var info = await ev.action.getSettings();
				info.mapData = undefined;
				await ev.action.setSettings(info);
				await ev.action.setImage("imgs/actions/map-launcher/fortnite.png");
				break;
			default:
				break;
		}
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
		var mapImg = settings.mapData?.epicImageUrl || "";
		if (mapImg.length === 0) {
			return await action.setImage("imgs/actions/map-launcher/fortnite.png");
		} else {
			try {
				const base64Image = await this.getSquareImage(mapImg, settings);
				await action.setImage(base64Image);
			} catch (error) {
				streamDeck.logger.error("Failed to set image:", error);
				await action.showAlert();
			}
		}
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

	private async getSquareImage(url: string, settings: LauncherSettings): Promise<string> {
		try {
			const image = await Jimp.read(url);

			let hValue;

			const alignment = settings.imagePosition || "center";
			switch (alignment) {
				case ("left"):
					hValue = ALIGN.LEFT;
					break;
				case ("right"):
					hValue = ALIGN.RIGHT;
					break;
				case ("center"):
					hValue = ALIGN.CENTER;
					break;
				default:
					hValue = ALIGN.CENTER;
					break;
			}
			image.cover({
				w: 144,
				h: 144,
				align: hValue
			}
			);
			const base64 = await image.getBase64("image/png");
			return base64;
		} catch (error) {
			console.error("Jimp error:", error);
			throw error;
		}
	}
}

type LauncherSettings = {
	mapName?: string;
	mapCode?: string;
	localPC?: boolean;
	titleFormat?: string;
	isConnected?: boolean;
	imagePosition?: string;
	mapData?: mapData;
};

type MapUpdateData = {
	command?: string;
	payload: {
		map: mapData;
	}
};

type mapData = {
	title: string;
	epicImageUrl: string;
};

const ALIGN = {
	LEFT:   1 << 0,
	CENTER: 1 << 1,
	RIGHT:  1 << 2,
};