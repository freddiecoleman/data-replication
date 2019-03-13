const messageType = {
    RUMOR: 0x01.toString(),
    STATUS: 0x02.toString()
};

const rumorMessage = {
    ORIGIN: 0x0a,
    FROM: 0x0b,
    SEQUENCE: 0x0c,
    DATA: 0x0d
};

const statusMessage = {
    ORIGIN: 0x10,
    WANT: 0x11
};

export default {
    messageType,
    rumorMessage,
    statusMessage
};
