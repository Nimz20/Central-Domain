(function () {
  var links = document.querySelectorAll('link[rel="preload"][as="style"][data-load-css]');

  links.forEach(function (preload) {
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = preload.href;
    document.head.appendChild(stylesheet);
  });
})();
