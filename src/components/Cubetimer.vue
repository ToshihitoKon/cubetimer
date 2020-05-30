<template>
 <div
   class="fullheight fullwidth"
    v-bind:class="stateClass"
   >
    <div class="container pt-4">
      <div
        style="min-height: 100px">
        <div
          v-if="displayScramble"
          class="card">
          <h5 class="text-dark text-center my-2 select-none">
            {{ currentScramble }}th
          </h5>
          <h4 class="text-dark text-center my-2 select-none">
            {{ scrambles[currentScramble-1] }}
          </h4>
        </div>
      </div>
      <h3 class="text-dark text-center select-none">
        {{ stateToString( currentState ) }}
      </h3>
      <h1 class="text-dark text-center select-none">
        {{ display }}
      </h1>
      <div
        v-if="displayScramble"
        class="text-center">
        <div>
          <div class="btn-group mt-2">
            <button type="button" v-on:click="setPenalty" class="btn btn-light ignore-press-timer select-none">+2</button>
            <button type="button" v-on:click="setDNF" class="btn btn-light ignore-press-timer select-none">DNF</button>
            <button type="button" v-on:click="cancelLastTime" class="btn btn-light ignore-press-timer select-none">ひとつ戻る</button>
          </div>
        </div>
        <div class="card mt-4">
          <div class="card-body">
            <span
              class="select-none"
              v-for="(time,index) in times"
              v-bind:key="index"
              >
              {{ index + 1 }}: {{ timeToResultText(time) }}<br>
            </span>
            <div v-if="isAfter5">
              Avg of 5: {{ toDisplayTime(ao5) }}
            </div>
          </div>
        </div>
        <div class="input-group mt-4" v-if="isAfter5">
          <textarea v-model="resultText" id="result" class="form-control ignore-press-timer" style="white-space: pre" />
          <div class="input-group-prepend">
            <button type="button" v-on:click="copyResult" class="btn btn-info ignore-press-timer">結果をｺﾎﾟｲｰ</button>
          </div>
        </div>
      </div>
    </div>
 </div>
</template>

<script>

export default {
  data: function() {
    return {
      scrambles: [],
      times: [],
      currentTimerProps: {
        startAt: 0,
        stopAt: 0,
        isDNF: false,
        isPenalty: false
      },
      keyDownState: 0,
      keyUpState: 0,
      currentScramble: 1,
      currentInspectTimer: {},
      now: 0,
      resultText: ''
    }
  },
  computed: {
    currentState: function() {
      return this.keyDownState + this.keyUpState
    },
    displayScramble: function() {
      switch (this.currentState) {
      case 0:
      case 1:
      case 5:
      case 6:
        return true
      }
      return false
    },
    display: function () {
      switch (this.currentState) {
      case 2:
      case 3:
        return  this.toDisplayTime( 15000 - (this.now - this.currentInspectTimer.startAt) )
      case 4:
        return this.toDisplayTime( this.now - this.currentTimerProps.startAt )
      case 5:
      case 6:
        return this.toDisplayTime( this.currentTimerProps.stopAt - this.currentTimerProps.startAt )
      default:
        return this.stateToString(this.currentState)
      }
    },
    ao5: function() {
      if (this.times.length < 5) {
        return
      }
      const times = this.times.slice(0,5)
      const num = times
        .sort((a,b)=>{return this.timeToResultTime(a) - this.timeToResultTime(b)})
        .slice(1,4)
        .reduce((a,b)=>{return a + this.timeToResultTime(b)}, 0)
      console.log(num)
      return num / 3
    },
    stateClass: function () {
      return this.stateToString(this.currentState)
    },
    isAfter5: function() {
      return this.times.length >= 5
    }
  },
  mounted () {
    this.setTitle(),
    this.watchNowLoop(),
    this.setScramble(),
    this.setKeyboardHandler(),
    this.setTouchHandler()
  },
  methods:{
    // mount時設定
    setTitle: function() {
      document.title = "史上最強タイマー"
    },
    watchNowLoop: function() {
      window.requestAnimationFrame(this.watchNowLoop)
      this.watchNow()
    },
    watchNow: function () {
      this.now = Date.now()
    },
    setKeyboardHandler: function() {
      window.addEventListener('keydown', this.pressTimer)
      window.addEventListener('keyup', this.pressTimer)
    },
    setTouchHandler: function() {
      window.addEventListener('touchstart',this.pressTimer, false)
      window.addEventListener('touchend',this.pressTimer, false)
    },
    setScramble: function() {
      this.scrambles = [
        this.$route.query.scr1,
        this.$route.query.scr2,
        this.$route.query.scr3,
        this.$route.query.scr4,
        this.$route.query.scr5
      ]
    },

    // 本操作
    pressTimer: function (e) {
      // ignore-press-timerクラスが付いてるものをタップした時は無視
      if (e.target.classList.contains('ignore-press-timer')) return

      switch (e.type) {
        case 'keydown':
          if ( e.code != 'Space' || e.repeat ) return
          this.downTimer(e)
          break
        case 'keyup':
          this.upTimer(e)
          break
        case 'touchstart':
          if ( e.touches.length != 1 ) return
          this.downTimer(e)
          break
        case 'touchend':
          if ( e.touches.length != 0 ) return
          this.upTimer(e)
          break
        default:
          return
      }
    },
    downTimer: function (e) {
      // ignore-press-timerクラスが付いてるものをタップした時は無視
      if (e.target.classList.contains('ignore-press-timer')) return

      if (this.keyUpState == this.keyDownState) {
        if (this.keyDownState == 3) {
          this.keyDownState = this.keyUpState = 0
        }
        this.keyDownState += 1
      }

      this.currentState = this.keyUpState + this.KeyDownState
      this.actionTimer(this.keyUpState + this.keyDownState)
    },
    upTimer: function (e) {
      // ignore-press-timerクラスが付いてるものをタップした時は無視
      if (e.target.classList.contains('ignore-press-timer')) return

      this.keyUpState = this.keyDownState

      this.currentState = this.keyUpState + this.keyDownState
      this.actionTimer(this.keyUpState + this.keyDownState)
    },
    actionTimer: function(state) {
      switch (state) {
      case 2: // inspect
        this.startInspection()
        break;
      case 4: // solving
        this.startTimer()
        break;
      case 5:  // result
        this.stopTimer()
        break;
      }
    },

    // actions
    startTimer: function () {
      const timer = this.currentTimerProps
      timer.startAt = Date.now()
      this.currentTimerProps = timer
    },
    stopTimer: function () {
      const timer = this.currentTimerProps
      timer.stopAt = Date.now()
      this.currentTimerProps = timer

      const times = this.times
      times.push({
        time: timer.stopAt - timer.startAt, 
        isDNF: timer.isDNF,
        isPenalty: timer.isPenalty,
      })
      this.times = times
      this.setResultText()

      this.currentScramble += 1
    },
    startInspection: function () {
      const timer = this.currentInspectTimer
      timer.startAt = Date.now()
      this.currentInspectTimer = timer
      this.resetCurrentTimer()
    },
    setDNF: function() {
      const timer = this.currentTimerProps
      timer.isDNF = true
      this.updateCurrentTimer(timer)
    },
    setPenalty: function() {
      const timer = this.currentTimerProps
      timer.isPenalty = true
      this.updateCurrentTimer(timer)
    },
    cancelLastTime: function() {
      if (window.confirm('直前の記録を削除します。よろしいですか？')) {
        if(1 < this.currentScramble){
          this.currentScramble -= 1
        }
        var times = this.times
        times.splice(this.currentScramble - 1, 1)
        this.times = times
      }
    },

    // filtersみたいなやつら
    stateToString: function (state) {
      switch(state) {
      case 0:
      case 1:
        return 'standby'
      case 2:
      case 3:
        return 'inspection'
      case 4:
        return 'solving'
      case 5:
      case 6:
      case 7:
        return 'result'
      default:
       return 'unknown'
      }
    },
    timeToResultTime: function(time) {
      if(time.isDNF) return 99999999999
      if(time.isPenalty) return time.time + 2000
      return time.time
    },
    timeToResultText: function(time) {
      if(time.isDNF) return 'DNF'
      if(time.isPenalty) return this.toDisplayTime(time.time + 2000) + '+'
      return this.toDisplayTime(time.time)
    },
    toDisplayTime: function(msec) {
      return ( msec / 1000 ).toFixed(2)
    },

    // utils
    setResultText: function() {
      var text = ''
      this.times.slice(0,5).map((a, index)=>{
        text += (index+1) + ': ' + this.timeToResultText(a) + '\n'
      })
      text += '\nAvg of 5: ' + this.toDisplayTime(this.ao5)
      this.resultText = text
    },
    copyResult: function() {
      const result = document.getElementById('result')
      result.select()
      document.execCommand('copy')
    },
    updateCurrentTimer: function(timer){
      this.currentTimerProps = timer

      if(this.times.length != 0){ 
        const times = this.times
        times.pop()
        times.push({
          time: timer.stopAt - timer.startAt, 
          isDNF: timer.isDNF,
          isPenalty: timer.isPenalty
        })
        this.times = times
      }
      this.setResultText()
    },
    resetCurrentTimer: function() {
      this.currentTimerProps = {
        startAt: 0,
        stopAt: 0,
        isDNF: false,
        isPenalty: false,
      }
    }
  }
}

</script>

<style>
.fullheight {
  height: 100%
}

.select-none {
  user-select: none
}

.standby {
  background: #dff
}

.inspection {
  background: #ffd
}

.solving {
  background: #fdd
}

.result {
  background: #dff
}
</style>
