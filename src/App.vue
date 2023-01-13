<template>
  <div id="app">
    <Home></Home>
    <Update ref="update"></Update>
  </div>
</template>

<script>
import Home from './views/Home'
import Update from "@/components/Update";

export default {
  name: 'App', components: {Update, Home}, created() {
    window.api.updateAvailable(() => {
      this.$refs.update.show();
    })
    window.api.downloadProgress(data => {
      this.$refs.update.refresh(data);
    })
    window.api.updateDownloaded(() => {
      this.$refs.update.hide();
    });
    try {
      //window.api.checkUpdate();
    } catch (e) {
      console.log(e);
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

body {
  margin: 2px;
  overflow: hidden;
}

.el-dialog__header {
  padding: 5px 5px 5px;
}

.el-dialog__title {
  padding: 5px 5px;
}

.el-table__body tr.current-row > td {
  background-color: #4296D5 !important;
  color: white;
  font-weight: bold;
}

.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content {
  background-color: #4296D5;
  color: white;
  font-weight: bold;
}

span {
  vertical-align: middle;
}

.el-dialog__body {
  padding: 10px 20px;
}
</style>
