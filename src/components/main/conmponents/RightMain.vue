<template>
  <div :style="{ height: mainHeight}">
    <el-tabs>
      <el-tab-pane label="消费">
        <TopicConsumer ref="consumer" :id="id" :topic="topic" :partitions="partitions"></TopicConsumer>
      </el-tab-pane>
      <el-tab-pane label="生产">
        <TopicProducer :id="id" :topic="topic" :partitions="partitions"></TopicProducer>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>

import TopicConsumer from "./TopicConsumer";
import TopicProducer from "./TopicProducer";

export default {
  name: "RightMain",
  components: {TopicProducer, TopicConsumer},
  props: {
    id: {type: String},
    topic: {type: String},
    partitions: {type: Array}
  },
  methods:{
    shutdown(){
      return  this.$refs.consumer.shutdown()
    }
  },
  computed: {
    mainHeight() {
      return `calc(100vh - 145px)`;
    },
  }
}
</script>

<style scoped>
.el-dialog__body {
  padding: 20px 5px;
}
span {
  vertical-align: middle;
}
</style>