import { HomebridgeContext, ScoutContextFactory, HomebridgeContextFactory } from "./context";
import { API, Plugin, Logger, Config, Platform } from "./types";
import { SecuritySystemAccessoryFactory } from "./accessoryFactory/securitySystemAccessoryFactory";
import { SensorAccessoryFactory } from "./accessoryFactory/sensorAccessoryFactory";
import { BatteryServiceFactory } from "./serviceFactory/hub/batteryServiceFactory";
import { SecuritySystemServiceFactory } from "./serviceFactory/hub/securitySystemServiceFactory";
import { TemperatureServiceFactory } from "./serviceFactory/hub/temperatureServiceFactory";
import { ContactSensorServiceFactory } from "./serviceFactory/sensor/contactSensorServiceFactory";
import { MotionSensorServiceFactory } from "./serviceFactory/sensor/motionSensorServiceFactory";
import { LeakSensorServiceFactory } from "./serviceFactory/sensor/leakSensorServiceFactory";
import { SmokeSensorServiceFactory } from "./serviceFactory/sensor/smokeSensorServiceFactory";
import { HumiditySensorServiceFactory } from "./serviceFactory/sensor/humiditySensorServiceFactory";
import { TemperatureSensorServiceFactory } from "./serviceFactory/sensor/temperatureSensorServiceFactory";
import { ScoutPlatform } from "./scoutPlatform";

const plugin: Plugin = (api: API): void => {
    api.registerPlatform(ScoutPlatform.PLUGIN_NAME, ScoutPlatform.PLATFORM_NAME, function(logger: Logger, config: Config): Platform {
        const pluginVersion = require("../package.json").version;

        logger.info(`Running ${ScoutPlatform.PLUGIN_NAME}-${pluginVersion} on homebridge-${api.serverVersion}.`);

        const homebridge = new HomebridgeContextFactory().create(api, logger, config);

        return new ScoutPlatform(homebridge, new ScoutContextFactory(), scout => [
            new SecuritySystemAccessoryFactory(homebridge, scout, [
                new BatteryServiceFactory(homebridge, scout),
                new SecuritySystemServiceFactory(homebridge, scout),
                new TemperatureServiceFactory(homebridge, scout),
            ]),
            new SensorAccessoryFactory(homebridge, scout, [
                new ContactSensorServiceFactory(homebridge, scout),
                new MotionSensorServiceFactory(homebridge, scout),
                new LeakSensorServiceFactory(homebridge, scout),
                new SmokeSensorServiceFactory(homebridge, scout),
                new HumiditySensorServiceFactory(homebridge, scout),
                new TemperatureSensorServiceFactory(homebridge, scout),
            ]),
        ]);
    }, false);
};

export default plugin;
