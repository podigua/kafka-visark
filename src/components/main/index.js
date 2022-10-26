import MessageDetail from "./conmponents/MessageDetail";
import Vue from 'vue';
export default {
    openMessage(detail){
        let id = "message-dialog";
        let brokerDialog = document.getElementById(id);
        if (!brokerDialog) {
            let div = document.createElement('div');
            div.setAttribute("id", id);
            document.body.appendChild(div);
        }
        new Vue({
            render: (h) => {
                return h(MessageDetail, {
                    props: {
                        detail: detail
                    }
                });
            }
        }).$mount("#" + id)
    }
}