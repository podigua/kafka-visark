<template>
  <div>
    <el-dialog
        title="设置"
        :close-on-click-modal="false"
        :visible.sync="isEdit"
    >
      <div style="min-height: 250px">
        <el-form
            ref="formRef"
            :model="form"
            :rules="formRule"
            label-width="140px"
        >
          <el-tabs v-model="tab" tab-position="left">
            <el-tab-pane label="通用" name="universal" style="min-height: 250px;">
              <el-form-item
                  label-width="80px"
                  label="保存路径"
                  prop="downloadPath"
              >
                <el-input v-model="form.downloadPath" clearable>
                  <el-button
                      slot="append"
                      type="primary"
                      :loading="selecting"
                      @click="selectFolder"
                  >选择
                  </el-button>
                </el-input>
              </el-form-item>
            </el-tab-pane>
            <el-tab-pane label="Kafka" name="kafka">
              <el-row>
                <el-col :span="12">
                  <el-tooltip placement="top" content="请求超时时间,单位毫秒">
                    <el-form-item
                        label="请求超时时间"
                        :prop="'kafka.requestTimeout'"
                        :rules="{ required: true, message: '请求超时时间不能为空', trigger: 'blur'}"
                    >
                      <el-input-number
                          v-model="form.kafka.requestTimeout"
                          controls-position="right"
                          style="width: 100%"
                          :step="1000"
                          :min="1000"
                      ></el-input-number>
                    </el-form-item>
                  </el-tooltip>
                </el-col>
                <el-col :span="12">
                  <el-form-item
                      label="强制请求超时"
                      :prop="'kafka.enforceRequestTimeout'"
                      :rules="{ required: true, message: '强制请求超时不能为空', trigger: 'blur'}"
                  >
                    <el-radio-group v-model="form.kafka.enforceRequestTimeout">
                      <el-radio :label="true">是</el-radio>
                      <el-radio :label="false">否</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
              <fieldset>
                <legend>认证：</legend>
                <el-row>
                  <el-col :span="12">
                    <el-tooltip placement="top" content="身份验证请求超时（毫秒）">
                      <el-form-item
                          label="认证超时时间"
                          :prop="'kafka.authenticationTimeout'"
                          :rules="{ required: true, message: '认证超时时间不能为空', trigger: 'blur'}"
                      >
                        <el-input-number
                            v-model="form.kafka.authenticationTimeout"
                            controls-position="right"
                            style="width: 100%"
                            :step="1000"
                            :min="1000"
                        ></el-input-number>
                      </el-form-item>
                    </el-tooltip>
                  </el-col>
                  <el-col :span="12">
                    <el-tooltip placement="top" content="在代理端配置定期重新身份验证（connections.max.reauth.ms）时，在会话生存期剩余的重新身份验证阈值毫秒时进行重新身份验证。">
                      <el-form-item
                          label="重新身份验证阈值"
                          :prop="'kafka.reauthenticationThreshold'"
                          :rules="{ required: true, message: '重新身份验证阈值不能为空', trigger: 'blur'}"
                      >
                        <el-input-number
                            v-model="form.kafka.authenticationTimeout"
                            controls-position="right"
                            style="width: 100%"
                            :step="1000"
                            :min="1000"
                        ></el-input-number>
                      </el-form-item>
                    </el-tooltip>
                  </el-col>
                </el-row>
              </fieldset>
              <fieldset>
                <legend>重试：</legend>
                <el-row>
                  <el-col :span="12">
                    <el-tooltip placement="top" content="重试的最大等待时间（毫秒）">
                      <el-form-item
                          label="最大重试时间"
                          :prop="'kafka.retry.maxRetryTime'"
                          :rules="{ required: true, message: '最大重试时间不能为空', trigger: 'blur'}"
                      >
                        <el-input-number
                            v-model="form.kafka.retry.maxRetryTime"
                            controls-position="right"
                            style="width: 100%"
                            :step="1000"
                            :min="1000"
                        ></el-input-number>
                      </el-form-item>
                    </el-tooltip>
                  </el-col>
                  <el-col :span="12">
                    <el-tooltip placement="top" content="用于计算以毫秒为单位的重试的初始值（此值仍按[重试系数]随机化）">
                      <el-form-item
                          label="初始重试时间(ms)"
                          :prop="'kafka.retry.initialRetryTime'"
                          :rules="{ required: true, message: '初始重试时间不能为空', trigger: 'blur'}"
                      >
                        <el-input-number
                            v-model="form.kafka.retry.initialRetryTime"
                            controls-position="right"
                            style="width: 100%"
                            :step="1000"
                            :min="1000"
                        ></el-input-number>
                      </el-form-item>
                    </el-tooltip>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12">
                    <el-tooltip placement="top" content="倍增">
                      <el-form-item
                          label="重试倍数"
                          :prop="'kafka.retry.multiplier'"
                          :rules="{ required: true, message: '重试倍数不能为空', trigger: 'blur'}"
                      >
                        <el-input-number
                            v-model="form.kafka.retry.multiplier"
                            controls-position="right"
                            style="width: 100%"
                            :min="1"
                        ></el-input-number>
                      </el-form-item>
                    </el-tooltip>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item
                        label="重试系数"
                        :prop="'kafka.retry.factor'"
                        :rules="{ required: true, message: '重试系数不能为空', trigger: 'blur'}"
                    >
                      <el-input-number
                          v-model="form.kafka.retry.factor"
                          controls-position="right"
                          style="width: 100%"
                          :step="0.1"
                          :min="0.1"
                          :max="1"
                      ></el-input-number>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12">
                    <el-tooltip placement="top" content="每次连接的最大重试次数">
                      <el-form-item
                          label="重试次数"
                          :prop="'kafka.retry.retries'"
                          :rules="{ required: true, message: '重试次数不能为空', trigger: 'blur'}"
                      >
                        <el-input-number
                            v-model="form.kafka.retry.retries"
                            controls-position="right"
                            style="width: 100%"
                            :min="2"
                        ></el-input-number>
                      </el-form-item>
                    </el-tooltip>
                  </el-col>
                </el-row>
              </fieldset>
            </el-tab-pane>
            <el-tab-pane label="Topic" name="topic">
              <el-row>
                <el-col :span="12">
                  <el-tooltip placement="top" content="若为[是],则只进行验证,但不会创建Topic">
                    <el-form-item
                        label="仅验证"
                        prop="topic.validateOnly"
                        :rules="{ required: true, message: '仅验证不能为空', trigger: 'blur'}"
                    >
                      <el-radio-group v-model="form.topic.validateOnly">
                        <el-radio :label="true">是</el-radio>
                        <el-radio :label="false">否</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </el-tooltip>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12">
                  <el-tooltip placement="top" content="若为[是],则会等待Topic的Metadata不会抛出`LEADER_NOT_AVAILABLE`异常">
                    <el-form-item
                        label="等待Leader"
                        prop="topic.waitForLeaders"
                        :rules="{ required: true, message: '等待Leader不能为空', trigger: 'blur'}"
                    >
                      <el-radio-group v-model="form.topic.waitForLeaders">
                        <el-radio :label="true">是</el-radio>
                        <el-radio :label="false">否</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </el-tooltip>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12">
                  <el-tooltip placement="top" content="等待在控制器节点上完全创建Topic的时间（毫秒）">
                    <el-form-item
                        label="超时时间"
                        :prop="'topic.timeout'"
                        :rules="{ required: true, message: '超时时间不能为空', trigger: 'blur'}"
                    >
                      <el-input-number
                          v-model="form.topic.timeout"
                          controls-position="right"
                          style="width: 100%"
                          :step="1000"
                          :min="1000"
                      ></el-input-number>
                    </el-form-item>
                  </el-tooltip>
                </el-col>
              </el-row>
            </el-tab-pane>
          </el-tabs>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
          <el-button @click="isEdit=false">取 消</el-button>
          <el-button type="primary" @click="reset" :loading="loading">重 置</el-button>
          <el-button type="primary" @click="save" :loading="loading">确 认</el-button>
        </span>
    </el-dialog>

    <div style="height: 45px;line-height: 45px;">
      <el-link
          class="iconfont icon-setting main-icon"
          :underline="false"
          v-loading="setting"
          @click="showSetting"
      ></el-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "Settings",
  data() {
    let checkDownloadPath = (rule, value, callback) => {
      if (!value) {
        return callback()
      }
      window.api.exists(value).then(res => {
        callback()
      }).catch(e => {
        callback(new Error('保存路径不存在'));
      })
    };
    return {
      tab: "universal",
      setting: false,
      loading: false,
      selecting: false,
      isEdit: false,
      form: {
        autoOpenWindow: false, downloadPath: '', kafka: {
          requestTimeout: 30000, enforceRequestTimeout: false, retry: {
            maxRetryTime: 30000, initialRetryTime: 300, multiplier: 2, retries: 5, factor: 0.2,authenticationTimeout:10000,reauthenticationThreshold:10000
          }
        }, topic: {
          validateOnly: false, waitForLeaders: true, timeout: 5000,
        }
      },
      formRule: {
        downloadPath: [
          {validator: checkDownloadPath, trigger: ['blur', 'change']}
        ]
      },
    }
  }, methods: {
    selectFolder() {
      this.selecting = true;
      window.api.selectFolder(this.form.downloadPath).then(res => {
        this.selecting = false;
        if (res.canceled === false) {
          this.form.downloadPath = res.filePaths[0];
        }
      }).catch(e => {
        this.selecting = false;
      })
    },
    showSetting() {
      this.setting = true;
      window.api.settings.get().then(res => {
        this.isEdit = true;
        this.setting = false;
        this.form = res;
        this.$nextTick(() => {
          this.$refs.formRef.clearValidate();
        })
      }).catch(e => {
        this.setting = false;
      })
    },
    reset() {
      window.api.settings.default().then(res => {
        this.form = res;
        this.$message.success("重置成功");
        this.$nextTick(() => {
          this.$refs.formRef.clearValidate();
        })
      })
    },
    save() {
      this.$refs.formRef.validate(v => {
        if (v) {
          this.loading = true;
          window.api.settings.save(this.form).then(res => {
            this.loading = false;
            this.isEdit = false;
            this.$message.success("保存成功");
          }).catch(e => {
            this.$message.error("保存失败");
            this.loading = false;
          })
        }
      })
    }
  }, created() {

  }
}
</script>

<style scoped>
.main-icon {
  color: #1296db;
  font-size: 16pt;
}

fieldset {
  border: 0;
  padding: 5px;
  margin-bottom: 10px;
}

legend {
  padding: 5px 10px;
}
</style>