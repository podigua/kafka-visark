<template>
  <div>
    <el-form ref="formRef" :model="form" :rules="formRule" label-width="80px">
      <el-form-item label="partition" prop="partition">
        <el-select v-model="form.partition" clearable filterable>
          <el-option v-for="v in partitions" :value="v" :label="v" :key="v"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="key" prop="key">
        <el-input v-model="form.key" clearable>
          <el-checkbox slot="prepend" v-model="form.random">随机</el-checkbox>
        </el-input>
      </el-form-item>
      <el-form-item label="value" prop="value">
        <el-input type="textarea" v-model="form.value" :rows="6"></el-input>
      </el-form-item>
    </el-form>
    <div style="text-align: right">
      <el-button type="primary" :loading="loading" @click="send">发送</el-button>
    </div>
  </div>
</template>

<script>
import {v4 as uuidv4} from 'uuid'

export default {
  name: "TopicProducer",
  props: {
    id: {type: String},
    topic: {type: String},
    partitions: {type: Array}
  },
  data() {
    return {
      loading: false,
      form: {
        random: false,
        partition: null,
        key: "",
        value: ""
      },
      formRule: {
        value: [
          {required: true, message: "value为必填项", trigger: ["blur", "change"]}
        ]
      },
    }
  }, methods: {
    send() {
      this.$refs.formRef.validate(v => {
        if (v) {
          this.loading = true;
          if (this.form.random) {
            this.form.key = uuidv4();
          }
          let messages = {
            topic: this.topic,
            messages: [{
              key: this.form.key,
              value: this.form.value,
              partition: this.form.partition?this.form.partition:null
            }]
          };
          window.api.sendMessage(this.id, messages).then(res => {
            this.loading = false;
            this.$message.success("发送成功");
          }).catch(err => {
            this.loading = false;
            this.$message.error("发送失败");
          })
        }
      })
    }
  }
}
</script>

<style scoped>

</style>