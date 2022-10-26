<template>
  <el-container>
    <el-header height="45px">
      <div style="height: 45px;display: flex;align-items: center;justify-content: space-between">
        <div style="display: flex;">
          <div style="width: 30px;line-height:45px;">
            <el-link
                class="icon-expand-right iconfont main-icon"
                :underline="false"
                v-if="!showTree"
                @click="expand"
            ></el-link>
            <el-link
                class="icon-expand-left iconfont main-icon"
                :underline="false"
                v-if="showTree"
                @click="expand"
            ></el-link>
          </div>
          <div style="width: 30px">
            <Cluster
                ref="cluster"
                @connect="onConnect"
                style="display: inline-block"
            ></Cluster>
          </div>
        </div>
        <div style="float: right">
          <Settings style="display: inline-block"></Settings>
        </div>
      </div>
    </el-header>
    <el-container :style="containerStyle">
      <transition name="el-fade-in-linear">
        <div v-show="showTree">
          <el-aside
              width="300px"
              style="border-right-color: #C4C4C4;border-bottom-style: solid;border-bottom-width: 1px;"
          >
            <LeftTree
                ref="tree"
                @start="push"
                @close="close"
                @expand="expand"
            ></LeftTree>
          </el-aside>
        </div>
      </transition>
      <el-container :style="containerStyle">
        <el-aside width="2px">
          <div style="background: #C4C4C4;margin-top: 5px;margin-bottom: 5px;height: 100%"></div>
        </el-aside>
        <el-container>
          <el-main>
            <div>
              <el-tabs
                  v-model="tab"
                  type="border-card"
                  closable
                  v-if="rows.length!==0"
                  @tab-remove="onTabRemove"
              >
                <el-tab-pane
                    v-for="item in rows"
                    :label="item.topic"
                    :key="item.uuid"
                    :name="item.uuid"
                    :closable="true"
                >
                  <RightMain
                      ref="main"
                      :id="item.id"
                      :topic="item.topic"
                      :partitions="item.partitions"
                  ></RightMain>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-main>
        </el-container>
      </el-container>
    </el-container>
  </el-container>
</template>

<script>
import Cluster from "../components/cluster/components/Cluster";
import LeftTree from "../components/tree/components/LeftTree";
import RightMain from "../components/main/conmponents/RightMain";
import Settings from "@/components/setting/conmponents/Settings";

export default {
  name: "Home",
  components: {Settings, RightMain, LeftTree, Cluster},
  data() {
    return {
      tab: "",
      showTree: false,
      rows: [],
    }
  },
  computed: {
    containerStyle() {
      return {
        height: `calc(100vh - 64px)`,
      }
    },
  },
  methods: {
    expand() {
      this.showTree = !this.showTree;
    },
    onTabRemove(uuid) {
      return new Promise((resolve, reject) => {
        for (let index = 0; index < this.rows.length; index++) {
          let row = this.rows[index];
          if (row.uuid === uuid) {
            this.$refs.main[index].shutdown().then(res => {
              if (this.rows.length !== 1) {
                if (index === 0) {
                  this.tab = this.rows[1].uuid;
                } else {
                  this.tab = this.rows[index - 1].uuid;
                }
              }
              this.rows.splice(index, 1);
              resolve(true);
            }).catch((err) => {
              resolve(false);
              this.$message.success("关闭失败");
            })
            break;
          }
        }
      })
    },
    close(id) {
      let length = this.rows.length;
      for (let index = length - 1; index >= 0; index--) {
        if (this.rows[index].id === id) {
          this.rows.splice(index, 1);
        }
      }
    },
    push(row) {
      let node = this.rows.find(data => data.uuid === row.uuid);
      if (!node) {
        this.rows.push({
          uuid: row.uuid,
          id: row.id,
          topic: row.value,
          partitions: row.partitions.map(data => data.partitionId)
        })
      }
      this.tab = row.uuid;
    },
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1 || (data.value && data.value.indexOf(value) !== -1);
    },
    onConnect(tree) {
      if (!this.showTree) {
        this.expand();
      }
      this.$refs.tree.push(tree);
    }
  }, created() {
    window.api.settings.get().then(res => {
      if (res.autoOpenWindow) {
        this.$refs.cluster.showCluster();
      }
    })
  }
}
</script>

<style scoped>
.el-header {
  background-color: #F5F5F5;
  color: #333;
}

.el-aside {
  color: #333;
}

.el-main {
  color: #333;
  padding: 5px;
}

.tree-body {
  overflow: auto;
}

.expand-right {
  background-color: #F3F6F9;
}

.main-icon {
  color: #1296db;
  font-size: 20pt;
}

</style>