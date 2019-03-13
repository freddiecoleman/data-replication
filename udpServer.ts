import * as dgram from 'dgram';
import * as EventEmitter from 'events';
import { AddressInfo } from 'net';
import * as pino from 'pino';
import LocalState from './localState';
import protocol from './protocol';
import serialisers from './serialisers';
import Message from './serialisers/message';


const log = pino();

export const processRumorMessage = (message: Message, eventEmitter: EventEmitter) => {
    const rumorMessage = message[protocol.messageType.RUMOR];

    log.info(`Received rumor message from ${rumorMessage[protocol.rumorMessage.ORIGIN]}`);

    eventEmitter.emit('message:rumor', message[protocol.messageType.RUMOR]);
};

export const processStatusMessage = (message: Message, eventEmitter: EventEmitter) => {
    const statusMessage = message[protocol.messageType.STATUS];

    log.info(`Received status message from ${statusMessage[protocol.statusMessage.ORIGIN]}`);

    eventEmitter.emit('message:status', message[protocol.messageType.STATUS]);
};

export const errorHandler = (udpServer: dgram.Socket) => (err: Error) => {
    log.error(`UDP server error:\n${err.stack}`);
    
    udpServer.close();
}

export const messageHandler = (eventEmitter: EventEmitter) => (serialisedMessage: Buffer, remoteInfo: dgram.RemoteInfo) => {
    log.trace(`UDP server got: ${serialisedMessage.toString('hex')} from ${remoteInfo.address}:${remoteInfo.port}`);

    try {
        const message = serialisers.messageDeserialiser.deserialise(serialisedMessage);
        const messageType = Object.keys(message)[0];

        switch (messageType) {
            case protocol.messageType.RUMOR:
                return processRumorMessage(message, eventEmitter);
            case protocol.messageType.STATUS:
                return processStatusMessage(message, eventEmitter);
            default:
                log.error(`Received unsupported message type: ${messageType}`);
        }
    } catch (err) {
        log.error(err);
        eventEmitter.emit('message:invalid', new Error(`Received unsupported message: ${serialisedMessage.toString('hex')} from ${remoteInfo.address}:${remoteInfo.port}`));        
    }
};

export const start = (localState: LocalState, eventEmitter: EventEmitter) => {
    const udpServer = dgram.createSocket('udp4');
    const onListening = () => {
        const address: AddressInfo = <AddressInfo> udpServer.address();
        
        log.info(`UDP server listening at ${address.address}:${address.port}`);
    };

    udpServer.on('error', errorHandler(udpServer));
    udpServer.on('message', messageHandler(eventEmitter));
    udpServer.on('listening', onListening);
    
    udpServer.bind(localState.port);
};

