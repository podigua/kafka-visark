export const QueryType = {
    SIZE: 1, TIMESTAMP: 2, START_SIZE: 3, END_SIZE: 4
}

export class Query {
    constructor(option) {
        this.id = option.id;
        this.type = option.type;
        this.topic = option.topic;
        this.size = option.size;
        this.fromBeginning = option.fromBeginning;
        this.start = option.start;
        this.end = option.end;
    }
}