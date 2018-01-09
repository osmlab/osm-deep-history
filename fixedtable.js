// From https://github.com/kevkan/fixed-table

function fixTable(container) {
    // Store references to table elements
    var thead = container.querySelector('thead');
    var tbody = container.querySelector('tbody');

    // Style container
    container.style.overflow = 'auto';
    container.style.position = 'relative';

    // Add inline styles to fix the header row and leftmost column
    function relayout() {
      var ths = [].slice.call(thead.querySelectorAll('th'));
      var tbodyTrs = [].slice.call(tbody.querySelectorAll('tr'));

      /**
       * Remove inline styles so we resort to the default table layout algorithm
       * For thead, th, and td elements, don't remove the 'transform' styles applied
       * by the scroll event listener
       */
      tbody.setAttribute('style', '');
      thead.style.width = '';
      thead.style.position = '';
      thead.style.top = '';
      thead.style.left = '';
      thead.style.zIndex = '';
      ths.forEach(function(th) {
        th.style.display = '';
        th.style.width = '';
        th.style.position = '';
        th.style.top = '';
        th.style.left = '';
      });
      tbodyTrs.forEach(function(tr) {
        tr.setAttribute('style', '');
      });
      [].slice.call(tbody.querySelectorAll('td'))
        .forEach(function(td) {
          td.style.width = '';
          td.style.position = '';
          td.style.left = '';
        });

      /**
       * Store width and height of each th
       * getBoundingClientRect()'s dimensions include paddings and borders
       */
      var thStyles = ths.map(function(th) {
        var rect = th.getBoundingClientRect();
        var style = document.defaultView.getComputedStyle(th, '');
        return {
          boundingWidth: rect.width,
          boundingHeight: rect.height,
          width: parseInt(style.width, 10),
          paddingLeft: parseInt(style.paddingLeft, 10)
        };
      });

      // Set widths of thead and tbody
      var totalWidth = thStyles.reduce(function(sum, cur) {
        return sum + cur.boundingWidth;
      }, 0);
      tbody.style.display = 'block';
      tbody.style.width = totalWidth + 'px';
      thead.style.width = totalWidth - thStyles[0].boundingWidth + 'px';

      // Position thead
      thead.style.position = 'absolute';
      thead.style.top = '0';
      thead.style.left = thStyles[0].boundingWidth + 'px';
      thead.style.zIndex = 10;

      // Set widths of the th elements in thead. For the fixed th, set its position
      ths.forEach(function(th, i) {
        th.style.width = thStyles[i].width + 'px';
        if (i === 0) {
          th.style.position = 'absolute';
          th.style.top = '0';
          th.style.left = -thStyles[0].boundingWidth + 'px';
        }
      });

      // Set margin-top for tbody - the fixed header is displayed in this margin
      tbody.style.marginTop = thStyles[0].boundingHeight + 'px';

      // Set widths of the td elements in tbody. For the fixed td, set its position
      tbodyTrs.forEach(function(tr, i) {
        tr.style.display = 'block';
        tr.style.paddingLeft = thStyles[0].boundingWidth + 'px';
        [].slice.call(tr.querySelectorAll('td'))
          .forEach(function(td, j) {
            td.style.width = thStyles[j].width + 'px';
            if (j === 0) {
              td.style.position = 'absolute';
              td.style.left = '0';
            }
          });
      });
    }

    // Initialize table styles
    relayout();

    // Update table cell dimensions on resize
    window.addEventListener('resize', resizeThrottler, false);
    var resizeTimeout;
    function resizeThrottler() {
      if (!resizeTimeout) {
        resizeTimeout = setTimeout(function() {
          resizeTimeout = null;
          relayout();
        }, 500);
      }
    }

    // Fix thead and first column on scroll
    container.addEventListener('scroll', function() {
      thead.style.transform = 'translate3d(0,' + this.scrollTop + 'px,0)';
      var hTransform = 'translate3d(' + this.scrollLeft + 'px,0,0)';
      thead.querySelector('th').style.transform = hTransform;
      [].slice.call(tbody.querySelectorAll('tr > td:first-child'))
        .forEach(function(td, i) {
          td.style.transform = hTransform;
        });
    });

    /**
     * Return an object that exposes the relayout function so that we can
     * update the table when the number of columns or the content inside columns changes
     */
    return {
      relayout: relayout
    };
  }

  module.exports = fixTable;