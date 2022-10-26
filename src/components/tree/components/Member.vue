<template>
  <el-dialog
      title="分配情况"
      width="800px"
      v-if="visible"
      :destroy-on-close="true"
      :visible.sync="visible"
  >
    <el-descriptions title="基本信息" size="medium" :column="3" border>
      <el-descriptions-item label="groupId：" :span="2">{{ form.groupId }}</el-descriptions-item>
      <el-descriptions-item label="state：">{{ form.state }}</el-descriptions-item>
      <el-descriptions-item label="protocol：">{{ form.protocol }}</el-descriptions-item>
      <el-descriptions-item label="protocolType：">{{ form.protocolType }}</el-descriptions-item>
      <el-descriptions-item label="errorCode：">{{ form.errorCode }}</el-descriptions-item>
    </el-descriptions>
    <div style="font-size: 16px;font-weight: 700;margin-top: 5px;margin-bottom: 5px">成员信息</div>
    <el-table :data="form.list" border stripe>
      <el-table-column label="topic" prop="topic" align="center" show-overflow-tooltip width="120"></el-table-column>
      <el-table-column label="partition" prop="partition" align="center" show-overflow-tooltip width="80"></el-table-column>
      <el-table-column label="clientId" prop="clientId" align="center" show-overflow-tooltip  width="120"></el-table-column>
      <el-table-column label="memberId" prop="memberId"  show-overflow-tooltip></el-table-column>
      <el-table-column label="clientHost" prop="clientHost" align="center" show-overflow-tooltip  width="150"></el-table-column>
    </el-table>
    <span slot="footer" class="dialog-footer">
          <el-button type="primary" @click="visible=false">关 闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: "Member",
  props: {
    member: {type: Object}
  },
  data() {
    return {
      visible: true,
      form: {
        errorCode: 0,
        groupId: "",
        list: [],
        protocol: "",
        protocolType: "",
        state: ""
      }
    }
  }, methods: {
    getMetadata(metadata) {
      let list = [];
      metadata.topics.forEach(topic => {
        list.push({version: metadata.version, topic: topic});
      })
      return list;
    }
  }, created() {
    console.log(this.member);
    this.form = this.member;
    let list = [];
    if (this.member.members && this.member.members.length > 0) {
      this.member.members.forEach(member => {
        if (member.assignment &&member.assignment.assignment) {
          for (let topic in member.assignment.assignment) {
            let partitions=member.assignment.assignment[topic];
            partitions.forEach(partition => {
              list.push({
                memberId: member.memberId,
                clientId: member.clientId,
                clientHost: member.clientHost,
                version: member.assignment.version,
                topic: topic,
                partition: partition
              })
            })
          }
        }
      })
    }
    this.form.list = list;
  }
}
</script>

<style scoped>

</style>