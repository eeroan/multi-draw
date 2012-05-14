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
var clearClick = $('#clear').toObservable('click')
var shake = $(window).toObservable('shake')
clearClick.Merge(shake).Subscribe(clearGameField)

drawGameField()
initBrowserVersion()
initIpadVersion()

function initIpadVersion() {
  var touchStart = canvas.toObservable('touchstart')
  var touchMove = $(document).toObservable('touchmove')
  var touchEnd = $(document).toObservable('touchend')
  var path = touchStart
    .Select(changedTouches)
    .SelectMany(function (changedTouches) { return Rx.Observable.FromArray(changedTouches) })
    .SelectMany(function (changedTouch) {
      var id = changedTouch.identifier
      var currentPos = coordinates(changedTouch)
      var colorIndex = index++
      return touchMove
        .Do(preventDefault)
        .Select(function (e) {return e.originalEvent.touches})
        .Select(function (touches) { return findByIdentifier(touches)[0] })
        .TakeUntil(touchEnd.Select(changedTouches).Where(function (touches) { return findByIdentifier(touches).length > 0 }))
        .Select(function (e) {
          var previousPos = $.extend({}, currentPos)
          currentPos = coordinates(e)
          return [previousPos, currentPos, colorModulo(colorIndex)]
        })
        .Where(hasChanged)
      function findByIdentifier(touches) { return $.grep(touches, function (touch) { return touch.identifier == id}) }
    })
  path.Subscribe(drawPath)
}

function initBrowserVersion() {
  var mouseDown = canvas.toObservable('mousedown')
  var mouseMove = canvas.toObservable('mousemove')
  var mouseUp = canvas.toObservable('mouseup')
  var mouseDraw = mouseDown.SelectMany(function (e) {
    var colorIndex = index++
    var currentPos = coordinates(e)
    return mouseMove
      .Do(preventDefault)
      .TakeUntil(mouseUp)
      .Select(function (e) {
        var previousPos = $.extend({}, currentPos)
        currentPos = coordinates(e)
        return [previousPos, currentPos, colorModulo(colorIndex)]
      })
  })
  mouseDraw.Subscribe(drawPath)
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
  var lineWidth = parseInt(10 - length / 3)
  if(lineWidth <= 2) lineWidth = 2
  gameField.lineWidth = lineWidth
  gameField.strokeStyle = color
  gameField.beginPath()
  gameField.moveTo(lineAndColor[0].pageX, lineAndColor[0].pageY)
  gameField.lineTo(lineAndColor[1].pageX, lineAndColor[1].pageY)
  gameField.stroke()
  gameField.closePath()
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
