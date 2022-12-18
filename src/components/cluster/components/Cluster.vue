<template>
  <div>
    <div id="menu" v-show="visible" style=";z-index: 99999">
      <ul>
        <li v-if="row.type==='folder'">
          <div @click="onMenuClick('folder')"><i class="iconfont icon-folder"></i>新建文件夹
          </div>
        </li>
        <li v-if="row.type==='folder'">
          <div @click="onMenuClick('broker')"><i class="iconfont icon-connect"></i>新建连接</div>
        </li>
        <li>
          <div @click="onMenuClick('edit')"><i class="iconfont icon-edit"></i>编辑</div>
        </li>
        <li>
          <div @click="onMenuClick('delete')"><i class="iconfont icon-delete"></i>删除</div>
        </li>
        <li v-if="row.type==='broker'">
          <div @click="onMenuClick('connect')"><i class="iconfont icon-connect"></i>连接...</div>
        </li>
      </ul>
    </div>
    <el-dialog
        title="维护"
        width="550px"
        :close-on-click-modal="false"
        :visible.sync="isEdit"
    >
      <div>
        <el-form ref="form" :model="form" :rules="formRule" label-width="80px">
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name"></el-input>
          </el-form-item>
          <el-form-item label="地址" prop="brokers" v-if="form.type==='broker'">
            <el-input v-model="form.brokers" placeholder="localhost:9092"></el-input>
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input v-model="form.description" type="textarea" :rows="3"></el-input>
          </el-form-item>
          <el-form-item label="启用认证" prop="isAuth" v-if="form.type==='broker'">
            <el-checkbox v-model="form.isAuth"></el-checkbox>
          </el-form-item>
          <el-row v-if="form.isAuth && form.type==='broker'">
            <el-col :span="24">
              <el-form-item label="ssl" prop="ssl">
                <el-checkbox v-model="form.ssl"></el-checkbox>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item
                  label="认证方式" :prop="'sasl.mechanism'"
                  :rules="{ required: true, message: '认证方式不能为空', trigger: 'blur'}"
              >
                <el-select v-model="form.sasl.mechanism" style="width: 100%" clearable filterable>
                  <el-option value="plain" label="plain"></el-option>
                  <el-option value="scram-sha-256" label="scram-sha-256"></el-option>
                  <el-option value="scram-sha-512" label="scram-sha-512"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="form.isAuth && form.type==='broker'">
            <el-col :span="24">
              <el-form-item
                  label="用户名" :prop="'sasl.username'"
                  :rules="{ required: true, message: '用户名不能为空', trigger: 'blur'}"
              >
                <el-input v-model="form.sasl.username"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item
                  label="密码" :prop="'sasl.password'"
                  :rules="{ required: true, message: '密码不能为空', trigger: 'blur'}"
              >
                <el-input v-model="form.sasl.password" show-password></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
          <el-button @click="isEdit=false">取 消</el-button>
          <el-button type="primary" @click="save" :loading="loading">确 认</el-button>
        </span>
    </el-dialog>
    <el-dialog
        title="集群管理"
        width="750px"
        :close-on-click-modal="false"
        :visible.sync="isShowTable"
    >
      <el-form inline label-width="80px">
        <el-form-item>
          <el-input v-model="filterText" placeholder="过滤..." clearable style="width: 300px"></el-input>
        </el-form-item>
        <el-form-item>
          <el-dropdown split-button @click="onDropdownClick('broker')" @command="onDropdownClick">
            <i class="iconfont icon-add" style="font-size: 10px"></i>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="folder"><i class="iconfont icon-folder"></i>新建文件夹</el-dropdown-item>
              <el-dropdown-item command="broker"><i class="iconfont icon-connect"></i>新建连接</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </el-form-item>
      </el-form>
      <el-table
          ref="table" :data="tableList()" row-key="_id" stripe border v-loading="queryLoading"
          height="250" highlight-current-row
          @row-click="onRowClick"
          @row-dblclick="connect"
          @row-contextmenu="onRowContextMenu"
      >
        <el-table-column label="名称" prop="name" header-align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="iconfont icon-folder" v-if="scope.row.type==='folder'"></span>
            <span class="iconfont icon-connect" v-if="scope.row.type==='broker'"></span>
            <span style="margin-left: 5px;vertical-align: middle;">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="地址" prop="brokers" header-align="center"  show-overflow-tooltip></el-table-column>
        <el-table-column label="描述" prop="description" header-align="center"  show-overflow-tooltip></el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
          <el-checkbox v-model="setting.autoOpenWindow" @change="onAutoOpenWindow" style="float: left">程序启动时打开此对话框</el-checkbox>
          <div>
            <el-button @click="isShowTable=false">关 闭</el-button>
            <el-button
                type="primary" :disabled="!row || !row.type ||row.type==='folder'"
                @click="connect"
            >连 接</el-button>
          </div>
        </span>
    </el-dialog>
    <div style="height: 45px;line-height: 45px;">
      <el-link class="iconfont icon-cluster main-icon" :underline="false" @click="showCluster"></el-link>
    </div>
  </div>
</template>

<script>
import api from '../api/cluster'

export default {
  name: "Cluster",
  data() {
    return {
      tab: "",
      setting: {
        autoOpenWindow: false,
      },
      visible: false,
      filterText: "",
      isShowTable: false,
      queryLoading: false,
      loading: false,
      isEdit: false,
      row: {},
      dForm: {},
      form: {
        _id: "",
        name: "",
        isAuth: false,
        ssl: false,
        type: '',
        sasl: {
          mechanism: 'plain',
          username: "",
          password: "",
        },
        brokers: "",
        parent: null,
        description: "",
      },
      formRule: {
        name: [
          {required: true, message: "名称为必填项", trigger: ["blur", "change"]},
        ],
        brokers: [
          {required: true, message: "地址为必填项", trigger: ["blur", "change"]},
        ],
      },
      list: [],
    }
  }, methods: {
    tableList() {
      if (this.filterText) {
        return this.buildTableList(this.list, this.filterText);
      }
      return this.list;
    },
    buildTableList(list, text) {
      let result = [];
      if (list && list.length > 0) {
        for (const row of list) {
          let children = this.buildTableList(row.children, text);
          let isContain = row.name.toLowerCase().indexOf(text.toLowerCase()) >= 1;
          if (!isContain) {
            if (row.description) {
              isContain = row.description.toLowerCase().indexOf(text.toLowerCase()) > -1
            }
          }
          if (!isContain) {
            isContain = row.brokers.toLowerCase().indexOf(text.toLowerCase()) > -1
          }
          let lastRow = Object.assign({}, row);
          if (isContain || children.length > 0) {
            this.$nextTick(() => {
              this.$refs.table.toggleRowExpansion(row, true);
            })
            lastRow.children = children;
            result.push(lastRow);
          }
        }
      }
      return result;
    },
    connect() {
      if (this.row.type === 'folder') {
        this.$refs.table.toggleRowExpansion(this.row);
        return;
      }
      this.isShowTable = false;
      let connecting = this.$loading({
        lock: true,
        text: "连接中...",
        spinner: 'el-icon-loading'
      });
      window.api.settings.get().then(res => {
        api.connect(this.row, res.kafka).then(res => {
          connecting.close();
          this.$message.success('连接成功...');
          this.$emit('connect', res);
        }).catch((err) => {
          connecting.close();
          window.api.showMessageBox({
            title: "连接失败",
            type: "error",
            message: err.toString()
          });
        })
      })

    },
    onDropdownClick(command) {
      this.$refs.table.setCurrentRow();
      this.row = {};
      this.onMenuClick(command);
    },
    onMenuClick(type) {
      if (type === 'folder') {
        this.addFolder();
      } else if (type === 'broker') {
        this.addBroker();
      } else if (type === 'edit') {
        this.edit();
      } else if (type === 'delete') {
        this.delete();
      } else if (type === 'connect') {
        this.connect();
      }
    },
    save() {
      this.$refs.form.validate(v => {
        if (v) {
          api.save(this.form).then(res => {
            this.$message.success('保存成功');
            this.showCluster();
            this.isEdit = false;
          })
        }
      })
    },
    clearValidate() {
      this.$nextTick(() => {
        this.$refs.form.clearValidate();
      })
    },
    addFolder() {
      this.tab = "universal";
      Object.assign(this.form, this.dForm);
      this.form.type = 'folder';
      if (this.row && this.row._id) {
        this.form.parent = this.row._id;
      }
      this.isEdit = true;
      this.clearValidate();
    },
    addBroker() {
      this.tab = "universal";
      Object.assign(this.form, this.dForm);
      if (this.row && this.row._id) {
        this.form.parent = this.row._id;
      }
      this.form.type = 'broker';
      this.clearValidate();
      this.isEdit = true;
    },
    edit() {
      this.tab = "universal";
      Object.assign(this.form, this.row);
      this.clearValidate();
      this.isEdit = true;
    },
    delete() {
      this.$confirm("是否确认删除此项及子项", "提示").then(() => {
        window.api.brokers.deleteById(this.row._id).then(res => {
          this.$message.success('删除成功');
          this.showCluster();
        })
      });
    },
    showCluster() {
      this.isShowTable = true;
      this.queryLoading = true;
      api.query().then(res => {
        this.list = res;
        this.queryLoading = false;
      }).catch(err => {
        this.$message.error("加载失败");
        this.queryLoading = false;
      })
      window.api.settings.get().then(res => {
        this.setting = res;
        if (!this.setting.autoOpenWindow) {
          this.setting.autoOpenWindow = false;
        }
      })
    },
    onRowClick(row) {
      this.row = row;
    },
    onRowContextMenu(row, column, event) {
      this.row = row;
      let menu = document.querySelector("#menu");
      event.preventDefault();
      menu.style.left = event.clientX + "px";
      menu.style.top = event.clientY + "px";
      this.visible = true;
      this.$refs.table.setCurrentRow(row);
      document.addEventListener('click', this.hideContextMenu)
    },
    hideContextMenu() {
      this.visible = false;
      document.removeEventListener('click', this.hideContextMenu)
    },
    onAutoOpenWindow() {
      window.api.settings.save(this.setting).then(res => {
        console.log(res);
      }).catch(e => {
        console.log(e)
      })
    }
  }, created() {
    Object.assign(this.dForm, this.form);
  }
}
</script>

<style scoped>

.el-table .current-row {
  background: #1296db;
}

#menu {
  position: absolute;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
  background: #ffffff;
  cursor: pointer;
  color: #606266;
  border: 1px solid #e4e7ed;
  font-size: 13px;
}

#menu ul {
  list-style: none;
  margin: 0px;
  padding: 0px;
}

#menu ul li {
  padding: 0px 5px;
  height: 30px;
  line-height: 30px;
  position: relative;
  box-sizing: border-box;
  min-width: 120px;
  text-indent: 8px;
}

#menu ul li div i {
  margin-right: 5px;
}

#menu ul li:hover {
  font-weight: bold;
  background-color: #E8F3FE;
  color: #52ABFB;
}

.el-table__row td {
  padding: 0;
}

span {
  vertical-align: middle;
}

.main-icon {
  color: #1296db;
  font-size: 16pt;
}
</style>