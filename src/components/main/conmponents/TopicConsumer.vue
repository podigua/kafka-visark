<template>
  <div :style="{ height: mainHeight}">
    <el-form inline ref="formRef" :model="form" :rules="formRule" label-width="80px">
      <el-form-item label="类型" prop="type">
        <el-select v-model="form.type" @change="onSelectQueryChange">
          <el-option :value="1" label="按数量"></el-option>
          <el-option :value="5" label="按偏移量"></el-option>
          <el-option :value="2" label="按时间"></el-option>
          <el-option :value="3" label="开始时间+数量"></el-option>
          <el-option :value="4" label="结束时间+数量"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围" prop="times" v-if="form.type===2">
        <el-date-picker
            v-model="form.times"
            type="datetimerange"
            :picker-options="pickerOptions"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            align="right"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item label="开始时间" prop="start" v-if="form.type===3">
        <el-date-picker
            v-model="form.start"
            type="datetime"
            align="right"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item label="数量" prop="size" v-if="form.type!==2 && form.type!==5">
        <el-input-number :min="1" controls-position="right" v-model="form.size"></el-input-number>
      </el-form-item>
      <el-form-item label="结束时间" prop="end" v-if="form.type===4">
        <el-date-picker
            v-model="form.end"
            type="datetime"
            align="right"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item label-width="120px" label="fromBeginning" prop="fromBeginning" v-if="form.type===1">
        <el-select v-model="form.fromBeginning">
          <el-option :value="true" label="是"></el-option>
          <el-option :value="false" label="否"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="开始位置" prop="startOffset" v-if="form.type===5">
        <el-input-number v-model="form.startOffset" controls-position="right"></el-input-number>
      </el-form-item>
      <el-form-item label="结束位置" prop="endOffset" v-if="form.type===5">
        <el-input-number v-model="form.endOffset" controls-position="right"></el-input-number>
      </el-form-item>
      <el-form-item style="float: right">
        <el-input v-model="filterText" placeholder="过滤..." clearable>
        </el-input>
      </el-form-item>
    </el-form>

    <el-button
        type="text" style="font-size: 16pt" @click="start" v-if="!running" :disabled="querying"
        icon="el-icon-video-play"
        title="开始"
        :loading="isStarting"
    ></el-button>
    <el-button
        type="text" style="font-size: 16pt" @click="stop" v-if="running" :disabled="querying"
        icon="el-icon-video-pause"
        title="停止"
        :loading="isStopping"
    ></el-button>

    <el-button
        type="text" style="font-size: 16pt" icon="el-icon-search" :loading="querying"
        :disabled="isStopping || isStarting" title="搜索"
        @click="query"
    ></el-button>
    <el-button type="text" style="font-size: 16pt" icon="el-icon-circle-close" title="清空" @click="clear"></el-button>
    <el-button
        type="text" style="font-size: 16pt" icon="el-icon-download" title="导出" :disabled="list.length===0"
        :loading="exporting"
        @click="exportData"
    ></el-button>

    <ux-grid
        v-loading="loading"
        ref="table"
        highlight-current-row
        stripe
        :height="tableHeight"
        :data="list"
        size="mini"
        beautifyTable
        widthResize
        :row-height="10"
        use-virtual
        @row-dblclick="onRowdblClick"
        showBodyOverflow="title"
        showHeaderOverflow="title"
        border
    >
      <ux-table-column
          key="partition"
          field="partition"
          sortable
          title="partition"
          align="center"
          resizable
          :filters="partitionFilters"
          :filter-method="filterPartition"
          width="120px"
      />
      <ux-table-column
          key="offset"
          sortable
          field="offset"
          title="offset"
          resizable
          align="center"
          width="120px"
      />
      <ux-table-column
          key="value"
          :filters="[]"
          :filter-method="filterMessageMethod"
          show-overflow-tooltip
          show-overflow
          resizable
          field="value"
          title="value"
      >
      </ux-table-column>
      <ux-table-column
          key="time"
          sortable
          fixed
          field="time"
          title="time"
          align="center"
          width="180px"
      />
    </ux-grid>
  </div>
</template>

<script>
import {QueryType} from '../../clazz'
import api from '../index'
import {DateUtils} from "@/utils/DateUtils";

export default {
  name: "TopicConsumer",
  props: {
    id: {type: String},
    topic: {type: String},
    partitions: {type: Array}
  },
  watch: {
    filterText() {
      this.doFilter();
    }
  },
  mounted() {
    this.tableHeight = window.innerHeight - 265;
  },
  computed: {
    mainHeight() {
      return `calc(100vh - 145px)`;
    },
  },
  data() {
    return {
      tableHeight: 500,
      isShowPopover: false,
      partitionFilters: [],
      filterText: "",
      pickerOptions: {
        shortcuts: [{
          text: '今天',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setHours(0, 0, 0);
            end.setHours(23, 59, 59);
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '昨天',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setHours(0, 0, 0);
            end.setHours(23, 59, 59);
            start.setTime(start.getTime() - 3600 * 1000 * 24);
            end.setTime(end.getTime() - 3600 * 1000 * 24);
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '近三天',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setHours(0, 0, 0);
            end.setHours(23, 59, 59);
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 2);
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '近一周',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setHours(0, 0, 0);
            end.setHours(23, 59, 59);
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 6);
            picker.$emit('pick', [start, end]);
          }
        }]
      },
      running: false,
      isStarting: false,
      isStopping: false,
      loading: false,
      querying: false,
      exporting: false,
      form: {
        type: QueryType.SIZE,
        size: 100,
        fromBeginning: false,
        start: null,
        end: null,
        startOffset: null,
        endOffset: null,
        times: [],
      },
      formRule: {
        size: [
          {required: true, type: 'number', message: "数量为必填项", trigger: ["blur", "change"]},
        ],
        start: [
          {required: true, message: "开始时间为必填项", trigger: ["blur", "change"]},
        ],
        end: [
          {required: true, message: "结束时间为必填项", trigger: ["blur", "change"]},
        ],
        times: [
          {required: true, type: "array", message: "时间范围为必填项", trigger: ["blur", "change"]},
        ],
        startOffset: [
          {required: true, type: "number", message: "开始位置为必填项", trigger: ["blur", "change"]},
        ],
        endOffset: [
          {required: true, type: "number", message: "结束位置为必填项", trigger: ["blur", "change"]},
        ]
      },
      list: [],
      searchPromise: null,
    }
  }, methods: {
    exportData() {
      this.exporting = true;
      let filename = this.topic + "-" + DateUtils.format(new Date().getTime(), "yyyyMMddHHmmss") + ".xlsx";
      window.api.settings.get().then(res => {
        if (res.downloadPath) {
          this.exportMessage(res.downloadPath, filename);
        } else {
          window.api.openSaveFolder(filename).then(res => {
            if (res.canceled === false) {
              this.exportMessage(res.filePath, '');
            } else {
              this.exporting = false;
            }
          }).catch(err => {
            console.log(err);
            this.exporting = false;
          })
        }
      })

    },
    exportMessage(filePath, filename) {
      window.api.exportMessage(filePath, filename, this.list).then(res => {
        this.exporting = false;
        this.$message.success("导出成功");
        window.api.noticeFile('打开文件夹', filePath, filename);
      }).catch(e => {
        this.$message.error("导出失败");
        this.exporting = false;
      })
    },
    onRowdblClick(row) {
      api.openMessage(row);
    },
    onSelectQueryChange() {
      this.$refs.formRef.clearValidate();
    },
    doFilter() {
      const column = this.$refs.table.getColumnByField('value');
      let filters = [];
      if (this.filterText) {
        filters.push({label: this.filterText, value: this.filterText, checked: true});
      }
      this.$refs.table.setFilter(column, filters)
      this.$refs.table.updateData()
    },
    filterPartition({value, row, column}) {
      if (value != null) {
        return row.partition === value;
      }
    },
    filterMessageMethod({value, row, column}) {
      if (value) {
        return row.value && row.value.toLowerCase().indexOf(value.toLowerCase()) > -1;
      }
      return true;
    },
    start() {
      this.isStarting = true;
      this.clear();
      this.form.type = QueryType.SIZE;
      window.api.startMessage(this.id, this.topic, this.form.fromBeginning).then(res => {
        this.$message.success("启动成功");
        this.running = true;
        this.isStarting = false;
      }).catch((err => {
        this.isStarting = false;
        this.$message.error("启动失败");
      }))
    }, shutdown() {
      return new Promise((resolve, reject) => {
        if (this.running) {
          this.stop().then(() => {
            resolve(true);
          }).catch(() => {
            reject(false);
          })
        } else {
          resolve(true);
        }
      })
    }, stop() {
      return new Promise((resolve, reject) => {
        this.isStopping = true;
        window.api.stopMessage(this.id, this.topic).then(res => {
          this.$message.success("停止成功")
          this.running = false;
          this.isStopping = false;
          resolve(true);
        }).catch(e => {
          this.isStopping = false;
          this.$message.error("停止失败")
          reject(false);

        })
      })
    },
    clear() {
      this.list = [];
    },
    getPromiseWithAbort() {
      let obj = {};
      //内部定一个新的promise，用来终止执行
      let p1 = new Promise(function (resolve, reject) {
        obj.abort = resolve;
      });
      obj.promise = Promise.race([this.searchPromise, p1]);
      return obj;
    },
    query() {
      if (this.running) {
        this.$confirm("正在接收实时数据,是否停止?", "提示").then(() => {
          this.stop().then(res => {
            this.search();
          })
        })
      } else {
        this.search();
      }
    },
    search() {
      this.$refs.formRef.validate((v) => {
        if (v) {
          if (this.form.type === 5) {
            if (this.form.endOffset < this.form.startOffset) {
              this.$message.error("开始位置不能大于结束位置");
              return;
            }
          }
          this.querying = true;
          this.clear();
          switch (this.form.type) {
            case QueryType.SIZE:
              this.searchPromise = this.queryBySize();
              break;
            case QueryType.TIMESTAMP:
              this.searchPromise = this.queryByTime();
              break
            case QueryType.START_SIZE:
              this.searchPromise = this.queryByStartAndSize();
              break
            case QueryType.END_SIZE:
              this.searchPromise = this.queryByEndAndSize();
              break
            case QueryType.OFFSET:
              this.searchPromise = this.queryByOffset();
              break
          }
          this.loading = true;
          this.searchPromise.then(res => {
            this.loading = false;
            this.querying = false;
            this.searchPromise = null;
            this.$message.success("查询成功");
            res.forEach(row => {
              this.list.unshift(row);
            })
          }).catch(e => {
            this.loading = false;
            this.querying = false;
            this.searchPromise = null;
            this.$message.error("查询出错")
          })
        }
      })
    },
    queryByEndAndSize() {
      return window.api.messageByEndAndSize({
        id: this.id,
        topic: this.topic,
        end: this.form.end.getTime(),
        size: this.form.size,
      })
    },
    queryByOffset() {
      return window.api.messageByOffset({
        id: this.id,
        topic: this.topic,
        startOffset: this.form.startOffset,
        endOffset: this.form.endOffset,
      })
    },
    queryByStartAndSize() {
      return window.api.messageByStartAndSize({
        id: this.id,
        topic: this.topic,
        start: this.form.start.getTime(),
        size: this.form.size,
      })
    },
    queryByTime() {
      return window.api.messageByTime({
        id: this.id,
        topic: this.topic,
        start: this.form.times[0].getTime(),
        end: this.form.times[1].getTime(),
      })
    },
    queryBySize() {
      return window.api.messageBySize({
        id: this.id,
        topic: this.topic,
        size: this.form.size,
        fromBeginning: this.form.fromBeginning
      });
    }
  }, created() {
    this.partitionFilters = this.partitions.map(data => {
      return {label: data, value: data};
    })
    window.api.message((message) => {
      if (this.id === message.id && this.topic === message.topic) {
        this.list.unshift(message);
      }
    })
  }
}
</script>

<style scoped>
.el-dialog__body {
  padding: 20px 5px;
}


</style>