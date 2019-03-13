import * as EventEmitter from 'events';
import * as minimist from 'minimist';
import * as pino from 'pino';
import * as udpServer from './udpServer';
import * as  httpServer from './httpServer';
import LocalState from './localState';
import Message from './serialisers/message';
import messageDispatcher from './messageDispatcher';
import protocol from './protocol';
import { getRandomPeer, parseConfigFile, Peer } from './utils';

interface AwaitingAcks {
    [peerName: string]: boolean;
}

const log = pino();
const inputArguments = minimist(process.argv.slice(2));

if (!inputArguments.peerNumber) {
    log.error(`--peerNumber argument required. It is a number to identify the config to read.`);

    process.exit(1);
}

const { peerNumber } = inputArguments;
const configFilePath = `./config/peer${peerNumber}.toml`;
const { local, peers } = parseConfigFile(configFilePath);

const localState = new LocalState(local);

// Map of remote peers that we are awaiting acknowledgement from
const awaitingAcks: AwaitingAcks = Object.keys(peers).reduce((accum, peerName) => ({
    ...accum,
    [peerName]: false
}), {});

const setAwaitingAck = (peerName: string) => awaitingAcks[peerName] = true;
const setAcked = (peerName: string) => awaitingAcks[peerName] = false;
const isUnacked = (peerName: string) => awaitingAcks[peerName];

// Data to be replicated
const localData: Array<Message> = [];

// We log the local copy of data on a timer for debugging purposes
const logData = () => log.info(`Content of data array ${JSON.stringify(localData)}`);

const generateStatusMessage = () => ({
    [protocol.statusMessage.ORIGIN]: localState.name,
    [protocol.statusMessage.WANT]: localState.getWant()
});

/**
 * As an anti-entropy measure we send a status message to a random peer on an interval to ensure that
 * every node eventually gets all messages.
 */
const antiEntropy = () => {
    const statusMessage = generateStatusMessage();
    const randomPeer = getRandomPeer(peers);

    log.info(`Sending status message to ${randomPeer.name} as anti-entropy measure`);
    
    messageDispatcher.sendStatusMessage(statusMessage, randomPeer);
};

/**
 * Attempts to sends a rumor message to a random peer. If the message fails to be sent it is immediately sent to another random peer.
 * 
 * If the peer does not response with a status message as an acknowledgement within a configurable timeout we repeat this process with
 * another random peer.
 * 
 * Once a peer has acknowledged receipt of the rumor message there is a 50% chance that we repeat the process again with another random peer.
 * 
 * @param {*} rumorMessage 
 */
const replicate = async (rumorMessage: Message) => {
    log.info(`Replicating message. origin: ${rumorMessage[protocol.rumorMessage.ORIGIN]}, sequence: ${rumorMessage[protocol.rumorMessage.SEQUENCE]}, data: ${rumorMessage[protocol.rumorMessage.DATA]}`);

    const sendUntilAcked = async() => {
        const peer: Peer = getRandomPeer(peers);
        
        await messageDispatcher.sendRumorMessage(rumorMessage, peer, localState.name);

        setAwaitingAck(peer.name);

        log.info(`Message sent to peer: ${peer.name}`);

        setTimeout(() => {
            if (isUnacked(peer.name)) {
                log.info('Message unacknowledged. Sending again.');

                return sendUntilAcked();
            }

            // ACKd: 50% chance to send to another random peer or stop sending
            if (Math.random() >= 0.5) {
                log.info('Sending again.');

                return sendUntilAcked();
            }

            log.info('Stopping message propagation');
        }, localState.ackTimeout);
    };

    sendUntilAcked();
};

/**
 * On receipt of a rumor message we acknowledge receipt of the message with a status message.
 * If the rumor contains new data we store it locally and then replicate it to a random peer.
 */
const rumorMessageHandler = async (rumorMessage: Message) => {
    const statusMessage = generateStatusMessage();

    await messageDispatcher.ack(rumorMessage, statusMessage, localState.name, peers);

    if (rumorMessage[protocol.rumorMessage.SEQUENCE] > localState.getSequenceNumber()) {
        localData.push(rumorMessage);
        localState.increaseSequenceNumber();
        replicate(rumorMessage);
    }
};

/**
 * On receipt of of a status message we check if we are waiting for an acknowledgement from a remote peer
 * and if we are we change the flag to mark that we received the acknowledgement.
 * 
 * If the peer wants our sequence number + 1 that means they have the same view of data to us and we do nothing.
 * 
 * If the peer wants a sequence number that is equal to or below our sequence number that means they are behind us
 * and we send them the next message that they require.
 * 
 * If the peer wants a sequence numer that is above ours we send them a status message so they become aware that we
 * are behind and send us the next message that we require.
 */
const statusMessageHandler = async (statusMessage: Message) => {
    const { [protocol.statusMessage.ORIGIN]: peer, [protocol.statusMessage.WANT]: want } = statusMessage;

    if (isUnacked(<string> peer)) {
        log.info(`Ack received from ${peer}`);

        setAcked(<string> peer);
    }

    const expectedWant = localState.getWant();
    const peerBehind = want < expectedWant;
    const peerAhead = want > expectedWant;

    if (want === expectedWant) {
        log.info(`Peer ${peer} is up to date`);
    }

    if (peerBehind) {
        // Give the peer what they want (performance could be improved)
        const rumorMessage = localData.find(message => message[protocol.rumorMessage.SEQUENCE] === want);

        if (!rumorMessage) {
            return;
        }

        const sent = await messageDispatcher.sendRumorMessage(rumorMessage, peers[peer], localState.name);

        if (sent) {
            setAwaitingAck(<string> peer);
        }
    }

    if (peerAhead) {
        const statusMessage = generateStatusMessage();

        await messageDispatcher.sendStatusMessage(statusMessage, peers[peer])
    }
};

const eventEmitter = new EventEmitter();

eventEmitter.on('message:rumor', rumorMessageHandler);
eventEmitter.on('message:status', statusMessageHandler);
eventEmitter.on('message:invalid', err => log.error(err));

udpServer.start(local, eventEmitter);
httpServer.start(local, eventEmitter);

setInterval(antiEntropy, localState.antiEntropyInterval);
setInterval(logData, localState.logInterval);
