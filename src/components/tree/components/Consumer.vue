<template>
  <el-dialog
      :title="title"
      v-if="visible"
      width="750px"
      :destroy-on-close="true"
      :visible.sync="visible"
  >
    <div style="margin-bottom: 5px;"><b>备注：修改偏移量时,消费者组必须没有正在运行的实例</b></div>
    <el-table :data="list" stripe border>
      <el-table-column prop="topic" align="center" label="topic"></el-table-column>
      <el-table-column prop="partition" align="center" label="partition"></el-table-column>
      <el-table-column prop="low" align="center" label="low"></el-table-column>
      <el-table-column prop="high" align="center" label="high"></el-table-column>
      <el-table-column prop="offset" align="center" label="offset">
        <template slot-scope="scope">
          <span v-if="scope.$index!==index">{{ scope.row.offset }}</span>
          <el-input-number v-else v-model="scope.row.current" controls-position="right" :max="scope.row.high" style="width: 100%"
                           :min="scope.row.low"></el-input-number>
        </template>
      </el-table-column>
      <el-table-column prop="action" align="center" label="操作" width="145">
        <template slot-scope="scope">
          <el-button type="primary" v-if="index!==scope.$index" @click="edit(scope.$index)">编辑</el-button>
          <el-button-group v-else>
            <el-button @click="index=-1" :disabled="scope.row.loading">取消</el-button>
            <el-button type="primary" :loading="scope.row.loading" @click="save(scope.row)">保存</el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
    <span slot="footer" class="dialog-footer">
          <el-button type="primary" @click="visible=false">关 闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: "Consumer",
  props: {
    id: {type: String},
    title: {type: String},
    offsets: {type: Array}
  },
  data() {
    return {
      list: [],
      index: -1,
      visible: true
    }
  }, methods: {
    edit(index) {
      this.index = index;
    },
    save(row) {
      row.loading = true;
      console.log(row);
      window.api.setOffsets(this.id, {
        topic: row.topic,
        groupId: this.title,
        partitions: [
          {
            partition: row.partition,
            offset: String(row.current)
          }
        ]
      }).then(res => {
        row.loading = false;
        this.index = -1;
        row.offset = row.current;
        this.$message.success("保存成功")
      }).catch(e => {
        row.loading = false;
        this.index = -1;
        row.current = row.offset;
        this.$message.error('保存失败')
      })
    },
  }, created() {
    this.offsets.forEach(node => {
      this.list.push({
        topic: node.topic,
        partition: node.partition,
        low: Number(node.low),
        high: Number(node.high),
        offset: Number(node.offset),
        current: Number(node.offset),
        loading: false,
      })
    })
  }
}
</script>

<style scoped>

</style>