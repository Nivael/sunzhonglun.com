(function () {
  // 深色模式切换（顶栏与侧栏可能各有一个按钮）
  var updateThemeLabels = function (theme) {
    document.querySelectorAll('.theme-toggle').forEach(function (toggle) {
      toggle.setAttribute('aria-label', toggle.getAttribute(theme === 'dark' ? 'data-label-light' : 'data-label-dark'));
    });
  };
  updateThemeLabels(document.documentElement.getAttribute('data-theme'));
  document.querySelectorAll('.theme-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      updateThemeLabels(next);
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
      // 侧栏（桌面）与页脚（含手机端）同源填充
      document.querySelectorAll('.side-stats, .foot-stats').forEach(function (stats) {
        stats.querySelectorAll('[data-stat]').forEach(function (el) {
          var v = d[el.getAttribute('data-stat')];
          el.textContent = typeof v === 'number' ? v.toLocaleString('zh-Hans-CN') : '–';
        });
        stats.hidden = false;
      });
    }).catch(function () {});
  })();

  // 题图视差：滚动时大图以稍慢速度移动（reduced-motion 下不启用）
  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pFigs = document.querySelectorAll('[data-parallax]');
  if (motionOK && pFigs.length) {
    var ticking = false;
    var parallax = function () {
      ticking = false;
      pFigs.forEach(function (fig) {
        var img = fig.querySelector('img');
        if (!img) return;
        var r = fig.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        // 图心相对视口中心的偏移（-1..1），映射为图高 12% 的反向位移
        var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        img.style.transform = 'translateY(' + (p * r.height * 0.12).toFixed(1) + 'px) scale(1.12)';
      });
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
    }, { passive: true });
    window.addEventListener('resize', parallax);
    parallax();
  }

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
