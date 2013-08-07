var hist = require('../index.js'),
    d3 = require('d3');

var map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
var overlays = L.featureGroup([]).addTo(map);

d3.select(window).on('load', function() {
    var hash = document.location.hash;
    if (hash) {
        var match = /^#\/(node|way|relation)\/(\d*)/.exec(hash);
        if (match) {
            d3.select('#type').property('value', match[1]);
            d3.select('#id').property('value', match[2]);
            clickGo();
        } else {
            document.location.hash = "";
        }
    }
});

function row(field, title, formatter, tag) {
    return function(selection) {
        var prev;

        selection.append('th').attr('class', 'field').text(title || field);

        selection
            .selectAll('td.version')
            .data(function(d) { return d; })
            .enter()
            .append('td')
            .attr('class', function(d) {
                return 'version_cell ' + pClass(tag ? d.tags[field] : d[field]);
            })
            .html(function(d) {
                return (formatter || function(x) { return x; })(tag ? d.tags[field] : d[field]);
            });

        function pClass(val) {
            try {
                if (prev == val)  return 'unchanged';
                else if (!prev && val && val != prev) return 'added';
                else if (prev && !val) return 'removed';
                else if (val && prev != val) return 'changed';
            } finally { prev = val; }
        }
    };
}

d3.select('#go').on('click', clickGo);
d3.select('#id').on('keydown', keyPress);

function keyPress() {
    if (d3.event.keyCode == 13) {
        clickGo();
    }
}

function clickGo() {
    var type = d3.select('#type').property('value'),
        id = +d3.select('#id').property('value');

    console.log("Getting history for " + type + " " + id);
    document.location.hash = "/" + type + "/" + id;

    hist.getObjectHistory(type, id, function(err, objects) {
        if (err) {
            console.log("Could not fetch " + type + " " + id + ": " + err.status);
            return;
        }
        var i, step, key,
            objectTags = {},
            object = objects[type][id];

        d3.select('#history table')
            .remove();

        var table = d3.select('#history')
            .append('table')
            .datum(object);

        table.append('tr').attr('class', 'row_header').call(row('version', 'Version'));
        table.append('tr').call(row('timestamp', 'Time', timeFormat));
        table.append('tr').call(row('changeset', 'Changeset', changesetLink));
        table.append('tr').call(row('user', 'User', userLink));
        table.append('tr')
            .attr('class', 'row_header')
            .append('th')
            .attr('colspan', function(d) { return d.length + 1; })
            .attr('class', 'field')
            .text('Tags');

        object.reduce(function(memo, o) {
            d3.keys(o.tags).forEach(function(s) { memo.add(s); });
            return memo;
        }, d3.set()).forEach(function(tag) {
            table.append('tr').call(row(tag, tag, null, true));
        });

        function timeFormat(d) { return d.format('LLL');  }

        function userLink(d) {
            return '<a target="_blank" href="http://openstreetmap.org/user/' + d + '">' + d + '</a>';
        }

        function changesetLink(d) {
            return '<a target="_blank" href="http://openstreetmap.org/browse/changeset/' + d + '">' + d + '</a>';
        }

        overlays.clearLayers();

        if (type == 'node') {
            for (i = 0; i < object.length; i++) {
                if (object[i].visible) {
                    overlays.addLayer(L.circleMarker([object[i].lat, object[i].lon]));
                }
            }
            map.fitBounds(overlays.getBounds());
            d3.select('#map').style('display', 'block');
            map.invalidateSize();
        } else {
            d3.select('#map').style('display', 'none');
            map.invalidateSize();
        }
    });
}
