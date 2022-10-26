<template>
  <el-dialog
      :title="form.topic"
      width="350px"
      :show-close="false"
      v-if="visible"
      :visible.sync="visible"
  >
    <el-form ref="form" :model="form" :rules="formRule" label-width="120px">
      <el-form-item label="当前数量">
        {{ count }}
      </el-form-item>
      <el-form-item label="增加至" prop="count">
        <el-input-number
            :min="min" controls-position="right" v-model="form.count"
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
  name: "CreatePartition",
  props: {
    id: {type: String},
    visible: {type: Boolean, default: false},
    topic: {type: Object},
  },
  data() {
    return {
      loading: false,
      title: "",
      count: 0,
      min: 0,
      form: {
        topic: '',
        count: 0
      },
      formRule: {
        count: [
          {required: true, type: 'number', message: "数量为必填项", trigger: ["blur", "change"]},
        ],
      }
    }
  }, methods: {
    cancel() {
      this.$emit('cancel');
    },
    save() {
      this.$refs.form.validate(async v => {
        let {topic} = await window.api.settings.get();
        topic.topicPartitions = [this.form]
        this.loading = true;
        window.api.createPartition(this.id, topic).then(res => {
          this.loading = false
          this.$emit('success');
          this.$message.success("创建成功");
        }).catch(err => {
          this.loading = false
          alert(err);
        })
      })
    }
  }, created() {
    this.form.topic = this.topic.value;
    this.min = this.topic.partitions.length + 1;
    this.form.count = this.min;
    this.count = this.topic.partitions.length;
  }
}
</script>

<style scoped>

</style>