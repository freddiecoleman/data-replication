import * as dgram from 'dgram';
import * as EventEmitter from 'events';
import * as msgpack from 'msgpack5';
import LocalState from '../../localState';
import protocol from '../../protocol';
import { processRumorMessage, processStatusMessage, errorHandler, messageHandler, start } from '../../udpServer';

const { encode } = msgpack();

describe('udpServer', () => {
    const rumorMessage = {
        [protocol.rumorMessage.ORIGIN]: 'London',
        [protocol.rumorMessage.FROM]: 'Paris',
        [protocol.rumorMessage.SEQUENCE]: 123
    };
    const statusMessage = {
        [protocol.statusMessage.ORIGIN]: 'Berlin',
        [protocol.statusMessage.WANT]: 9
    };

    describe('#processRumorMessage', () => {
        it('emits message:rumor event with rumor message', done => {
            const message = { [protocol.messageType.RUMOR]: rumorMessage };
            const eventEmitter = new EventEmitter();

            eventEmitter.on('message:rumor', messageReceived => {
                expect(messageReceived).toBe(rumorMessage);
                done();
            });

            processRumorMessage(message, eventEmitter);
        });
    });

    describe('#processStatusMessage', () => {
        it('emits message:status event with status message', done => {
            const message = { [protocol.messageType.STATUS]: statusMessage };
            const eventEmitter = new EventEmitter();

            eventEmitter.on('message:status', messageReceived => {
                expect(messageReceived).toBe(statusMessage);
                done();
            });

            processStatusMessage(message, eventEmitter);
        });
    });

    describe('#errorHandler', () => {
        it('closes the udp server', () => {
            const udpServer = jasmine.createSpyObj('udpServer', ['close']);

            errorHandler(udpServer)(new Error('test'));

            expect(udpServer.close).toHaveBeenCalled();
        });
    });

    describe('#messageHandler', () => {
        const remoteInfo: dgram.RemoteInfo = <dgram.RemoteInfo> {
            address: '0.0.0.0',
            port: 1
        };

        it('recovers from invalid message', done => {
            const serialisedMessage = encode({ invalid: 'invalid' });
            const eventEmitter = new EventEmitter();

            eventEmitter.on('message:invalid', err => {
                expect(err).toEqual(new Error('Received unsupported message: 81a7696e76616c6964a7696e76616c6964 from 0.0.0.0:1'));
                done();
            });

            messageHandler(eventEmitter)(serialisedMessage, remoteInfo);
        });

        it('processes serialised rumor message', done => {
            const serialisedMessage = encode({ [protocol.messageType.RUMOR]: rumorMessage });
            const eventEmitter = new EventEmitter();

            eventEmitter.on('message:rumor', messageReceived => {
                expect(messageReceived).toEqual(rumorMessage);
                done();
            });

            messageHandler(eventEmitter)(serialisedMessage, remoteInfo);
        });

        it('processes serialised status message', done => {
            const serialisedMessage = encode({ [protocol.messageType.STATUS]: statusMessage });
            const eventEmitter = new EventEmitter();

            eventEmitter.on('message:status', messageReceived => {
                expect(messageReceived).toEqual(statusMessage);
                done();
            });

            messageHandler(eventEmitter)(serialisedMessage, remoteInfo);
        });
    });

    describe('#start', () => {
        it('starts udpServer and binds to port', () => {
            const udpServer = jasmine.createSpyObj('udpServer', ['on', 'bind']);
            const localState: jasmine.SpyObj<LocalState> = jasmine.createSpyObj('localState', ['getSequenceNumber']);
            const eventEmitter = new EventEmitter();

            localState.port = 123;

            spyOn(dgram, 'createSocket').and.callFake((type: string) => {
                expect(type).toBe('udp4');

                return udpServer;
            });

            start(localState, eventEmitter);

            expect(udpServer.on.calls.argsFor(0)).toEqual(['error', jasmine.any(Function)]);
            expect(udpServer.on.calls.argsFor(1)).toEqual(['message', jasmine.any(Function)]);
            expect(udpServer.on.calls.argsFor(2)).toEqual(['listening', jasmine.any(Function)]);
            expect(udpServer.bind).toHaveBeenCalledWith(localState.port);

        });
    });
});
