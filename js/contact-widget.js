// jnbCW — Contact Widget logic, fully namespaced
document.addEventListener('DOMContentLoaded', function () {

  var jnbCW_container = document.getElementById('jnbCW-container');
  var jnbCW_toggleBtn  = document.getElementById('jnbCW-toggle');
  var jnbCW_closeBtn   = document.getElementById('jnbCW-close');

  if (!jnbCW_container || !jnbCW_toggleBtn || !jnbCW_closeBtn) {
    console.warn('jnbCW: widget elements not found in the DOM. Check that the HTML block was pasted correctly.', {
      container: jnbCW_container,
      toggleBtn: jnbCW_toggleBtn,
      closeBtn: jnbCW_closeBtn
    });
    return;
  }

  function jnbCW_open() {
    jnbCW_container.classList.add('jnbCW-open');
  }
  function jnbCW_close() {
    jnbCW_container.classList.remove('jnbCW-open');
  }

  jnbCW_toggleBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    jnbCW_open();
  });

  jnbCW_closeBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    jnbCW_close();
  });

  jnbCW_container.addEventListener('click', function (e) {
    if (jnbCW_container.classList.contains('jnbCW-open')) {
      e.stopPropagation();
    }
  });

  document.addEventListener('click', function () {
    jnbCW_close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') jnbCW_close();
  });

  console.log('jnbCW: widget initialized successfully.');
});