<template>
  <div style="padding: 5px">
    <CreateTopic :id="row.id" :visible="isCreateTopic" v-if="isCreateTopic"
                 @success="onCreateTopicSuccess" @cancel="isCreateTopic=false"></CreateTopic>
    <CreatePartition :id="row.id" :visible="isCreatePartition" v-if="isCreatePartition" :topic="row"
                     @cancel="isCreatePartition=false" @success="onCreatePartitionSuccess"></CreatePartition>
    <div id="tree-menu" v-show="visible" style=";z-index: 99999">
      <ul v-if="row.type==='root'">
        <li>
          <div @click="onMenuClick('disconnect')"><i class="iconfont icon-close"></i>关闭连接</div>
        </li>
      </ul>
      <ul v-if="row.type==='brokers'">
        <li>
          <div @click="onMenuClick('brokers-view')"><i class="iconfont icon-view"></i>查看</div>
        </li>
      </ul>
      <ul v-if="row.type==='broker'">
        <li>
          <div @click="onMenuClick('broker-view')"><i class="iconfont icon-view"></i>查看</div>
        </li>
      </ul>
      <ul v-if="row.type==='topics'">
        <li>
          <div @click="onMenuClick('topic-create')"><i class="iconfont icon-add"></i>新增Topic
          </div>
        </li>
        <li>
          <div @click="onMenuClick('topic-refresh')"><i class="iconfont icon-refresh"></i>刷新
          </div>
        </li>
      </ul>
      <ul v-if="row.type==='topic'">
        <li>
          <div @click="onMenuClick('topic-view')"><i class="iconfont icon-view"></i>偏移量
          </div>
        </li>
        <li class="delimiter">
          <div @click="onMenuClick('partition-create')"><i class="iconfont icon-add"></i>新增Partition
          </div>
        </li>
        <li class="delimiter">
          <div @click="onMenuClick('topic-delete')"><i class="iconfont icon-delete"></i>删除
          </div>
        </li>
        <li>
          <div @click="onMenuClick('copy')"><i class="iconfont icon-copy"></i>复制</div>
        </li>
      </ul>
      <ul v-if="row.type==='consumers'">
        <li>
          <div @click="onMenuClick('consumer-refresh')"><i class="iconfont icon-refresh"></i>刷新
          </div>
        </li>
      </ul>
      <ul v-if="row.type==='consumer'">
        <li class="delimiter">
          <div @click="onMenuClick('consumer-view')"><i class="iconfont icon-view"></i>偏移量
          </div>
        </li>
        <li>
          <div @click="onMenuClick('consumer-members')"><i class="iconfont icon-member"></i>分配情况
          </div>
        </li>
        <li class="delimiter">
          <div @click="onMenuClick('consumer-delete')"><i class="iconfont icon-delete"></i>删除
          </div>
        </li>
        <li>
          <div @click="onMenuClick('copy')"><i class="iconfont icon-copy"></i>复制</div>
        </li>
      </ul>
    </div>
    <el-input v-model="filterText" placeholder="过滤..." clearable></el-input>
    <div
        class="tree-body"
    >
      <el-tree
          :style="{ height: treeHeight}"
          ref="tree"
          :data="trees"
          node-key="uuid"
          @node-contextmenu="onRightClick"
          highlight-current
          :filter-node-method="filterNode">
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <div @dblclick="onDbClick(node,data)">
              <span class="iconfont icon-broker" v-if="data.type==='broker'"></span>
              <span class="iconfont icon-topic" v-else-if="data.type==='topic'"></span>
              <span class="iconfont icon-consumer" v-else-if="data.type==='consumer'"></span>
              <span class="iconfont icon-folder" v-else></span>
              <span style="margin-left: 5px">{{ node.label }}</span>
            </div>
          </span>

      </el-tree>
    </div>
  </div>
</template>

<script>
import api from '../../../components/index'
import CreateTopic from "./CreateTopic";
import CreatePartition from "./CreatePartition";

export default {
  name: "LeftTree",
  components: {CreatePartition, CreateTopic},
  data() {
    return {
      row: {},
      node: {},
      isShowBroker: false,
      brokers: [],
      visible: false,
      isCreateTopic: false,
      isCreatePartition: false,
      filterText: "",
      trees: [],
    }
  },
  computed: {
    treeHeight() {
      return `calc(100vh - 64px)`;
    },
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    },
  },
  methods: {
    onMenuClick(type) {
      switch (type) {
        case 'brokers-view':
          api.showBroker(this.row.children)
          break;
        case "broker-view":
          api.showBroker([this.row]);
          break
        case "disconnect":
          this.disconnect();
          break
        case "topic-view":
          this.showTopic();
          break
        case "topic-refresh":
          this.topicsRefresh(false);
          break
        case "topic-delete":
          this.deleteTopic();
          break
        case "consumer-view":
          this.showConsumer();
          break;
        case "consumer-delete":
          this.deleteConsumer();
          break
        case "consumer-refresh":
          this.consumerRefresh();
          break
        case "topic-create":
          this.isCreateTopic = true;
          break
        case "partition-create":
          this.isCreatePartition = true;
          break
        case "copy":
          window.api.copy(this.row.value);
          this.$message.success("复制成功");
          break
        case "consumer-members":
          this.members();
          break
      }
    },
    members() {
      let loading = this.loading("加载中...");
      window.api.members(this.row.id, this.row.value).then(res => {
        loading.close();
        api.showMember(res);
      }).catch(() => {
        this.$message.error("加载失败")
        loading.close();
      })
    },
    onCreatePartitionSuccess() {
      this.isCreatePartition = false;
      this.topicsRefresh(true);
    },
    onCreateTopicSuccess() {
      this.isCreateTopic = false;
      this.topicsRefresh(false);
    },
    deleteConsumer() {
      this.$confirm("是否确认删除?", "提示").then(() => {
        window.api.deleteConsumer(this.row.id, this.row.value).then(res => {
          this.$message.success("删除成功");
          let parent = this.node.parent;
          const children = parent.data.children || parent.data;
          const index = children.findIndex(d => d.value === this.row.value);
          children.splice(index, 1);
        }).catch(err => {
          this.$message.error("删除失败");
        })
      });
    },
    showConsumer() {
      let loading = this.loading("加载中...");
      window.api.consumerOffsets(this.row.id, this.row.value).then(res => {
        loading.close();
        api.showConsumer(this.row.id, this.row.label, res);
      }).catch(e => {
        this.$message.error("加载失败")
        loading.close();
      })
    },
    showTopic() {
      window.api.topicOffsets(this.row.id, this.row.value).then(res => {
        console.log("topic:", res);
        api.showTopic(this.row, res);
      })
    },
    deleteTopic() {
      this.$confirm("是否确认删除?", "提示").then(() => {
        let option = {topics: [this.row.value], timeout: 5000};
        window.api.deleteTopic(this.row.id, option).then(res => {
          if (res) {
            this.$message.success("删除成功");
            let parent = this.node.parent;
            const children = parent.data.children || parent.data;
            const index = children.findIndex(d => d.value === this.row.value);
            children.splice(index, 1);
          } else {
            this.$message.success("执行成功,但删除失败");
          }
        }).catch(err => {
          alert(err);
        })
      });
    },
    topicsRefresh(parent) {
      window.api.topics(this.row.id).then(res => {
        console.log("刷新成功:", res);
        if (!parent) {
          this.row.children = res.children;
          this.$message.success("刷新成功")
        } else {
          this.node.parent.data.children = res.children;
        }
        this.$nextTick(() => {
          this.$refs.tree.filter(this.filterText);
        })
      }).catch(err => {
        alert("加载失败");
      })
    },
    consumerRefresh() {
      window.api.consumers(this.row.id).then(res => {
        this.row.children = res.children;
        this.$message.success("刷新成功")
        this.$nextTick(() => {
          this.$refs.tree.filter(this.filterText);
        })
      }).catch(err => {
        alert("加载失败");
      })
    },
    disconnect() {
      let loading = this.loading("关闭中...");
      window.api.disconnect(this.row.value).then(res => {
        loading.close();
        this.$message.success("关闭成功");
        this.$emit('close', this.row.id);
        let index = this.trees.findIndex(d => d.value === this.row.value);
        if (index > -1) {
          this.trees.splice(index, 1);
        }
      }).catch((err => {
        loading.close();
        this.$message.success("关闭失败");
      }))
    },
    push(tree) {
      this.trees.push(tree);
      this.$refs.tree.filter(this.filterText);
    },
    filterNode(value, data) {
      if (!value) return true;
      return data.label.toLocaleLowerCase().indexOf(value.toLocaleLowerCase()) !== -1;
    },
    onDbClick(node, data) {
      this.row = data;
      this.node = node;
      if (this.row.type === 'topic') {
        this.$emit('start', data);
      }
    },
    loading(message) {
      return this.$loading({
        lock: true,
        text: message,
        spinner: 'el-icon-loading'
      });
    },
    onRightClick(event, data, node, target) {
      this.row = data;
      this.node = node;
      let menu = document.querySelector("#tree-menu");
      event.preventDefault();
      menu.style.left = event.clientX + "px";
      menu.style.top = event.clientY + "px";
      this.visible = true;
      this.$refs.tree.setCurrentNode(data);
      document.addEventListener('click', this.hideContextMenu)
    },
    hideContextMenu() {
      this.visible = false;
      document.removeEventListener('click', this.hideContextMenu)
    }
  }
}
</script>

<style scoped>
#tree-menu {
  position: absolute;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
  background: #ffffff;
  cursor: pointer;
  color: #606266;
  border: 1px solid #e4e7ed;
  font-size: 13px;
}

#tree-menu ul {
  list-style: none;
  margin: 0px;
  padding: 0px;
}

#tree-menu ul li {
  padding: 0px 5px;
  height: 30px;
  line-height: 30px;
  position: relative;
  box-sizing: border-box;
  min-width: 120px;
  text-indent: 8px;
}


#tree-menu ul li.delimiter div {
  margin-right: 5px;
  border-bottom-color: #D4D4D4;
  border-bottom-width: 1px;
  border-bottom-style: solid;
}

#tree-menu ul li:hover {
  font-weight: bold;
  background-color: #E8F3FE;
  color: #52ABFB;
}

.tree-body{
  overflow: auto;
}
</style>