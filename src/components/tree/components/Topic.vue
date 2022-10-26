<template>
  <el-dialog
      :title="topic.label"
      width="550px"
      v-if="visible"
      :destroy-on-close="true"
      :visible.sync="visible"
  >
    <el-table :data="list" stripe border>
      <el-table-column prop="id" align="center" label="id"></el-table-column>
      <el-table-column prop="leader" width="150px" align="center" label="leader"></el-table-column>
      <el-table-column prop="low" align="center" label="low"></el-table-column>
      <el-table-column prop="high" align="center" label="high"></el-table-column>
      <el-table-column prop="offset" align="center" label="offset"></el-table-column>
    </el-table>

    <span slot="footer" class="dialog-footer">
          <el-button type="primary" @click="visible=false">关 闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: "Topic",
  props: {topic: {type: Object}, offsets: {type: Array}},
  data() {
    return {
      visible: true,
      list: []
    }
  }, created() {
    let partitions = this.topic.partitions;
    partitions.forEach(partition => {
      let offset = this.offsets.find(offset => offset.partition === partition.partitionId);
      this.list.push({
        id: partition.partitionId,
        leader: partition.leader,
        low: offset.low,
        high: offset.high,
        offset: offset.offset
      });
    })
  }
}
</script>

<style scoped>

</style>