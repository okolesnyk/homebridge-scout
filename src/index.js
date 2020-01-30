import { DeviceManager } from './device-manager';
import { HubManager } from './hub-manager';
import { ScoutApi } from './scout-api';
import { ScoutPlatform } from './scout-platform';

const PLUGIN_NAME = 'homebridge-scout';
const PLATFORM_NAME = 'ScoutAlarm';

export default (homebridge) => {
    let pluginVersion = require('../package.json').version;

    homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, function(logger, config) {
        logger.info(`Running ${PLUGIN_NAME}-${pluginVersion} on homebridge-${homebridge.serverVersion}.`);

        let api = new ScoutApi(logger, config.auth.email, config.auth.password);
        let hubManager = new HubManager(homebridge, logger, api);
        let deviceManager = new DeviceManager(homebridge, logger, api, config.reverseSensorState);
        let platform = new ScoutPlatform(homebridge, logger, api, hubManager, deviceManager, config.location, config.modes);

        homebridge.on('didFinishLaunching', () => {
            platform.registerAccessories().catch(e => logger.error(e));
        });

        platform.on('addAccessory', accessory => {
            try {
                homebridge.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            } catch (e) {
                this.logger.error(e);
            }
        });

        platform.on('removeAccessory', accessory => {
            try {
                homebridge.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            } catch (e) {
                this.logger.error(e);
            }
        });

        return platform;
    });
};
