import { ConnectionState, ConnectionStateEvent } from "scout-api";
import { HomebridgeContext, ScoutContext } from "./context";
import { ServiceFactory } from "./serviceFactory";
import { Categories, PlatformAccessory } from "./types";

export interface AccessoryInfo<T> {
    name: string;
    id: string;
    category: Categories;
    context: T;
    manufacturer: string;
    model: string;
    serialNumber: string;
    firmwareRevision: string;
    hardwareRevision?: string;
}

export interface AccessoryContext<T> {
    readonly locationId: string;
    readonly custom: T;
    isConnected: boolean;
}

export interface TypedPlatformAccessory<T> extends PlatformAccessory {
    context: AccessoryContext<T>;
}

export abstract class AccessoryFactory<T> {
    private readonly configuredAccessories = new Set<TypedPlatformAccessory<T>>();
    private readonly listeningLocations = new Set<string>();

    public constructor(
        protected readonly homebridge: HomebridgeContext,
        protected readonly scout: ScoutContext,
        protected readonly serviceFactories: ServiceFactory<T>[],
    ) {
        this.scout.listener.addConnectionStateListener(event => {
            this.onConnectionStateEvent(event);
        });
    }

    public async createAccessories(locationId: string): Promise<TypedPlatformAccessory<T>[]> {
        return (await this.createAccessoryInfo(locationId)).map(accessoryInfo => this.createAccessory(locationId, accessoryInfo));
    }

    public configureAccessory(accessory: TypedPlatformAccessory<T>): void {
        const context = accessory.context;
        const services = new Set([this.homebridge.api.hap.Service.AccessoryInformation.UUID]);

        this.serviceFactories.forEach(serviceFactory => {
            const serviceConstructor = serviceFactory.getService(context);

            if (serviceConstructor !== undefined) {
                const service = accessory.getService(serviceConstructor);

                if (service !== undefined) {
                    serviceFactory.configureService(service, context);

                    services.add(service.UUID);
                }
            }
        });

        accessory.services.forEach(service => {
            if (!services.has(service.UUID)) {
                accessory.removeService(service);
            }
        });

        this.configuredAccessories.add(accessory);

        const locationId = accessory.context.locationId;

        if (!this.listeningLocations.has(locationId)) {
            this.addLocationListeners(locationId);

            this.listeningLocations.add(locationId);
        }
    }

    protected addLocationListeners(locationId: string): void {
        return;
    }

    protected createAccessory(locationId: string, accessoryInfo: AccessoryInfo<T>): TypedPlatformAccessory<T> {
        const PlatformAccessory = this.homebridge.api.platformAccessory;
        const Characteristic = this.homebridge.api.hap.Characteristic;
        const Service = this.homebridge.api.hap.Service;

        const uuid = this.homebridge.api.hap.uuid.generate(accessoryInfo.id);
        const accessory = new PlatformAccessory(accessoryInfo.name, uuid, accessoryInfo.category) as TypedPlatformAccessory<T>;
        const accessoryInfoService = accessory.getService(Service.AccessoryInformation);

        if (accessoryInfoService) {
            accessoryInfoService
                .setCharacteristic(Characteristic.Manufacturer, accessoryInfo.manufacturer)
                .setCharacteristic(Characteristic.Model, accessoryInfo.model)
                .setCharacteristic(Characteristic.SerialNumber, accessoryInfo.serialNumber)
                .setCharacteristic(Characteristic.FirmwareRevision, accessoryInfo.firmwareRevision);

            if (undefined !== accessoryInfo.hardwareRevision) {
                accessoryInfoService.setCharacteristic(Characteristic.HardwareRevision, accessoryInfo.hardwareRevision);
            }
        }

        accessory.context = {
            locationId,
            custom: accessoryInfo.context,
            isConnected: ConnectionState.Connected === this.scout.listener.getConnectionState(),
        };

        return accessory;
    }

    protected updateAccessory(accessory: TypedPlatformAccessory<T>): void {
        this.serviceFactories.forEach(serviceFactory => {
            const serviceConstructor = serviceFactory.getService(accessory.context);

            if (serviceConstructor !== undefined) {
                const service = accessory.getService(serviceConstructor);

                if (service !== undefined) {
                    serviceFactory.updateService(service, accessory.context);
                }
            }
        });
    }

    protected onConnectionStateEvent(event: ConnectionStateEvent): void {
        this.homebridge.logger.debug(`Connection state event: ${JSON.stringify(event)}`);

        this.configuredAccessories.forEach(accessory => {
            accessory.context.isConnected = ConnectionState.Connected === event.current;

            this.updateAccessory(accessory);
        });
    }

    protected abstract createAccessoryInfo(locationId: string): Promise<AccessoryInfo<T>[]>;
}
