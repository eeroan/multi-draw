var width = 768
var height = 1024
var penStyle = {strokeStyle: "rgba(100, 100, 200, 1.0)", lineWidth: 5, lineCap: "round"}
$(window).bind('orientationchange', function(e){
  e.preventDefault()
})

$.fn.moveRelatively = function(pos) {
  var oldX = parseInt(this.css('left'), 10)
  var oldY = parseInt(this.css('top'), 10)
  var css = {left:(oldX + pos[0]) + 'px',top:(oldY + pos[1]) + 'px'}
  this.css(css)
  return this
}

var gameField = $('#canvas').get(0).getContext("2d")
drawGameField()
var pencilDown = startOn($('#canvas'))
var mouseMove = $(document).toObservable('mousemove')
var touchMove = $(document).toObservable('touchmove').Where(notPinch)
mouseMove.Merge(touchMove).Subscribe(preventDefault)
var end = $(document).toObservable('mouseup touchend')
var repeatedMoves = movesAfter(pencilDown).Repeat()

repeatedMoves.Subscribe(drawPath)
var clear = $('#clear').toObservable('click')
clear.Subscribe(clearGameField)

function clearGameField() {
  gameField.beginPath()
  gameField.clearRect(0, 0, width, height)
  gameField.closePath()
  drawGameField()
}
function drawGameField() {
  gameField = $.extend(gameField, {strokeStyle: "rgba(0, 0, 0, 1.0)", lineWidth: 1,lineCap: "round"})
  gameField = $.extend(gameField, penStyle)
}

function movesAfter(startEvent) {
  //TODO needs BufferWithTime or something for making it behave faster
  var move = mouseMove.Merge(touchMove.Select(touchEvent)).Select(mousePosition)
  return delta(move.SkipUntil(startEvent).TakeUntil(end))
}

function delta(moves) {
  return moves.Zip(moves.Skip(1), argumentsAsList)
}

function startOn(container) {
  var mouseDown = container.toObservable('mousedown')
  var touchStart = container.toObservable('touchstart').Where(notPinch)
  return mouseDown.Merge(touchStart)
}

function notPinch(evt) {
  return evt.originalEvent.touches.length == 1
}

function touchEvent(evt) {
  return evt.originalEvent.touches[0]
}

function preventDefault(e) {
  e.preventDefault()
}

function drawPath(line) {
  gameField.beginPath()
  gameField.moveTo.apply(gameField, line[0])
  gameField.lineTo.apply(gameField, line[1])
  gameField.stroke()
  gameField.closePath()
}

function mousePosition(e) {
  if ($(e.target).hasClass('player'))
    return [e.clientX,e.clientY]
  if (e.layerX) return [e.layerX, e.layerY]
  if (e.offsetX) return [e.offsetX, e.offsetY]
  var canvasDom = $('#canvas').get(0)
  return [e.pageX - canvasDom.offsetLeft, e.pageY - canvasDom.offsetTop]
}

function argumentsAsList() {
  return arguments
}
