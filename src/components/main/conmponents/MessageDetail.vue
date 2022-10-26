<template>
  <el-dialog
      title="消息"
      v-if="visible"
      width="750px"
      :destroy-on-close="true"
      :visible.sync="visible"
  >
    <el-tabs>
      <el-tab-pane label="基本信息">
        <el-descriptions size="medium" :column="2" border>
          <el-descriptions-item label="topic：">{{ detail.topic }}</el-descriptions-item>
          <el-descriptions-item label="partition：">{{ detail.partition }}</el-descriptions-item>
          <el-descriptions-item label="timestamp：">{{ detail.timestamp }}</el-descriptions-item>
          <el-descriptions-item label="offset：">{{ detail.offset }}</el-descriptions-item>
          <el-descriptions-item label="key：" :span="2">{{ detail.key }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
      <el-tab-pane label="消息头">
        <el-table :data="getHeader()" border stripe>
          <el-table-column label="key" prop="key"></el-table-column>
          <el-table-column label="value" prop="value"></el-table-column>
        </el-table>
      </el-tab-pane>
      <div style="text-align: right;margin:10px;">
          <span>
            <el-select v-model="currentFormat" @change="onFormatChange">
              <el-option v-for="item in format" :value="item.value" :label="item.label" :key="item.value"></el-option>
            </el-select>
          </span>
        <span class="iconfont icon-copy main-icon" style="margin-left: 5px" title="复制" @click="copy"></span>
      </div>
      <el-input type="textarea"  spellcheck="false"  :autosize="{minRows:6,maxRows:15}" v-model="content"></el-input>
    </el-tabs>
    <span slot="footer" class="dialog-footer">
          <el-button type="primary" @click="visible=false">关 闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: "MessageDetail",
  props: {
    detail: {type: Object}
  },
  data() {
    return {
      visible: true,
      content: "",
      currentFormat: "string",
      format: [{label: 'string', value: 'string'}, {label: 'json', value: 'json'}],
    }
  }, methods: {
    copy() {
      if (this.content) {
        window.api.copy(this.content);
        this.$message.success('复制成功');
      }
    },
    onFormatChange(format) {
      switch (format) {
        case "string":
          this.content = this.detail.value;
          break
        case "json":
          try {
            let message = JSON.parse(this.detail.value);
            this.content = JSON.stringify(message, null, 4);
          } catch (e) {
            this.$message.error("格式化失败");
          }
          break;
      }
    },
    getHeader() {
      let result = [];
      if (this.detail.headers) {
        for (const key in this.detail.header) {
          result.push({key: key, value: this.detail.header[key]});
        }
      }
      return result;
    }
  }, created() {
    try {
      let message = JSON.parse(this.detail.value);
      this.content = JSON.stringify(message, null, 4);
      this.currentFormat = 'json';
    } catch (e) {
      this.content = this.detail.value;
    }
  }
}
</script>

<style scoped>
.main-icon {
  font-size: 16pt;
}
</style>