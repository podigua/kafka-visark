<template>
  <el-dialog
      :title="brokers.length>1?'Brokers':'Broker'"
      width="550px"
      v-if="visible"
      :destroy-on-close="true"
      :visible.sync="visible"
  >
    <el-table :data="brokers" stripe border>
      <el-table-column prop="nodeId" align="center" label="nodeId"></el-table-column>
      <el-table-column prop="host" align="center" label="host"></el-table-column>
      <el-table-column prop="port" align="center" label="port"></el-table-column>
    </el-table>
    <span slot="footer" class="dialog-footer">
          <el-button type="primary" @click="visible=false">关 闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: "Broker",
  props: {
    brokers: {type: Array},
  },
  data() {
    return {
      visible: true
    }
  }
}
</script>

<style scoped>

</style>