<template>
  <div class="app-container">
    <div  class="head-container">
      <el-descriptions title="服务器信息">
        <el-descriptions-item label="服务器地址">{{ server }}</el-descriptions-item>
        <el-descriptions-item label="服务器端口">{{ port }}</el-descriptions-item>
        <!--        <el-descriptions-item label="居住地">苏州市</el-descriptions-item>-->
        <!--        <el-descriptions-item label="备注">-->
        <!--            <el-tag size="small">学校</el-tag>-->
        <!--        </el-descriptions-item>-->
        <!--        <el-descriptions-item label="联系地址">江苏省苏州市吴中区吴中大道 1188 号</el-descriptions-item>-->
      </el-descriptions>
      <el-button type="success" @click="open" >订阅设备</el-button>
      <el-button type="danger" @click="open_init" >配置服务器信息</el-button>
      <!--    <el-input v-model="input" placeholder="请输入内容"></el-input>-->
    </div>
    <el-table
      :data="tableData"
      style="width: 100%"
    >
      <el-table-column
        prop="id"
        label="设备id"
        width="500"
      />
      <el-table-column
        prop="humidity"
        label="湿度"
        width="300"
      />
      <el-table-column
        prop="temperature"
        label="温度"
        width="300"
      />
      <el-table-column
        prop="lately"
        label="最近更新"
      />
      <el-table-column
        fixed="right"
        label="操作"
        width="100"
      >
        <template slot-scope="scope">
          <!--                <el-button @click="handleClick(scope.row)" type="text" size="small">查看</el-button>-->
          <!--                <el-button type="text" size="small">编辑</el-button>-->
          <el-button type="text" size="small" @click="delItem(scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import moment from 'moment/moment'
import * as mqtt from 'mqtt'
import { temperatureAdd, temperatureDel, temperatureSearch } from '@/api/iot/temperature'

export default {
  name: 'Temperature',
  data() {
    return {
      server: null,
      port: null,
      input: null,
      tableData: [
        //     {
        //     id: 'tt',
        //     temperature: '36℃',
        //     lately: '2016-05-02'
        // }
      ],
      radio: '1',
      // 客户端实例
      client: null
    }
  },
  created: function() {
    // 设置默认配置
    this.server = '127.0.0.1'
    this.port = '1883'
    this.initMqtt()
    this.flushTable()
  },
  methods: {
    initMqtt: function() {
      console.log('开始连接')
      // console.log(mqtt);
      const options = {
        clean: true,
        connectTimeout: 4000,
        // 客户端id
        clientId: 'mqtt_test'
      }
      let i = false
      if (this.client != null) { i = true }
      this.client = mqtt.connect('mqtt://' + this.server + ':' + this.port, options)
      this.client.on('connect', this.connect)
      // //订阅话题
      // this.client.subscribe("HelloWord")
      if (i) {
        // 订阅
        this.serverSubscribe()
      }

      // 接收信息
      this.client.on('message', (topic, payload, packet) => this.message(topic, payload, packet))
    },
    serverSubscribe() {
      for (let i = 0; i < this.tableData.length; i++) {
        console.log(this.tableData[i].id)
        this.client.subscribe(this.tableData[i].id)
      }
    },
    connect: function() {
      console.log('Connected')
      this.client.subscribe('test', err => this.send(err))
    },
    message: function(topic, payload, packet) {
      console.log('收到信息')
      console.log(`Topic: ${topic}, Message: ${payload.toString()}, QoS: ${packet.qos}`)
      this.update(topic, payload)
      // this.add(topic, payload)
    },
    // 发布消息
    send: function(err) {
      if (!err) {
        // this.client.publish('HelloWord', 'HelloWord-js')
      }
    },

    tableRowClassName({ row, rowIndex }) {
      if (rowIndex === 0) {
        return 'warning-row'
      } else if (rowIndex === 1) {
        return 'success-row'
      }
      return ''
    },
    // 检测列表是否存在
    isExist(topic) {
      let val = false
      for (let i = 0; i < this.tableData.length; i++) {
        if (topic === this.tableData[i].id) {
          val = true
        }
      }
      return val
    },
    // 更新列表
    update(topic, payload) {
      console.log('刷新')
      // 提取 温度与湿度 信息
      const index = payload.toString().split(',')
      for (let i = 0; i < this.tableData.length; i++) {
        if (topic === this.tableData[i].id) {
          this.tableData[i].humidity = index[0] + '%RH'
          this.tableData[i].temperature = index[1] + '℃'
          this.tableData[i].lately = this.momentDateFormat()
        }
      }
    },
    // 更新数据
    flushTable() {
      temperatureSearch().then(res => this.flushTableUtil(res))
      // axios.get('/mqUserSub').then(res => this.flushTableUtil(res.data))
    },
    flushTableUtil(res) {
      console.log(res)
      const topic = res.data
      console.log(topic)
      for (let i = 0; i < topic.length; i++) {
        // this.w
        this.tableData.push({
          id: topic[i].topic,
          humidity: '暂无数据',
          temperature: '暂无数据',
          lately: '暂无数据'
        })
      }
      // 订阅
      this.serverSubscribe()
    },
    // 添加列表
    add(topic) {
      console.log('添加列表')
      // 订阅
      temperatureAdd(topic).then(res => this.addUtil(res, topic))
      // axios.post('/mqUserSub?topic=' + topic).then()
    },
    addUtil(res, topic) {
      console.log(res)
      if (res.code === 200) {
        // 订阅
        this.client.subscribe(topic)
        this.tableData.push({
          id: topic,
          humidity: '暂无数据',
          temperature: '暂无数据',
          lately: '暂无数据'
        })
      }
    },
    // 配置信息
    open_init() {
      this.$prompt('请输入服务器地址(ip:port)', '配置服务器信息', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /[\s\S]+:[0-9]+/,
        inputErrorMessage: '地址格式不正确'
      }).then(({ value }) => {
        this.serverSet(value)
        // this.client.close()
        this.client.end()
        this.$message({
          type: 'success',
          message: '已添加' + value
        })
        this.initMqtt()
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '取消添加'
        })
      })
    },
    open() {
      this.$prompt('请输入设备id(topic)', '订阅', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(({ value }) => {
        console.log(value)
        console.log(this.isExist(value))
        if (!this.isExist(value)) {
          console.log(value)
          this.add(value)
          this.$message({
            type: 'success',
            message: '已添加' + value
          })
        } else {
          this.$message({
            type: 'error',
            message: '已存在' + value
          })
        }
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '取消添加'
        })
      })
    },
    // 地址解析
    serverSet(addr) {
      const addrs = addr.split(':')
      this.server = addrs[0]
      this.port = addrs[1]
    },
    // 时间生成
    momentDateFormat() {
      return moment().format('YYYY-MM-D HH:mm:ss')
    },
    // 删除表格数据
    delItem(index) {
      temperatureDel(this.tableData[index].id).then(res => this.delItemUtil(res, index))
      // axios.delete('/mqUserSub?topic=' + this.tableData[index].id).then()
    },
    delItemUtil(res, index) {
      if (res.code === 200) {
        console.log(index)
        // this.flushTable()
        this.$message({
          type: 'success',
          message: '已删除' + this.tableData[index].id
        })
        this.tableData.splice(index, 1)
      }
    }
  }
}
</script>

<style scoped>

</style>
