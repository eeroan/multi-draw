var key = 'savedMultiDrawImages'
var savedMultiDrawImages = JSON.parse(localStorage.getItem(key)) || []
$('#gallery').html($.map(savedMultiDrawImages,function (id) {
  var dataURL = localStorage.getItem(id)
  return '<div class="image"><a class="imageLink" href="' + dataURL + '"><img src="' + dataURL + '"/></a>' +
    idLink('remove', 'X') +
    idLink('save', 'save') +
    '</div>'
  function idLink(className, label) { return '<a class="' + className + '" href="#' + id + '">' + label + '</a>' }
}).join(''))
$('.save').click(function (e) {
  e.preventDefault()
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
    })
      .done(function() {console.log('done',this, arguments)})
      .fail(function () {
        console.log('fail',this, arguments)
        //post(promptPwd())
      })
  }

  function promptPwd() {
    var password = prompt('Enter the password for image server')
    localStorage.setItem('img-pwd', password)
    return password
  }
})

$('.remove').click(function (e) {
  e.preventDefault()
  var id = hash(this)
  localStorage.removeItem(id)
  savedMultiDrawImages.splice(savedMultiDrawImages.indexOf(id), 1)
  localStorage.setItem(key, JSON.stringify(savedMultiDrawImages))
  $(this).parents('.image').remove()
})

function hash(elem) {return $(elem).attr('href').substring(1) }