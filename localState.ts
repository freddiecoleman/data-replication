interface LocalConfig {
    name: string;
    port: number;
    httpServerPort: number;
    logInterval: number;
    ackTimeout: number;
    antiEntropyInterval: number;
}

export default class LocalState {
    name: string;
    port: number;
    httpServerPort: number;
    logInterval: number;
    ackTimeout: number;
    antiEntropyInterval: number;
    private sequence: number;

    constructor(localConfig: LocalConfig) {
        this.name = localConfig.name;
        this.port = localConfig.port;
        this.httpServerPort = localConfig.httpServerPort;
        this.logInterval = localConfig.logInterval;
        this.ackTimeout = localConfig.ackTimeout;
        this.antiEntropyInterval = localConfig.antiEntropyInterval;
        this.sequence = 0;
    }

    increaseSequenceNumber() {
        this.sequence++;
    }

    getSequenceNumber(): number {
        return this.sequence;
    }

    getWant(): number {
        return this.sequence + 1;
    }
}
