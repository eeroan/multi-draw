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
$(window).bind('orientationchange', function (e) {
  e.preventDefault()
})

var canvas = $('#canvas')
var gameField = canvas.get(0).getContext("2d")
var index = 0
var clearClick = $('#clear').onAsObservable('click')
var shake = $(window).onAsObservable('shake')
clearClick.merge(shake).subscribe(clearGameField)

drawGameField()
initBrowserVersion()
initIpadVersion()

function initIpadVersion() {
  var touchStart = canvas.onAsObservable('touchstart')
  var touchMove = $(document).onAsObservable('touchmove')
  var touchEnd = $(document).onAsObservable('touchend')
  var path = touchStart
    .select(changedTouches)
    .selectMany(function (changedTouches) { return Rx.Observable.fromArray(changedTouches) })
    .selectMany(function (changedTouch) {
      var id = changedTouch.identifier
      var currentPos = coordinates(changedTouch)
      var colorIndex = index++
      drawPath([currentPos, {pageX:currentPos.pageX+1, pageY:currentPos.pageY+1}, colorModulo(colorIndex)])
      return touchMove
        .doAction(preventDefault)
        .select(function (e) {return e.originalEvent.touches})
        .select(function (touches) { return findByIdentifier(touches)[0] })
        .takeUntil(touchEnd.select(changedTouches).where(function (touches) { return findByIdentifier(touches).length > 0 }))
        .select(function (e) {
          var previousPos = $.extend({}, currentPos)
          currentPos = coordinates(e)
          return [previousPos, currentPos, colorModulo(colorIndex)]
        })
        .where(hasChanged)
      function findByIdentifier(touches) { return $.grep(touches, function (touch) { return touch.identifier == id}) }
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

function coordinates(e) { return {pageX:e.pageX, pageY:e.pageY} }

function changedTouches(e) {return e.originalEvent.changedTouches}

function preventDefault(e) { e.preventDefault() }

function drawPath(lineAndColor) {
  var deltaX = lineAndColor[1].pageX - lineAndColor[0].pageX
  var deltaY = lineAndColor[1].pageY - lineAndColor[0].pageY
  var color = lineAndColor[2]
  var length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  var opacity = 1
  var lineWidth = parseInt(20 - length / 4)
  if(lineWidth <= 4) lineWidth = 4
  gameField.lineWidth = lineWidth
  gameField.strokeStyle = hex2rgb(color, opacity)
  gameField.beginPath()
  gameField.moveTo(lineAndColor[0].pageX, lineAndColor[0].pageY)
  gameField.lineTo(lineAndColor[1].pageX, lineAndColor[1].pageY)
  gameField.stroke()
  gameField.closePath()

  function getOpacity(length) {
    var opacity = 1 - length / 20
    return opacity > 0.1 ? opacity : 0.2;
  }
}

function clearGameField() {
  gameField.beginPath()
  gameField.clearRect(0, 0, width, height)
  gameField.closePath()
  drawGameField()
}

function drawGameField() {
  gameField = $.extend(gameField, {strokeStyle:"rgba(0, 0, 0, 1.0)", lineWidth:1, lineCap:"round"})
  gameField = $.extend(gameField, penStyle)
}

function hex2rgb(hex, opacity) {
  var rgb = hex.replace('#', '').match(/(.{2})/g)
  var i = 3
  while(i--) {
    rgb[i] = parseInt(rgb[i], 16)
  }

  if(typeof opacity == 'undefined') {
    return 'rgb(' + rgb.join(', ') + ')'
  }

  return 'rgba(' + rgb.join(', ') + ', ' + opacity + ')'
}