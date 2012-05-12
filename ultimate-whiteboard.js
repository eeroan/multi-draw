document.title = 0
Rx.Observable.prototype.SmartThrottle = function (ms) {
  return this.BufferWithTime(ms)
    .Where(function (arr) {return arr.length > 0})
    .Select(function (arr) {return arr[arr.length - 1]})
}
var width = 768
var height = 1024
var penStyle = {strokeStyle:"rgba(100, 100, 200, 1.0)", lineWidth:5, lineCap:"round"}
$(window).bind('orientationchange', function (e) {
  e.preventDefault()
})

var gameField = $('#canvas').get(0).getContext("2d")
drawGameField()

var touchStart = $('#canvas').toObservable('touchstart')
var touchMove = $(document).toObservable('touchmove')
var touchEnd = $(document).toObservable('touchend')
var clearClick = $('#clear').toObservable('click')

var path = touchStart
  .Select(changedTouches)
  .SelectMany(function (changedTouches) { return Rx.Observable.FromArray(changedTouches) })
  .SelectMany(function (changedTouch) {
    var id = changedTouch.identifier
    var currentPos = coordinates(changedTouch)
    return touchMove
      .Do(preventDefault)
      //.SmartThrottle(20)
      .Select(function (e) {return e.originalEvent.touches})
      .Select(function (touches) { return findByIdentifier(touches)[0] })
      .TakeUntil(touchEnd.Select(changedTouches).Where(function (touches) { return findByIdentifier(touches).length > 0 }))
      .Select(function (e) {
        var previousPos = $.extend({}, currentPos)
        currentPos = coordinates(e)
        return [previousPos, currentPos]
      })
      .Where(hasChaged)
    function findByIdentifier(touches) { return $.grep(touches, function (touch) { return touch.identifier == id}) }
  })

path.Subscribe(drawPath)

clearClick.Subscribe(clearGameField)

function hasChaged(line) {return line[0].pageX != line[1].pageX || line[0].pageY != line[1].pageY}

function coordinates(e) { return {pageX:e.pageX, pageY:e.pageY} }

function changedTouches(e) {return e.originalEvent.changedTouches}

function preventDefault(e) { e.preventDefault() }

function drawPath(line) {
  var deltaX = line[1].pageX - line[0].pageX
  var deltaY = line[1].pageY - line[0].pageY
  var length = parseInt(Math.sqrt(deltaX * deltaX + deltaY * deltaY))
  var lineWidth = parseInt(10 - length / 3)
  if(lineWidth <= 0) lineWidth = 1
  gameField.lineWidth = lineWidth
  gameField.beginPath()
  gameField.moveTo(line[0].pageX, line[0].pageY)
  gameField.lineTo(line[1].pageX, line[1].pageY)
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
