var field = {
  width: 370,
  height: 230 * 2 + 640
}
var numberOfPlayers = 7
var penStyle = {strokeStyle: "rgba(0, 0, 200, 1.0)", lineWidth: 5, lineCap: "round"}
$.fn.moveRelatively = function(pos) {
  var deltaX = pos[0]
  var deltaY = pos[1]
  var oldX = parseInt(this.css('left'), 10)
  var oldY = parseInt(this.css('top'), 10)
  var css = {left:(oldX + deltaX) + 'px',top:(oldY + deltaY) + 'px'}
  this.css(css)
  return this
}

var gameField = $.extend($('#canvas').get(0).getContext("2d"), penStyle)
drawField()
createPlayers()
var pencilDown = startOn($('#canvas'))
var mouseMove = $(document).toObservable('mousemove')
var touchMove = $(document).toObservable('touchmove').Where(notPinch)
mouseMove.Merge(touchMove).Subscribe(preventDefault)
var startMovingPlayer = startOn($('.player')).Select(eventTarget)
movesAfter(pencilDown).Repeat().Subscribe(drawPath)
startMovingPlayer.CombineLatest(movesAfter(startMovingPlayer).Select(asDelta).Repeat(), argumentsAsList).Subscribe(movePlayer)
var clear = $('#clear').toObservable('click')
clear.Subscribe(clearGameField)

function clearGameField() {
  gameField.beginPath()
  gameField.clearRect(0, 0, field.width, field.height)
  gameField.closePath()
  drawField()
}
function drawField() {
  gameField = $.extend(gameField, {strokeStyle: "rgba(0, 0, 0, 1.0)", lineWidth: 1,lineCap: "round"})
  drawPath([
    [0,230],
    [370,230]
  ])
  drawPath([
    [0,1100 - 230],
    [370,1100 - 230]
  ])
  gameField = $.extend(gameField, penStyle)
}

function movesAfter(startEvent) {
  var end = $(document).toObservable('mouseup touchend')
  var move = mouseMove.Merge(touchMove.Select(touchEvent)).Select(point)
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

function eventTarget(e) {
  return $(e.target)
}

function drawPath(line) {
  gameField.beginPath()
  gameField.moveTo.apply(gameField, line[0])
  gameField.lineTo.apply(gameField, line[1])
  gameField.stroke()
  gameField.closePath()
}

function asDelta(oldAndNew) {
  var oldPoint = oldAndNew[0]
  var newPoint = oldAndNew[1]
  return [(newPoint[0] - oldPoint[0]),(newPoint[1] - oldPoint[1])]
}

function movePlayer(playerAndDelta) {
  playerAndDelta[0].moveRelatively(playerAndDelta[1])
}

function point(e) {
  return [e.clientX,e.clientY]
  /*
   if (e.layerX) return [e.layerX, e.layerY]
   if (e.offsetX) return [e.offsetX, e.offsetY]
   return [e.pageX - canvasDom.offsetLeft, e.pageY - canvasDom.offsetTop]
   */
}

function argumentsAsList() {
  return arguments
}

function createPlayers() {
  for (var i = 0; i < numberOfPlayers; i++) {
    $('body').append($('<div class="player"></div>'))
  }
  $('.player').each(function(i) {
    if (i < 3) {
      $(this).moveRelatively([i * 100 + 80,250])
    } else {
      $(this).moveRelatively([(field.width - 10) / 2, 40 * i + 300])
    }
  })

}
