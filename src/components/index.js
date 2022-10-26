import Broker from "./tree/components/Broker";
import Topic from "./tree/components/Topic";
import Consumer from "./tree/components/Consumer";
import Member from "./tree/components/Member";
import Vue from 'vue';

export default {
    showBroker(brokers) {
        let id = "broker-dialog";
        let brokerDialog = document.getElementById(id);
        if (!brokerDialog) {
            let div = document.createElement('div');
            div.setAttribute("id", id);
            document.body.appendChild(div);
        }
        new Vue({
            render: (h) => {
                return h(Broker, {
                    props: {
                        brokers: brokers
                    }
                });
            }
        }).$mount("#" + id)
    }, showTopic(topic, offsets) {
        let id = "topic-dialog";
        let brokerDialog = document.getElementById(id);
        if (!brokerDialog) {
            let div = document.createElement('div');
            div.setAttribute("id", id);
            document.body.appendChild(div);
        }
        new Vue({
            render: (h) => {
                return h(Topic, {
                    props: {
                        topic: topic, offsets: offsets
                    }
                });
            }
        }).$mount("#" + id)
    }, showConsumer(id, title, offsets) {
        let divId = "consumer-dialog";
        let dialog = document.getElementById(divId);
        if (!dialog) {
            let div = document.createElement('div');
            div.setAttribute("id", divId);
            document.body.appendChild(div);
        }
        new Vue({
            render: (h) => {
                return h(Consumer, {
                    props: {
                        id: id, title: title, offsets: offsets
                    }
                });
            }
        }).$mount("#" + divId)
    }, showMember(member) {
        let divId = "member-dialog";
        let dialog = document.getElementById(divId);
        if (!dialog) {
            let div = document.createElement('div');
            div.setAttribute("id", divId);
            document.body.appendChild(div);
        }
        new Vue({
            render: (h) => {
                return h(Member, {
                    props: {
                        member: member
                    }
                });
            }
        }).$mount("#" + divId)
    }
}