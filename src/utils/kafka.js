import {Kafka, SeekEntry, AssignerProtocol} from "kafkajs";

const {ipcMain} = require('electron')
const brokers = new Map();
import {v4 as uuidv4} from 'uuid'
import {DateUtils} from "./DateUtils";

class Group {
    constructor(consumer, groupId) {
        this.consumer = consumer;
        this.groupId = groupId;
    }
}

class Broker {
    constructor(option, kafka, admin, producer) {
        this.option = option;
        this.kafka = kafka;
        this.admin = admin;
        this.producer = producer;
        this.consumers = new Map();
    }
}

class PartitionSizeRecord {
    constructor(topic, partition, start, end) {
        this.topic = topic;
        this.partition = partition;
        this.start = start;
        this.end = end;
        this.success = false;
    }

    isSuccess() {
        return this.success;
    }

    running(offset) {
        if (Number(offset) === this.end) {
            this.success = true;
            return true;
        }
        if (Number(offset) < this.end) {
            return true;
        }
        this.success = true;
        return false;
    }
}

/**
 * 判断是否全部结束
 * @param records
 * @returns {boolean}
 */
const isSuccess = (records) => {
    let success = true;
    for (let record of records) {
        if (!record.isSuccess()) {
            success = false;
            break;
        }
    }
    return success;
}

/**
 * 断开连接
 * @param id
 * @returns {Promise<void>}
 */
const disconnect = async (id) => {
    if (!brokers.has(id)) {
        throw new Error("未连接");
    }
    let broker = brokers.get(id);
    await broker.admin.disconnect();
    let consumers = broker.consumers;
    for (const value of consumers.values()) {
        let consumer = value.consumer;
        let groupId = value.groupId;
        await consumer.disconnect();
        await deleteConsumer(id, groupId);
    }
    brokers.delete(id);
}
/**
 * 获取所有节点
 * @param id
 * @returns {Promise<{label: string, type: string, value: string, uuid: string}>}
 */
const getBrokers = async (id) => {
    let broker = brokers.get(id);
    let admin = broker.admin;
    const cluster = await admin.describeCluster();
    let nodes = {value: '', label: "Brokers", type: 'brokers', uuid: 'brokers-' + id, id: id};
    nodes.children = cluster.brokers.map(broker => {
        return {
            id: id,
            uuid: 'broker-' + id + '-' + broker.nodeId,
            value: broker.nodeId,
            nodeId: broker.nodeId,
            label: broker.host + ':' + broker.port,
            host: broker.host,
            port: broker.port,
            type: 'broker',
            instance: broker
        };
    })
    return nodes;
}
/**
 * 查询所有的消费者
 * @param id
 * @returns {Promise<{label: string, type: string, value: string, uuid: string}>}
 */
const getGroups = async (id) => {
    let broker = brokers.get(id);
    let admin = broker.admin;
    let group = await admin.listGroups();
    let groups = group.groups.filter(d => d.protocolType === "consumer").sort((o1, o2) => {
        if (o1.groupId < o2.groupId) {
            return -1;
        }
        if (o1.groupId > o2.groupId) {
            return 1;
        }
        return 0;
    })
    let consumers = {value: 'Consumers', label: "Consumers", type: 'consumers', uuid: 'consumers-' + id, id: id};
    consumers.children = groups.map(consumer => {
        return {
            id: id,
            uuid: 'consumer-' + id + '-' + consumer.groupId,
            value: consumer.groupId,
            label: consumer.groupId,
            type: 'consumer',
            instance: consumer
        };
    })
    return consumers;
}

/**
 * 根据leader,获取Broker
 * @param leader
 * @param nodes
 * @returns {string}
 */
const getPartitionLeader = (leader, nodes) => {
    let node = nodes.find(broker => broker.nodeId === leader);
    if (node) {
        return node.host + ":" + node.port;
    }
    return "";
}

/**
 * 获取所有的topic
 * @param id
 * @param topic
 * @param nodes
 * @returns {Promise<{label: string, type: string, value: string, uuid: string}>}
 */
const getTopics = async (id) => {
    let broker = brokers.get(id);
    let admin = broker.admin;
    let node = await getBrokers(id);
    const metadata = await admin.fetchTopicMetadata({topics: []})
    const list = metadata.topics.sort((o1, o2) => {
        if (o1.name < o2.name) {
            return -1;
        }
        if (o1.name > o2.name) {
            return 1;
        }
        return 0;
    });
    let topics = {value: 'Topics', label: "Topics", type: 'topics', uuid: 'topics_' + id.replace('-', ''), id: id};
    topics.children = list.map(topic => {
        return {
            id: id,
            uuid: 'topic_' + id.replace('-', '') + '_' + topic.name,
            value: topic.name,
            label: topic.name,
            type: 'topic',
            partitions: topic.partitions.map(t => {
                return {partitionId: t.partitionId, leader: getPartitionLeader(t.leader, node.children)}
            }).sort((o1, o2) => o1.partitionId - o2.partitionId),
            instance: topic
        };
    })
    return topics;
}
/**
 * 连接kafka-admin,并获取brokers,topics,consumers
 * @param id
 * @param option
 * @returns {Promise<{label, type: string, value, uuid}>}
 */
const connect = async (config, option) => {
    console.log("连接kafka:", config, option);
    let id = config._id;
    if (brokers.has(id)) {
        throw new Error("已连接,不能重复连接");
    }
    let kafka = new Kafka(option);
    let admin = kafka.admin();
    await admin.connect()
    let producer = kafka.producer();
    await producer.connect();
    let broker = new Broker(option, kafka, admin, producer);
    brokers.set(id, broker);
    try {
        const brokers = await getBrokers(id);
        const topics = await getTopics(id);
        const consumers = await getGroups(id);
        const tree = {value: id, label: config.name, type: 'root', uuid: id, id: id};
        tree.children = [brokers, topics, consumers];
        return tree;
    } catch (e) {
        brokers.delete(id);
        throw e;
    }
}
/**
 * 加载最近偏移量
 * @param id
 * @param topic
 * @returns {Promise<Array<SeekEntry & {high: string, low: string}>>}
 */
const topicOffsets = async (id, topic) => {
    console.log("加载最近偏移量:", id, topic);
    let broker = brokers.get(id);
    let admin = broker.admin;
    let offsets = await admin.fetchTopicOffsets(topic);
    let target = offsets.sort((o1, o2) => {
        if (o1.partition < o2.partition) {
            return 1;
        }
        if (o1.partition > o2.partition) {
            return -1;
        }
        return 0;
    });
    return target;
}
/**
 * 删除topic
 * @param id
 * @param option
 * @returns {Promise<boolean>}
 */
const deleteTopic = async (id, option) => {
    console.log("删除topic:", id, option)
    let broker = brokers.get(id);
    let admin = broker.admin;
    await admin.deleteTopics(option);
    let topic = option.topics[0];
    let exist = await existsTopic(id, topic);
    return !exist;
}

/**
 * 判断是否存在
 * @param id
 * @param topic
 * @returns {Promise<boolean>}
 */
const existsTopic = async (id, topic) => {
    console.log("检查topic是否存在:", id, topic);
    let broker = brokers.get(id);
    let admin = broker.admin;
    let topics = await admin.listTopics();
    let index = topics.findIndex(data => data === topic);
    return (index > -1);
}
/**
 * consumer 消费情况
 * @param id
 * @param groupId
 * @returns {Promise<*[]>}
 */
const consumerOffset = async (id, groupId) => {
    console.log("获取consumer 偏移量", id, groupId);
    let broker = brokers.get(id);
    let admin = broker.admin;
    let topics = await admin.listTopics();
    let offsets = await admin.fetchOffsets({groupId, topics});
    const result = [];
    for (const offset of offsets) {
        for (const partition of offset.partitions) {
            if (partition.offset > -1) {
                let topicOffset = await topicOffsets(id, offset.topic);
                topicOffset.forEach(topicOffset => {
                    if (topicOffset.partition === partition.partition) {
                        result.push({
                            topic: offset.topic,
                            partition: partition.partition,
                            offset: partition.offset,
                            low: topicOffset.low,
                            high: topicOffset.high
                        });
                    }
                })

            }
        }
    }
    return result.sort((o1, o2) => {
        let left = o1.topic + o1.partition;
        let right = o2.topic + o2.partition;
        if (left > right) {
            return 1;
        }
        if (left < right) {
            return -1;
        }
        return 0;
    });
}

/**
 * 删除 consumer
 * @param id
 * @param groupId
 * @returns {Promise<void>}
 */
const deleteConsumer = async (id, groupId) => {
    console.log("删除consumer", id, groupId);
    let broker = brokers.get(id);
    let admin = broker.admin;
    await admin.deleteGroups([groupId]);
}

/**
 * 创建topic
 * @param id
 * @param option
 * @returns {Promise<void>}
 */
const createTopic = async (id, option) => {
    console.log("新增topic", id, option);
    let broker = brokers.get(id);
    let admin = broker.admin;
    return await admin.createTopics(option);
}
/**
 * 创建topic
 * @param id
 * @param option
 * @returns {Promise<boolean>}
 */
const createPartition = async (id, option) => {
    console.log("创建partition", id, option);
    let broker = brokers.get(id);
    let admin = broker.admin;
    await admin.createPartitions(option)
}
/**
 * [
 *      { partition: 0, offset: '31004', high: '31004', low: '421' },
 *      { partition: 1, offset: '54312', high: '54312', low: '3102' },
 * ]
 * 查看topic
 * @param id
 * @param topic
 * @returns {Promise<Array<SeekEntry & {high: string, low: string}>>}
 */
const fetchTopicOffsets = async (id, topic) => {
    let broker = brokers.get(id);
    let admin = broker.admin;
    return await admin.fetchTopicOffsets(topic);
}
/**
 * 按照时间获取topic的偏移量
 * @param id
 * @param topic
 * @param timestamp
 * @returns {Promise<Array<SeekEntry & {high: string, low: string,partition:number,offset,string}>>}
 */
const fetchTopicOffsetsByTimestamp = async (id, topic, timestamp) => {
    let broker = brokers.get(id);
    let admin = broker.admin;
    return await admin.fetchTopicOffsetsByTimestamp(topic, timestamp);
}
/**
 * 停止接收消息
 */
const stopAutoMessage = async (id, topic) => {
    let broker = brokers.get(id);
    let consumers = broker.consumers;
    let consumer = consumers.get(topic);
    return new Promise((resolve, reject) => {
        consumer.consumer.stop().then(async res => {
            consumers.delete(topic);
            await deleteConsumer(id, consumer.groupId);
            resolve(res);
        }).catch(err => {
            reject(err);
        })
    })
}
/**
 * 获取组ID
 * @returns {string}
 */
const getGroupId = () => {
    return "kafka-visark" + uuidv4();
}
/**
 * 按照偏移量查询
 * @param id
 * @param topic
 * @param startOffset
 * @param endOffset
 * @returns {Promise<unknown>}
 */
const getRecordByOffset = async (id, topic, startOffset, endOffset) => {
    console.log(id, topic, startOffset, endOffset)
    let partitions = await fetchTopicOffsets(id, topic);
    console.log("partitions:", partitions)
    let records = [];
    for (const partition of partitions) {
        let start = Number(partition.low);
        let high = Number(partition.high);
        let end = high - 1;
        if (start !== high) {
            if (startOffset > start) {
                start = startOffset;
            }
            if (endOffset < end) {
                end = endOffset;
            }
            records.push(new PartitionSizeRecord(topic, partition.partition, start, end))
        }
    }
    console.log("records:", records);
    if (records.length === 0) {
        return new Promise((resolve) => {
            resolve([]);
        })
    }
    return await getRecord(id, topic, records);
}
/**
 * 根据结束时间+数量查询
 * @param id
 * @param topic
 * @param time
 * @param size
 * @returns {Promise<void>}
 */
const getRecordByEndAndSize = async (id, topic, time, size) => {
    console.log("根据关闭时间与大小查询", DateUtils.now(), id, topic, time, size)
    let endPartitions = await fetchTopicOffsetsByTimestamp(id, topic, time);
    let partitions = await fetchTopicOffsets(id, topic)
    let records = [];
    for (let endPartition of endPartitions) {
        let high = Number(endPartition.offset);
        for (let partition of partitions) {
            if (endPartition.partition === partition.partition) {
                if (high === Number(partition.high)) {
                    high--;
                }
                let start = Number(partition.low);
                let expectedSize = high - size + 1;
                if (expectedSize > start) {
                    start = expectedSize;
                }
                records.push(new PartitionSizeRecord(topic, endPartition.partition, start, high));
            }
        }
    }
    if (records.length === 0) {
        return new Promise((resolve) => {
            resolve([]);
        })
    }
    return await getRecord(id, topic, records);
}
/**
 * 根据开始时间和数量获取数据
 * @param id
 * @param topic
 * @param time
 * @param size
 * @returns {Promise<void>}
 */
const getRecordByStartAndSize = async (id, topic, time, size) => {
    let startPartitions = await fetchTopicOffsetsByTimestamp(id, topic, time);
    let partitions = await fetchTopicOffsets(id, topic)
    let records = [];
    for (let start of startPartitions) {
        let low = Number(start.offset);
        for (let partition of partitions) {
            if (start.partition === partition.partition) {
                if (low >= Number(partition.high)) {
                    break;
                }
                let high = Number(partition.high);
                let end = high - 1;
                let expectedSize = low + size - 1;
                if (expectedSize < high) {
                    end = expectedSize;
                }
                records.push(new PartitionSizeRecord(topic, start.partition, low, end));
            }
        }
    }
    if (records.length === 0) {
        return new Promise((resolve) => {
            resolve([]);
        })
    }
    return await getRecord(id, topic, records);
}
/**
 * 根据时间区间查询
 * @param id
 * @param topic
 * @param startTime
 * @returns {Promise<void>}
 */
const getRecordByTime = async (id, topic, startTime, endTime) => {
    console.log("byTime:", id, topic, startTime, endTime);
    let startPartitions = await fetchTopicOffsetsByTimestamp(id, topic, startTime);
    let endPartitions = await fetchTopicOffsetsByTimestamp(id, topic, endTime);
    let partitions = await fetchTopicOffsets(id, topic);
    let records = [];
    for (let start of startPartitions) {
        for (let end of endPartitions) {
            if (start.partition === end.partition) {
                for (let p of partitions) {
                    if (p.partition === start.partition) {
                        let low = Number(start.offset);
                        let high = Number(end.offset);
                        if (low >= Number(p.high)) {
                            break;
                        }
                        if (high >= Number(p.high)) {
                            high--;
                        }
                        let record = new PartitionSizeRecord(topic, start.partition, low, high)
                        records.push(record);
                        break;
                    }
                }
                break;
            }
        }
    }
    console.log("records:", records)
    if (records.length === 0) {
        return new Promise((resolve) => {
            resolve([]);
        })
    }
    return await getRecord(id, topic, records);
}
/**
 * 根据大小获取 记录
 * @param id
 * @param topic
 * @param size
 * @param fromBeginning
 * @returns {Promise<void>}
 */
const getRecordBySize = async (id, topic, size, fromBeginning) => {
    let partitions = await fetchTopicOffsets(id, topic)
    let records = [];
    for (const partition of partitions) {
        let start = Number(partition.low);
        let high = Number(partition.high);
        let end = high - 1;
        if (start !== high) {
            if (fromBeginning) {
                let expectedSize = start + size - 1;
                if (expectedSize < high) {
                    end = expectedSize;
                }
            } else {
                let expectedSize = high - size;
                if (expectedSize > start) {
                    start = expectedSize;
                }
            }
            records.push(new PartitionSizeRecord(topic, partition.partition, start, end))
        }
    }
    if (records.length === 0) {
        return new Promise((resolve) => {
            resolve([]);
        })
    }
    return await getRecord(id, topic, records);
}
/**
 * 根据ID topic partitions 获取数据
 * @param id
 * @param topic
 * @param records
 * @param callback
 * @returns {Promise<void>}
 */
const getRecord = async (id, topic, records) => {
    let broker = brokers.get(id);
    let groupId = getGroupId();
    let kafka = broker.kafka;
    let admin = broker.admin;
    let consumer = kafka.consumer({groupId});
    await consumer.connect();
    await consumer.subscribe({topic: topic})
    const run = async (callback) => {
        await consumer.run({
            autoCommit: true,
            autoCommitInterval: 5000,
            autoCommitThreshold: 100,
            eachMessage: async ({topic, partition, message}) => {
                //await consumer.commitOffsets([{
                //    topic: topic, partition: partition, offset: Number(message.offset) + 1
                //}])
                let record = records.find(p => p.partition === partition);
                if (record && record.running(message.offset)) {
                    let result = buildMessage(id, topic, partition, message);
                    if (isSuccess(records)) {
                        callback && callback(true, result);
                        consumer.stop().then(async res => {
                            await admin.deleteGroups([groupId]);
                        })
                    } else {
                        callback && callback(false, result);
                    }
                }

            }
        })
        records.forEach(record => {
            consumer.seek({topic: topic, partition: record.partition, offset: String(record.start)})
        })
    }
    return new Promise((resolve, reject) => {
        let result = [];
        run((status, message) => {
            result.push(message);
            if (status) {
                resolve(result);
            }
        }).catch(err => {
            reject(err);
        })
    })
}
/**
 * 构建消息
 * @param id
 * @param topic
 * @param partition
 * @param message
 * @returns {{headers, partition, offset, topic, id, value: (string|string), key: (string|string), timestamp}}
 */
const buildMessage = (id, topic, partition, message) => {
    return {
        id,
        topic,
        partition,
        key: message.key ? message.key.toString() : "",
        value: message.value ? message.value.toString() : "",
        offset: message.offset,
        headers: message.headers,
        timestamp: message.timestamp,
        time: DateUtils.format(message.timestamp)
    };
}
/**
 * 发送消息
 * @param id
 * @param message
 * @returns {Promise<unknown>}
 */
const sendMessage = (id, message) => {
    let broker = brokers.get(id);
    let producer = broker.producer;
    return new Promise((resolve, reject) => {
        producer.send(message).then(res => {
            resolve(res)
        }).catch(err => {
            reject(err);
        })
    })
}
/**
 * 重新设置offset
 * @param id
 * @param option
 * @returns {Promise<*>}
 */
const setOffsets = async (id, option) => {
    console.log("设置 offset", id, option);
    let broker = brokers.get(id);
    let admin = broker.admin;
    return await admin.setOffsets(option);
}
/**
 * 分配情况
 * @param id
 * @param groupId
 * @returns {Promise<unknown>}
 */
const members = async (id, groupId) => {
    let broker = brokers.get(id);
    let admin = broker.admin;
    return new Promise((resolve, reject) => {
        admin.describeGroups([groupId]).then(res => {
            let result = {};
            res.groups.forEach(group => {
                result.errorCode = group.errorCode;
                result.groupId = group.groupId;
                result.state = group.state;
                result.protocolType = group.protocolType;
                result.protocol = group.protocol;
                let members = [];
                let list = group.members;
                list.forEach(member => {
                    let json = {
                        memberId: member.memberId, clientId: member.clientId, clientHost: member.clientHost,
                    }
                    let meta = AssignerProtocol.MemberMetadata.decode(member.memberMetadata);
                    let metadata = {
                        version: meta.version, topics: meta.topics,
                    }
                    let assignmentValue = AssignerProtocol.MemberAssignment.decode(member.memberAssignment);
                    let assignment = {
                        version: assignmentValue.version, assignment: assignmentValue.assignment,
                    }
                    json.metadata = metadata;
                    json.assignment = assignment;
                    members.push(json);
                })
                result.members = members;
            })
            resolve(result);
        }).catch(err => {
            reject(err);
        })
    })

}
/**
 * 连接
 */
ipcMain.handle('connect', async (event, id, option) => {
    return connect(id, option);
})


/**
 * 断开连接
 */
ipcMain.handle('disconnect', async (event, id) => {
    return disconnect(id);
})


/**
 * 获取 topics
 */
ipcMain.handle('topics', async (event, id) => {
    return getTopics(id);
})

/**
 * 获取 删除topic
 */
ipcMain.handle('topic.delete', async (event, id, option) => {
    return deleteTopic(id, option);
})

/**
 * 新增topic
 */
ipcMain.handle('topic.create', async (event, id, option) => {
    return createTopic(id, option);
})


/**
 *  加载topic 最近偏移量
 */
ipcMain.handle('topic.offset', async (event, id, topic) => {
    return topicOffsets(id, topic);
})

/**
 *  查看consumer 消费情况
 */
ipcMain.handle('consumer.offset', async (event, id, groupId) => {
    return consumerOffset(id, groupId);
})

/**
 *  删除 consumer
 */
ipcMain.handle('consumer.delete', async (event, id, groupId) => {
    return deleteConsumer(id, groupId);
})

/**
 * 获取 consumer
 */
ipcMain.handle('consumers', async (event, id) => {
    return getGroups(id);
})


/**
 * 创建partition
 */
ipcMain.handle('partition.create', async (event, id, option) => {
    return createPartition(id, option)
})

/**
 * 推送消息
 */
ipcMain.handle('message.start', async (event, id, topic, fromBeginning) => {
    let groupId = getGroupId();
    console.log("开始接收消息", id, topic, groupId)
    let broker = brokers.get(id);
    let kafka = broker.kafka;
    let consumer = kafka.consumer({groupId})
    await consumer.connect()
    await consumer.subscribe({topic: topic, fromBeginning})
    broker.consumers.set(topic, new Group(consumer, groupId));
    await consumer.run({
        autoCommit: true, eachMessage: async ({topic, partition, message}) => {
            await consumer.commitOffsets([{
                topic: topic, partition: partition, offset: Number(message.offset) + 1
            }])
            event.sender.send('message', buildMessage(id, topic, partition, message));
        }
    })
})
/**
 * 停止接收
 */
ipcMain.handle('message.stop', async (event, id, topic) => {
    console.log("停止接收消息:", id, topic)
    return await stopAutoMessage(id, topic);
})

/**
 * 按数量查询
 */
ipcMain.handle('message.query.size', async (event, option) => {
    return await getRecordBySize(option.id, option.topic, option.size, option.fromBeginning);
})
/**
 * 按时间查询
 */
ipcMain.handle('message.query.time', async (event, option) => {
    return await getRecordByTime(option.id, option.topic, option.start, option.end)
})
/**
 * 按开始时间+数量查询
 */
ipcMain.handle('message.query.start.size', async (event, option) => {
    return await getRecordByStartAndSize(option.id, option.topic, option.start, option.size)
})
/**
 * 按开始时间+数量查询
 */
ipcMain.handle('message.query.end.size', async (event, option) => {
    return await getRecordByEndAndSize(option.id, option.topic, option.end, option.size)
})
/**
 * 按偏移量
 */
ipcMain.handle('message.query.offset', async (event, option) => {
    return await getRecordByOffset(option.id, option.topic, option.startOffset, option.endOffset)
})
/**
 * 发送消息
 */
ipcMain.handle('message.send', async (event, id, message) => {
    return sendMessage(id, message);
})
/**
 * 重新设置offset
 */
ipcMain.handle('offset.set', async (event, id, option) => {
    return setOffsets(id, option);
})
/**
 * 分配情况
 */
ipcMain.handle('members', (event, id, groupId) => {
    return members(id, groupId);
})
console.log("kafka utils load success")