var colors = $.map([
  '000000',
  'a52020',
  'd269ee',
  '6495ed',
  '00008b',
  '006400',
  'ff8c00',
  '9932cc',
  '808080',
  '2e8b57'
], function (colorInHex) {return '#' + colorInHex})

var width = 768
var height = 1024
var penStyle = {strokeStyle:"rgba(100, 100, 200, 1.0)", lineWidth:5, lineCap:"round"}
var win = $(window)
win.bind('orientationchange', preventDefault)

var canvas = $('#canvas')
var gameField = $.extend(canvas.get(0).getContext("2d"), penStyle)

var index = 0
var clearButton = $('#clear')
clearButton.onAsObservable('touchmove').subscribe(preventDefault)
var clearClick = clearButton.onAsObservable('click').throttle(100).doAction(preventDefault)
var shake = win.onAsObservable('shake')
clearClick.subscribe(reload)
shake.subscribe(reload)

initBrowserVersion()
initTouchVersion()

function initTouchVersion() {
  var touchStart = canvas.onAsObservable('touchstart')
  var touchMove = $(document).onAsObservable('touchmove')
  var touchEnd = $(document).onAsObservable('touchend')
  var path = touchStart
    .select(movedTouches)
    .selectMany(function (movedTouches) { return Rx.Observable.fromArray(movedTouches) })
    .selectMany(function (movedTouch) {
      var currentPos = coordinates(movedTouch)
      var colorIndex = index++
      drawPath([currentPos, {pageX:currentPos.pageX + 1, pageY:currentPos.pageY + 1}, colorModulo(colorIndex)])
      return touchMove
        .doAction(preventDefault)
        .select(function (e) {return e.originalEvent.touches})
        .select(function (touches) { return  findByIdentifier(touches, true)[0] || reload() })
        .takeUntil(touchEnd.select(movedTouches).where(function (touches) { return findByIdentifier(touches).length > 0 }))
        .select(function (e) {
          var previousPos = $.extend({}, currentPos)
          currentPos = coordinates(e)
          return [previousPos, currentPos, colorModulo(colorIndex)]
        })
        .where(hasChanged)
      function findByIdentifier(touches) { return $.grep(touches, function (touch) { return touch.identifier == movedTouch.identifier}) }
    })
  path.subscribe(drawPath)
}

function initBrowserVersion() {
  var mouseDown = canvas.onAsObservable('mousedown')
  var mouseMove = canvas.onAsObservable('mousemove')
  var mouseUp = canvas.onAsObservable('mouseup')
  var mouseDraw = mouseDown.selectMany(function (e) {
    var colorIndex = index++
    var currentPos = coordinates(e)
    drawPath([coordinates(e), coordinates(e), colorModulo(colorIndex)])
    return mouseMove
      .doAction(preventDefault)
      .takeUntil(mouseUp)
      .select(function (e) {
        var previousPos = $.extend({}, currentPos)
        currentPos = coordinates(e)
        return [previousPos, currentPos, colorModulo(colorIndex)]
      })
  })
  mouseDraw.subscribe(drawPath)
}

function colorModulo(colorIndex) { return colors[colorIndex % colors.length] }

function hasChanged(line) {return line[0].pageX != line[1].pageX || line[0].pageY != line[1].pageY}

function coordinates(e) { return {pageX:e.pageX, pageY:e.pageY, timeStamp:new Date().getTime() } }

function movedTouches(e) {return e.originalEvent.changedTouches}

function preventDefault(e) { e.preventDefault() }

function drawPath(lineAndColor) {
  var deltaX = lineAndColor[1].pageX - lineAndColor[0].pageX
  var deltaY = lineAndColor[1].pageY - lineAndColor[0].pageY
  var color = lineAndColor[2]
  var time = lineAndColor[1].timeStamp - lineAndColor[0].timeStamp
  var length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  var speed = length / time
  var equation = time / length * 5 + 2
  if(equation > 20) equation = 20
  var opacity = 1
  gameField.lineWidth = equation
  gameField.strokeStyle = hex2rgb(color, opacity)
  gameField.beginPath()
  gameField.moveTo(lineAndColor[0].pageX, lineAndColor[0].pageY)
  gameField.lineTo(lineAndColor[1].pageX, lineAndColor[1].pageY)
  gameField.stroke()
  gameField.closePath()
}

function reload() { document.location = document.location.href }

function hex2rgb(hex, opacity) {
  var rgb = hex.replace('#', '').match(/(.{2})/g)
  var i = 3
  while(i--) rgb[i] = parseInt(rgb[i], 16)
  return typeof opacity == 'undefined' ? 'rgb(' + rgb.join(', ') + ')' : 'rgba(' + rgb.join(', ') + ', ' + opacity + ')'
}