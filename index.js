const ScoutPlatform = require('./lib/scout-platform');
const ScoutApi = require('./lib/scout-api');

const PLUGIN_NAME = 'homebridge-scout';
const PLATFORM_NAME = 'ScoutAlarm';

module.exports = (homebridge) => {
    homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, function(logger, config) {
        let api = new ScoutApi(logger, config.auth.email, config.auth.password);
        let platform = new ScoutPlatform(homebridge, logger, api, config.location, config.modes);

        homebridge.on('didFinishLaunching', () => {
            logger("Loading ScoutAlarm accesories…");

            platform.getAccessories().then(() => {
                logger("Finished loading ScoutAlarm accessories.");
            }).catch(e => logger(e));
        });

        platform.on('addAccessory', accessory => {
            logger('Registering ScoutAlarm accessory', accessory.displayName);
            homebridge.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        });

        platform.on('removeAccessory', accessory => {
            logger('Unregistering ScoutAlarm accessory', accessory.displayName);
            homebridge.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        });

        return platform;
    });
};
