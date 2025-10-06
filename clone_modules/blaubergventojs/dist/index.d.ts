import { Persistable, CrudRepository, PageRequest, Page } from '@apaq/leap-data-core';

/**
 * Parameter enumeration.
 *
 * This enum defines various parameters used in communication with devices or controllers.
 * Each parameter is associated with a unique byte value that represents a specific setting or state.
 */
declare enum Parameter {
    ON_OFF = 1,
    SPEED = 2,
    BOOT_MODE = 6,
    TIMER_MODE = 7,
    TIMER_COUNT_DOWN = 8,
    HUMIDITY_SENSOR_ACTIVATION = 15,
    RELAY_SENSOR_ACTIVIATION = 20,
    VOLTAGE_SENSOR_ACTIVATION = 22,// 0-10V
    HUMIDITY_THRESHOLD = 25,
    CURRENT_RTC_BATTERY_VOLTAGE = 36,// 0-5000mv
    CURRENT_HUMIDITY = 37,
    CURRENT_VOLTAGE_SENSOR_STATE = 45,// 0-100
    CURRENT_RELAY_SENSOR_STATE = 50,
    MANUAL_SPEED = 68,
    FAN1RPM = 74,
    FAN2RPM = 75,
    FILTER_TIMER = 100,
    RESET_FILTER_TIMER = 101,
    BOOST_MODE_DEACTIVATION_DELAY = 102,// 0-60 minutes
    RTC_TIME = 111,
    RTC_CALENDAR = 112,
    WEEKLY_SCHEDULE = 114,
    SCHEDULE_SETUP = 119,
    SEARCH = 124,
    PASSWORD = 125,
    MACHINE_HOURS = 126,
    RESET_ALARMS = 128,
    READ_ALARM = 131,
    CLOUD_SERVER_OPERATION_PERMISSION = 133,
    READ_FIRMWARE_VERSION = 134,
    RESTORE_FACTORY_SETTINGS = 135,
    FILTER_ALARM = 136,
    WIFI_MODE = 148,
    WIFI_NAME = 149,
    WIFI_PASSWORD = 150,
    WIFI_ENCRYPTION = 153,
    WIFI_CHANNEL = 154,
    WIFI_DHCP = 155,
    IP_ADDRESS = 156,
    SUBNET_MASK = 157,
    GATEWAY = 158,
    CURRENT_IP_ADDRESS = 163,
    VENTILATION_MODE = 183,
    UNIT_TYPE = 185
}
/**
 * Parameter namespace.
 *
 * Contains utility functions for working with parameters.
 */
declare namespace Parameter {
    /**
     * Gets the size in bytes for a given parameter.
     *
     * @param {Parameter} parameter - The parameter for which to get the size.
     * @returns {number} The size in bytes of the parameter, or -1 if the parameter is unknown.
     */
    function getSize(parameter: Parameter): number;
}

/**
 * DataEntry module.
 *
 * This module defines the structure for data entries used in communication protocols. It includes
 * an interface to represent a data entry and a namespace with a utility function to create data entries.
 */

/**
 * DataEntry interface.
 *
 * Represents a single entry of data with an associated parameter and optional value.
 *
 * @property {Parameter} parameter - The parameter associated with this data entry.
 * @property {Uint8Array | undefined} [value] - The value of the data entry, represented as a Uint8Array.
 */
interface DataEntry {
    parameter: Parameter;
    value?: Uint8Array;
}
declare namespace DataEntry {
    /**
     * Creates a new DataEntry instance.
     *
     * This function constructs a DataEntry object with a specified parameter and an optional value.
     * The value is converted to a Uint8Array if provided.
     *
     * @param {Parameter} parameter - The parameter to associate with the data entry.
     * @param {number} [value] - The value to be included in the data entry (optional). If provided, it is converted to a Uint8Array.
     * @returns {DataEntry} A new DataEntry object with the given parameter and value.
     */
    function of(parameter: Parameter, value?: number): DataEntry;
}

/**
 * FunctionType enumeration.
 *
 * This enum defines the different types of functions that can be used in communication protocols.
 * Each type is represented by a unique byte value.
 */
declare enum FunctionType {
    /**
     * READ function type.
     *
     * Indicates a request to read data from a device or controller.
     */
    READ = 1,
    /**
     * WRITE function type.
     *
     * Indicates a request to write data to a device or controller.
     */
    WRITE = 2,
    /**
     * WRITEREAD function type.
     *
     * Indicates a request to both write data to and read data from a device or controller.
     */
    WRITEREAD = 3,
    /**
     * INCREAD function type.
     *
     * Indicates a request to increment a value on a device or controller and read the result.
     */
    INCREAD = 4,
    /**
     * DECREAD function type.
     *
     * Indicates a request to decrement a value on a device or controller and read the result.
     */
    DECREAD = 5,
    /**
     * RESPONSE function type.
     *
     * Indicates a response from a device or controller to a request.
     */
    RESPONSE = 6
}

/**
 * Packet class.
 *
 * Represents a communication packet used in the protocol. The packet includes headers, credentials,
 * function types, data entries, and a checksum to ensure data integrity. It provides methods to
 * serialize the packet to bytes and to deserialize it from bytes.
 */

/**
 * Packet class.
 *
 * This class is used to create, serialize, and deserialize packets for communication. It includes
 * functionality to handle different types of functions and data entries, as well as to validate
 * the integrity of the packet using a checksum.
 */
declare class Packet {
    private _deviceId;
    private _password;
    private _functionType;
    private _dataEntries;
    /**
     * Creates a new Packet instance.
     *
     * @param {string} deviceId - The device ID to include in the packet.
     * @param {string} password - The password for the device.
     * @param {FunctionType} functionType - The type of function to perform.
     * @param {DataEntry[]} dataEntries - The data entries to include in the packet.
     */
    constructor(deviceId: string, password: string, functionType: FunctionType, dataEntries: DataEntry[]);
    /**
     * Gets the device ID.
     *
     * @returns {string} The device ID.
     */
    get deviceId(): string;
    /**
     * Gets the password.
     *
     * @returns {string} The password.
     */
    get password(): string;
    /**
     * Gets the function type.
     *
     * @returns {FunctionType} The function type.
     */
    get functionType(): FunctionType;
    /**
     * Gets the data entries.
     *
     * @returns {DataEntry[]} The data entries.
     */
    get dataEntries(): DataEntry[];
    /**
     * Serializes the packet to a byte array.
     *
     * The packet is serialized into a Uint8Array with a specific format including a header, protocol type,
     * credentials, function type, data entries, and a checksum.
     *
     * @returns {Uint8Array} The serialized byte array of the packet.
     */
    toBytes(): Uint8Array;
    /**
     * Deserializes a byte array into a Packet instance.
     *
     * @param {Uint8Array} bytes - The byte array to deserialize.
     * @returns {Packet} The deserialized Packet instance.
     * @throws {Error} If the header, protocol type, or checksum are invalid.
     */
    static fromBytes(bytes: Uint8Array): Packet;
    /**
     * Reads a credential from the byte array.
     *
     * @param {Uint8Array} bytes - The byte array containing the credential.
     * @param {number} index - The starting index to read from.
     * @returns {[string, number]} A tuple containing the credential string and the next index.
     */
    private static readCredential;
    /**
     * Writes a credential to the byte array.
     *
     * @param {Uint8Array} bytes - The byte array to write to.
     * @param {number} index - The starting index to write at.
     * @param {string} value - The credential to write.
     * @returns {number} The next index after writing the credential.
     */
    private writeCredential;
    /**
     * Reads data entries (parameters and values) from the byte array.
     *
     * @param {Uint8Array} bytes - The byte array containing the data entries.
     * @param {number} index - The starting index to read from.
     * @returns {[DataEntry[], number]} A tuple containing the array of DataEntry objects and the next index.
     */
    private static readParameters;
    /**
     * Calculates the checksum for a byte array.
     *
     * @param {Uint8Array} bytes - The byte array to calculate the checksum for.
     * @returns {number} The calculated checksum.
     */
    private static calculateChecksum;
}

/**
 * Response interface.
 *
 * Represents a response received from a device or controller.
 */
interface Response {
    /**
     * The packet received in the response.
     */
    packet: Packet;
    /**
     * The IP address of the device or controller that sent the response.
     */
    ip: string;
}

/**
 * BlaubergVentoClient module.
 *
 * This module provides a client interface for discovering and communicating with Blauberg Vento devices
 * over the local network using UDP. The client is capable of broadcasting packets to find devices,
 * and sending data packets to specific controllers to retrieve responses or configure the device.
 */

/**
 * DeviceAddress interface.
 *
 * Represents the structure of a discovered device's address information.
 *
 * @property {string} id - The unique identifier of the device (usually extracted from the packet).
 * @property {string} ip - The IP address of the discovered device.
 */
interface DeviceAddress {
    id: string;
    ip: string;
}
/**
 * BlaubergVentoClient class.
 *
 * This class provides methods to discover Blauberg Vento devices on the local network and to communicate
 * with specific controllers via UDP. It broadcasts messages to detect devices and handles the reception
 * of responses from these devices.
 */
declare class BlaubergVentoClient {
    timeout: number;
    broadcast_address: string;
    /**
     * Find devices on the network by emitting a broadcast packet and collecting all answering controllers.
     *
     * This method sends a broadcast UDP message with a search packet to discover Blauberg Vento devices.
     * The devices respond with their identifiers and IP addresses, which are collected and returned.
     *
     * @returns {Promise<DeviceAddress[]>} A promise that resolves to an array of DeviceAddress objects
     * representing the discovered devices.
     */
    findDevices(): Promise<DeviceAddress[]>;
    /**
     * Sends a packet to a specific controller.
     *
     * This method sends a data packet to a specific Blauberg Vento controller via its IP address.
     * It listens for a response packet and resolves with the packet or void if no response is received within the timeout period.
     *
     * @param {Packet} packet - The packet to send to the controller.
     * @param {string} [ip=BROADCAST_ADDRESS] - The IP address of the controller (default is the broadcast address).
     * @returns {Promise<Response | void>} A promise that resolves with a response packet if received, or void if no response.
     */
    send(packet: Packet, ip?: string): Promise<Response | void>;
}

/**
 * Enum representing the directions available for a device.
 *
 * The direction can be configured by the device's dip switch.
 */
declare enum Mode {
    /**
     * One-way direction.
     * The direction is set based on the dip switch on the device.
     */
    ONEWAY = 0,
    /**
     * Two-way direction.
     */
    TWOWAY = 1,
    /**
     * Inward direction.
     */
    IN = 2
}

/**
 * Enum representing the speed options available for a device.
 */
declare enum Speed {
    /**
     * The device is turned off.
     */
    OFF = 0,
    /**
     * The device is set to low speed.
     */
    LOW = 1,
    /**
     * The device is set to medium speed.
     */
    MEDIUM = 2,
    /**
     * The device is set to high speed.
     */
    HIGH = 3,
    /**
     * The device is set to manual speed.
     * This value indicates that the speed is controlled manually.
     */
    MANUAL = 255
}

/**
 * A class representing a single Duke One Device.
 *
 * This class provides methods to serialize and deserialize device state
 * from and to `Packet` instances, and to manage device-specific properties.
 */
declare class Device implements Persistable<string> {
    id: string;
    password: string;
    /**
     * The current speed setting of the device.
     */
    speed?: Speed;
    /**
     * The current mode of the device.
     */
    mode?: Mode;
    /**
     * The manual speed setting of the device.
     */
    manualSpeed: number;
    /**
     * The RPM of the first fan.
     */
    fan1Rpm: number;
    /**
     * The current humidity reading.
     */
    humidity: number;
    /**
     * Indicates if there is a filter alarm.
     */
    filterAlarm: boolean;
    /**
     * The filter time in minutes.
     */
    filterTime: number;
    /**
     * Indicates if the device is turned on.
     */
    on: boolean;
    /**
     * The firmware version of the device.
     */
    firmwareVersion: string;
    /**
     * The date of the firmware release.
     */
    firmwareDate: Date;
    /**
     * The unit type of the device.
     */
    unitType: number;
    /**
     * The IP address of the device.
     */
    ipAddress: string;
    /**
     * Creates an instance of the `Device` class.
     *
     * @param {string} id - The unique identifier for the device.
     * @param {string} password - The password for the device.
     */
    constructor(id: string, password: string);
    /**
     * Converts the device state to a `Packet` for communication.
     *
     * @returns {Packet} The packet containing the device's current state.
     */
    toPacket(): Packet;
    /**
     * Creates a `Device` instance from a `Packet`.
     *
     * @param {Packet} packet - The packet containing device data.
     * @returns {Device} The device instance with properties populated from the packet.
     */
    static fromPacket(packet: Packet): Device;
    /**
     * Applies a `DataEntry` to a `Device` instance, updating its properties.
     *
     * @param {Device} device - The device to update.
     * @param {DataEntry} dataEntry - The data entry containing the parameter and value.
     */
    private static applyParameter;
}

declare class BlaubergVentoResource implements CrudRepository<Device, string> {
    private client;
    private _ipMap;
    constructor();
    findAll(pageable?: PageRequest): Promise<Page<Device>>;
    findById(id: string): Promise<Device>;
    save(entity: Device): Promise<Device>;
    saveAll(entities: Device[]): Promise<Device[]>;
    deleteById(id: string): Promise<void>;
    deleteAllById(ids: string[]): Promise<void>;
    delete(entity: Device): Promise<void>;
    deleteAll(entities: Device[]): Promise<void>;
    private resolveDevice;
    private resolveIpMap;
}

export { BlaubergVentoClient, BlaubergVentoResource, DataEntry, Device, DeviceAddress, FunctionType, Mode, Packet, Parameter, Response, Speed };
