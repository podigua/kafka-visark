<template>
  <el-dialog
      title="Topic"
      width="350px"
      :show-close="false"
      v-if="visible"
      :visible.sync="visible"
  >
    <el-form ref="form" :model="form" :rules="formRule" label-width="80px">
      <el-form-item label="名称" prop="topic">
        <el-input v-model="form.topic"></el-input>
      </el-form-item>
      <el-form-item label="分区数" prop="numPartitions">
        <el-input-number
            :min="1" controls-position="right" v-model="form.numPartitions"
            style="width: 100%"
        ></el-input-number>
      </el-form-item>
      <el-form-item label="副本数" prop="replicationFactor">
        <el-input-number
            :min="1" controls-position="right" v-model="form.replicationFactor"
            style="width: 100%"
        ></el-input-number>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="save" :loading="loading">确 认</el-button>
        </span>
  </el-dialog>
</template>

<script>
export default {
  name: "CreateTopic",
  props: {
    id: {type: String},
    visible: {type: Boolean, default: false},
  },
  data() {
    return {
      loading: false,
      dForm: {
        topic: "",
        numPartitions: 1,
        replicationFactor: 1
      },
      form: {
        topic: "",
        numPartitions: 1,
        replicationFactor: 1
      },
      formRule: {
        topic: [
          {required: true, message: "名称为必填项", trigger: ["blur", "change"]},
        ],
        numPartitions: [
          {required: true, type: 'number', message: "分区数为必填项", trigger: ["blur", "change"]},
        ],
        replicationFactor: [
          {required: true, type: 'number', message: "副本数为必填项", trigger: ["blur", "change"]},
        ],
      }
    }
  }, methods: {
    save() {
      this.$refs.form.validate(async v => {
        if (v) {
          let {topic} = await window.api.settings.get()
          this.loading = true;
          topic.topics = [this.form];
          window.api.createTopic(this.id, topic).then(res => {
            if (res) {
              this.$message.success("创建成功");
              this.$emit('success');
            } else {
              this.$message.error("创建失败");
            }
            this.loading = false;
          }).catch(err => {
            this.$message.error("创建失败");
            this.loading = false;
          })
        }
      })
    },
    cancel() {
      this.$emit("cancel")
    }
  }, created() {
    Object.assign(this.form, this.dForm);
  }
}
</script>

<style scoped>

</style>