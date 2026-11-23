/* Home page intro video. The "Watch how it works" link opens the video in a pop-up and starts it.
   On iPhones the video plays full screen (no playsinline), so captions are big enough to read. Closing the pop-up (Close button, Escape, or a tap outside the video) pauses it.
   Without JavaScript, or in a browser without pop-up support, the link simply opens the video file. */
(function () {
  var link = document.getElementById('intro-watch');
  var dialog = document.getElementById('intro-video-dialog');
  var video = document.getElementById('intro-video');
  var close = document.getElementById('intro-video-close');
  if (!link || !dialog || !video || typeof dialog.showModal !== 'function') return;

  link.addEventListener('click', function (e) {
    e.preventDefault();
    dialog.showModal();
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  });
  close.addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('close', function () { video.pause(); link.focus(); });
  dialog.addEventListener('click', function (e) {
    if (e.target !== dialog) return;
    var r = dialog.getBoundingClientRect();
    var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialog.close();
  });
})();
