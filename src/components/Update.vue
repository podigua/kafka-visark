<template>
  <div style="user-select: none">
    <el-dialog
        :show-close="false"
        top="40vh"
        v-if="visible"
        width="650px"
        :close-on-click-modal="false"
        :destroy-on-close="true"
        :visible.sync="visible"
    >
      <div class="container">
        <img :src="logo" width="80px" height="80px"/>
        <div class="percent">
          <div>
            <el-progress :text-inside="true" :stroke-width="24" :percentage="getPercent(updater.percent)" status="success"/>
          </div>
          <div class="describe">
            <span style="margin-right: 30px;">{{ byteConvert(updater.transferred) }} / {{
                byteConvert(updater.total)
              }}</span>
            <span>{{ byteConvert(updater.bytesPerSecond) }}/S</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import logoImage from '@/assets/logo.png'

export default {
  name: "Update",
  data() {
    return {
      logo: logoImage,
      visible: false,
      updater: {
        total: 0,
        delta: 0,
        transferred: 0,
        percent: 0,
        bytesPerSecond: 0
      }
    }
  }, methods: {
    show() {
      this.visible = true;
    },
    hide() {
      this.visible = false;
    },
    refresh(data) {
      this.updater = data;
    },
    getPercent(value) {
      return value.toFixed(2);
    },
    byteConvert(bytes) {
      if (isNaN(bytes)) {
        return '';
      }
      let symbols = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      let exp = Math.floor(Math.log(bytes) / Math.log(2));
      if (exp < 1) {
        exp = 0;
      }
      let i = Math.floor(exp / 10);
      bytes = bytes / Math.pow(2, 10 * i);

      if (bytes.toString().length > bytes.toFixed(2).toString().length) {
        bytes = bytes.toFixed(2);
      }
      return bytes + ' ' + symbols[i];
    }
  }
}
</script>

<style scoped>
.container {
  height: 100px;
  display: flex;
}

.el-dialog__header .el-dialog__title {
  height: 0;
}

.percent {
  margin-left: 30px;
  width: 90%;
  padding: 10px;
}

.describe {
  margin-top: 20px;
  font-weight: bold;
}

</style>