
(function () {
  "use strict";

  var lastPageLoadTime = Date.now();
  var pageLoadCount = 0;

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      var timeSinceLastLoad = Date.now() - lastPageLoadTime;
      if (timeSinceLastLoad < 3000) {
        pageLoadCount++;
        if (pageLoadCount > 2) {
          console.warn('⚠️  Detected rapid page reloads! This might indicate an auto-refresh loop.');
          pageLoadCount = 0;
        }
      } else {
        pageLoadCount = 0;
      }
      lastPageLoadTime = Date.now();
    }
  });

  var originalSetInterval = window.setInterval;
  var suspiciousIntervalCount = 0;

  window.setInterval = function (callback, delay) {
    if (delay && delay < 1000 && delay > 0) {
      suspiciousIntervalCount++;
      if (suspiciousIntervalCount <= 3) {
        console.warn('⚠️  Interval detected:', delay, 'ms. Stack:', new Error().stack.split('\n')[2]);
      }
    }
    return originalSetInterval.apply(this, arguments);
  };

  console.log('✅ Auto-refresh safety monitor enabled - watching for refresh loops');
})();

