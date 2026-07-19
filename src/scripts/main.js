(function () {
  // 深色模式切换（顶栏与侧栏可能各有一个按钮）
  document.querySelectorAll('.theme-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  });

  // 滚动渐现
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // 访问统计：每页上报一次；侧栏存在占位元素时填充显示（PRD §7.5）
  (function () {
    var day = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10); // 东八区
    var isNew = false;
    try { isNew = localStorage.getItem('uv-day') !== day; } catch (e) {}
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newVisitor: isNew }),
      keepalive: true,
    }).then(function (r) {
      return r.ok ? r.json() : null;
    }).then(function (d) {
      if (!d || !d.ok) return;
      // 上报成功才写去重标记，失败则下次仍按新访客上报
      if (isNew) { try { localStorage.setItem('uv-day', day); } catch (e) {} }
      var stats = document.querySelector('.side-stats');
      if (!stats) return;
      stats.querySelectorAll('[data-stat]').forEach(function (el) {
        var v = d[el.getAttribute('data-stat')];
        el.textContent = typeof v === 'number' ? v.toLocaleString('zh-Hans-CN') : '–';
      });
      stats.hidden = false;
    }).catch(function () {});
  })();

  // 文章页阅读进度条
  var bar = document.querySelector('.progress__bar');
  var content = document.querySelector('.post-content');
  if (bar && content) {
    var onScroll = function () {
      var rect = content.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var passed = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      bar.style.transform = 'scaleX(' + (total > 0 ? passed / total : 1) + ')';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } else if (bar) {
    bar.parentNode.style.display = 'none';
  }
})();
