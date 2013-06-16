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
  var id = $(this).attr('href').substring(1)
  var dataUrl = localStorage.getItem(id)
  $.post("http://eea.kapsi.fi/dataUrl.php", { img: dataUrl.substring(dataUrl.indexOf(',')+1)} );
})
$('.remove').click(function () {
  var id = $(this).attr('href').substring(1)
  localStorage.removeItem(id)
  savedMultiDrawImages.splice(savedMultiDrawImages.indexOf(id), 1)
  localStorage.setItem(key, JSON.stringify(savedMultiDrawImages))
  $(this).parents('.image').remove()
})