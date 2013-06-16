var key = 'savedMultiDrawImages'
var savedMultiDrawImages = JSON.parse(localStorage.getItem(key)) || []
$('#gallery').html($.map(savedMultiDrawImages,function (id) {
  var dataURL = localStorage.getItem(id)
  return '<div class="image"><a class="imageLink" href="' + dataURL + '" target="_blank"><img src="' + dataURL + '"/></a>' +
    '<a class="remove" href="#' + id + '">X</a>' +
    '<a class="save" href="#' + id + '">save</a>' +
    '</div>'
}).join(''))
$('.save').click(function () {
  var id = hash(this)
  var dataUrl = localStorage.getItem(id)
  dataUrl = dataUrl.substring(dataUrl.indexOf(',') + 1)
  var password = localStorage.getItem('img-pwd')
  post(password || promptPwd())
  function post(password) {
    return $.post("http://eea.kapsi.fi/dataUrl.php", {
      img     : dataUrl,
      password: password,
      id      : id
    })//.fail(function () { post(promptPwd()) })
  }

  function promptPwd() {
    var password = prompt('Enter the password for image server')
    localStorage.setItem('img-pwd', password)
    return password
  }
})

$('.remove').click(function () {
  var id = hash(this)
  localStorage.removeItem(id)
  savedMultiDrawImages.splice(savedMultiDrawImages.indexOf(id), 1)
  localStorage.setItem(key, JSON.stringify(savedMultiDrawImages))
  $(this).parents('.image').remove()
})

function hash(elem) {return $(elem).attr('href').substring(1) }