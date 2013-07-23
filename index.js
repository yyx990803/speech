var Emitter = require('emitter')

function Speech (options) {

    // default options
    this.options = {
        debugging: false,
        continuous: false,
        interimResults: false,
        autoRestart: false
    }

    // merge user options
    if (Object.prototype.toString.call(options) === '[object Object]') {
        for (var op in options) {
            this.options[op] = options[op]
        }
    }

    this.active         = false
    this.manualStopped  = false
    this.history        = []
    this.lastIndex      = -1
    this.lastResult     = ''
    this.recognition    = new webkitSpeechRecognition()

    var rec = this.recognition,
        self = this

    rec.continuous = self.options.continuous
    rec.interimResults = self.options.interimResults
    if (options.lang) rec.lang = options.lang

    rec.onstart = function () {
        self.active = true
        this.manualStopped = false
        self.emit('start')
    }

    rec.onresult = function (e) {
        if (!e.results || !e.results.length) return

        var updatedResult = e.results[e.resultIndex],
            transcript = updatedResult[0].transcript.replace(/^\s*/, '')

        // new sentence?
        if (e.resultIndex !== self.lastIndex) {
            self.lastIndex = e.resultIndex
            self.lastResult = ''
        }

        // avoid some redundancy
        if (transcript === self.lastResult && !updatedResult.isFinal) return
        if (transcript.length < self.lastResult.length) return

        self.lastResult = transcript

        if (updatedResult.isFinal) {
            // final sentence! we can do work!
            self.history.push(transcript)
            self.emit('finalResult', transcript)
        } else {
            // interim, let's update stuff on screen
            self.emit('interimResult', transcript)
        }
        
        if (self.options.debugging) {
            console.log(transcript + (updatedResult.isFinal ? ' (final)' : ''))
        }
    }

    rec.onerror = function (e) {
        self.emit('error', e)
    }

    rec.onend = function () {
        self.active = false
        self.history    = []
        self.lastIndex  = -1
        self.lastResult = ''
        self.emit('end')
        if (self.options.autoRestart && !self.manualStopped) {
            self.start()
        }
    }

    Emitter(this)

}

Speech.prototype.start = function () {
    if (this.active) return
    this.recognition.start()
}

Speech.prototype.stop = function () {
    if (!this.active) return
    this.manualStopped = true
    this.recognition.stop()
}

module.exports = Speech