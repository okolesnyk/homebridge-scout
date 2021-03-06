import * as Ajv from 'ajv';
import type { API, Logging } from 'homebridge';

export enum HomebridgeConfigMode {
    Stay = 'stay',
    Away = 'away',
    Night = 'night',
}

export interface HomebridgeConfig {
    platform: 'ScoutAlarm';
    auth: {
        email: string;
        password: string;
    };
    location: string;
    modes?: {
        [key in HomebridgeConfigMode]: string[];
    };
    reverseSensorState?: boolean;
}

export interface HomebridgeContext {
    api: API;
    logger: Logging;
    config: HomebridgeConfig;
}

export class HomebridgeContextFactory {
    private static readonly JSON_SCHEMA_PATH = '../../config.schema.json';

    private readonly schema: Record<string, unknown>;

    public constructor() {
        this.schema = (require(HomebridgeContextFactory.JSON_SCHEMA_PATH) as Record<string, unknown>).schema as Record<string, unknown>;
    }

    public create(api: API, logger: Logging, config: unknown): HomebridgeContext {
        const ajv = new Ajv();
        const isValid = ajv.validate(this.schema, config) as boolean;

        if (!isValid && ajv.errors && 0 < ajv.errors.length) {
            const error = ajv.errors[0];
            const message = `Configuration error: config${error.dataPath} ${error.message || ''}`;

            throw new Error(message);
        }

        return {
            api,
            logger,
            config: config as HomebridgeConfig,
        };
    }
}
