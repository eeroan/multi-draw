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

var touchStart = $('#canvas').toObservable('touchstart')
var touchMove = $(document).toObservable('touchmove')
var touchEnd = $(document).toObservable('touchend')

var move = touchStart
  .SelectMany(function(e) { return Rx.Observable.FromArray(e.originalEvent.changedTouches) })
  .SelectMany(function (changedTouch) {
  var id = changedTouch.identifier
  var oldPos = {pageX:changedTouch.pageX, pageY:changedTouch.pageY}
  return touchMove
    .Do(preventDefault)
    .Select(function(e) {return e.originalEvent.touches})
    .Select(function(touches) {
      var grep = $.grep(touches, function(touch) { return touch.identifier == id})
      return grep[0]
    })
    .TakeUntil(touchEnd.Where(function(e) {
      var touches = e.originalEvent.changedTouches
      var grep = $.grep(touches, function(touch) { return touch.identifier == id})
      return grep.length > 0
    }))
    .Do(function(e) {
      console.log(e)
        gameField.beginPath()
        gameField.moveTo(oldPos.pageX, oldPos.pageY)
        gameField.lineTo(e.pageX, e.pageY)
        gameField.stroke()
        gameField.closePath()
      oldPos = {pageX:e.pageX, pageY:e.pageY}
    })
}).Repeat()

move.Subscribe(function(e) {
//    gameField.lineTo(e.pageX, e.pageY)
//    gameField.stroke()
})
function preventDefault(e) {
  e.preventDefault()
}


function delta(moves) {
  return moves.Zip(moves.Skip(2), tupled)
}

function tupled() {return arguments}

function drawPath(line) {
  //console.log(line)
  gameField.beginPath()
  gameField.moveTo(line[0].pageX, line[0].pageY)
  gameField.lineTo(line[1].pageX, line[1].pageY)
  gameField.stroke()
  gameField.closePath()
}

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
