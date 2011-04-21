var width = 370
var height = 230 * 2 + 640
var endZone = 230
var brick = 410
var numberOfPlayers = 7
var penStyle = {strokeStyle: "rgba(100, 100, 200, 1.0)", lineWidth: 5, lineCap: "round"}
$.fn.moveRelatively = function(pos) {
  var oldX = parseInt(this.css('left'), 10)
  var oldY = parseInt(this.css('top'), 10)
  var css = {left:(oldX + pos[0]) + 'px',top:(oldY + pos[1]) + 'px'}
  this.css(css)
  return this
}

var gameField = $('#canvas').get(0).getContext("2d")
drawGameField()
createPlayers()
var pencilDown = startOn($('#canvas'))
var mouseMove = $(document).toObservable('mousemove')
var touchMove = $(document).toObservable('touchmove').Where(notPinch)
mouseMove.Merge(touchMove).Subscribe(preventDefault)
var startMovingPlayer = startOn($('.player')).Select(eventTarget)
var end = $(document).toObservable('mouseup touchend')
var endStatus = end.Select(mousePosition)
var repeatedMoves = movesAfter(pencilDown).Repeat()
var movesWithMouseUp = repeatedMoves.Merge(endStatus)
var lastVector = movesWithMouseUp.Zip(movesWithMouseUp.Skip(5), argumentsAsList).Where(function(evt) {return !isNaN(evt[1][0]) }).Select(function(evt){return [evt[0][0], evt[1]]}).Select(function(e) {
  var v = { x1 : e[0][0], y1 : e[0][1], x2 : e[1][0], y2 : e[1][1] }
  v._x = v.x2 - v.x1
  v._y = v.y2 - v.y1
  v.l = Math.sqrt(v._x * v._x + v._y * v._y) / 10
  return v
})
var arrow = lastVector.Select(function(v) {
  with (v) {
    return [ [x2,y2], [x2 + (-_x + _y) / l | 0,y2 + (-_y - _x) / l | 0] ]
  }
})
  .Merge(lastVector.Select(function(v) {
  with (v) {
    return [ [x2,y2], [x2 + (-_x - _y) / l | 0,y2 + (-_y + _x) / l | 0] ]
  }
}))
repeatedMoves.Merge(arrow).Subscribe(drawPath)

startMovingPlayer.CombineLatest(movesAfter(startMovingPlayer).Select(asDelta).Repeat(), argumentsAsList).Subscribe(movePlayer)
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
  var center = width/2
  var x = 5
  drawPath([ [0,endZone], [width,endZone] ])
  drawPath([ [0,height - endZone], [width,height - endZone] ])
  drawPath([[center-x,brick-x],[center+x,brick+x]])
  drawPath([[center-x,brick+x],[center+x,brick-x]])
  drawPath([[center-x,height-brick-x],[center+x,height-brick+x]])
  drawPath([[center-x,height-brick+x],[center+x,height-brick-x]])
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

function createPlayers() {
  for (var i = 0; i < numberOfPlayers; i++) {
    $('body').append($('<div class="player"></div>'))
  }
  $('.player').each(function(i) {
    if (i < 3) {
      $(this).moveRelatively([i * 100 + 80,250])
    } else {
      $(this).moveRelatively([(width - 10) / 2, 40 * i + 300])
    }
  })
}
