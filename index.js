const d3 = require('d3');
const _ = require('lodash');
const hist = require('./osmhistory');

const googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});
const osmTile = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
const baseMaps = {
    "OpenStreetMap": osmTile,
    "Google Satellite": googleSat
};

const map = L.map('map', { layers: [osmTile] }).setView([51.505, -0.09], 13);
L.control.layers(baseMaps).addTo(map);

const overlays = L.featureGroup([]).addTo(map);

d3.select(window).on('load', function () {
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

d3.select('#go').on('click', clickGo);
d3.select('#id').on('keydown', keyPress);

// --------------------------------------------------

function displayStatus(msg) {
    d3.select('#status').html(msg);
}

function keyPress() {
    if (d3.event.keyCode == 13) {
        clickGo();
    }
}

function clickGo() {
    displayStatus('Loading...');
    overlays.clearLayers();

    const type = d3.select('#type').property('value');
    const id = +d3.select('#id').property('value');

    document.location.hash = "/" + type + "/" + id;

    hist.getObjectHistory(type, id)
        .then(show)
        .catch(err => {
            console.log(err);
            if (err.status && err.status === 404) {
                displayStatus('Object does not exist');
            } else {
                displayStatus('Error occurred');
            }
        });
}

function show(object, more) {
    if (!more) {
        showTable(object);
    };
    hideShowMoreButton();
    showMap(object, more)
        .then(mapStatusChanged)
        .catch(console.log);
}

function row(field, title, formatter, tag) {
    return function (selection) {
        var prev;

        selection.append('th').attr('class', 'field').text(title || field);

        selection
            .selectAll('td.version')
            .data(_.identity)
            .enter()
            .append('td')
            .attr('class', function (d) {
                const changeStatus =
                    (field === 'version' && !d.visible) ?
                        'version_cell removed' : pClass(tag ? d.tags[field] : d[field]);
                return `version_cell ${changeStatus} version_${d.version}`;
            })
            .html(function (d) {
                return (formatter || _.identity)(tag ? d.tags[field] : d[field]);
            });

        function pClass(val) {
            try {
                if (prev == val) return 'unchanged';
                else if (!prev && val && val != prev) return 'added';
                else if (prev && !val) return 'removed';
                else if (val && prev != val) return 'changed';
            } finally { prev = val; }
        }
    };
}

function userLink(d) {
    return '<a target="_blank" href="//openstreetmap.org/user/' + d + '">' + d + '</a>';
}

function changesetLink(d) {
    return '<a target="_blank" href="https://osmcha.mapbox.com/changesets/' + d + '">' + d + '</a>';
}

function showTable(object) {
    d3.select('#history table')
        .remove();

    const table = d3.select('#history')
        .append('table')
        .datum(object);

    table.append('tr').attr('class', 'row_header')
        .call(row('version', 'Version'));
    table.append('tr').call(row('timestamp', 'Time', d => d.format('LLL')));
    table.append('tr').call(row('changeset', 'Changeset', changesetLink));
    table.append('tr').call(row('user', 'User', userLink));

    if (object[0].type === 'node') {
        table.append('tr').call(row('lat', 'Lat'));
        table.append('tr').call(row('lon', 'Lon'));
    }

    const tr = table.append('tr')
        .attr('class', 'row_header');
    tr.append('th')
        .attr('class', 'field')
        .text('Tags');
    tr.append('td')
        .attr('colspan', d => d.length)
        .html('&nbsp;');

    const tags = _.uniq(_.flatMap(object, o => _.keys(o.tags)));
    _.forEach(tags.sort(), tag => table.append('tr').call(row(tag, tag, null, true)));
}

function showMap(object, more) /* => Promise<Status> */ {
    displayStatus('Loading...');
    switch (object[0].type) {
        case 'node':
            return showNode(object);
        case 'way':
            return more ? showWayAdvance(object) : showWay(object);
        default:
            return Promise.resolve({ showMap: false, more: false });
    }
}

function mapStatusChanged(status) {
    if (status.showMap) {
        d3.select('#map').style('display', 'block');
        map.fitBounds(overlays.getBounds(), { paddingTopLeft: L.point(0, 50) });
        map.invalidateSize();
    } else {
        d3.select('#map').style('display', 'none');
    }

    if (status.more) {
        d3.select('#more')
            .classed('hide', false)
            .on('click', () => show(status.object, true));
        displayStatus('');
    } else {
        displayStatus('All loaded');
    }
}

function hideShowMoreButton() {
    d3.select('#more').classed('hide', true);
}

function showExportButton(type, obj, refObjects) {
    const data = exportLevel0(type, obj, refObjects);
    if (data) {
        const cell = d3.select(`.row_header .version_${obj.version}`);
        cell.append('button')
            .html('export')
            .on('click', () => {
                const newWindow = d3.select(window.open().document.body);
                newWindow.append('pre').text(data);
            });
    }
}

function level0lTags(tags) {
    return _.map(tags, (v, k) => `  ${k} = ${v}\n`).join('');
}

function level0lNode(node) {
    return `node ${node.id}: ${node.lat}, ${node.lon}\n` + level0lTags(node.tags);
}

function level0lWay(way) {
    return `way ${way.id}\n` + _.map(way.nodes, id => `  nd ${id}\n`).join('') + level0lTags(way.tags);
}

function exportLevel0(type, obj, refObjects) {
    switch (type) {
        case 'way':
            return level0lWay(obj) + '\n' +
                _.map(refObjects, level0lNode).join('\n');
        case 'node':
            return level0lNode(obj);
        default:
            return undefined;
    }
}

function showMapLayer(layer, version, panTo, color) {
    layer.bindTooltip(version.toString(), { direction: 'top', offset: L.point(0, -10), className: 'leaflet-tooltip' });
    overlays.addLayer(layer);
    d3.selectAll(`.version_${version}`)
        .on('mouseover', () => {
            layer.setStyle({ color: 'red' }).openTooltip().bringToFront();
            map.panTo(panTo, { animate: true });
        })
        .on('mouseleave', () => layer.setStyle({ color }).closeTooltip());

}

function putNodeVersionOnMap(node) {
    const color = 'blue';
    if (node.visible) {
        const marker = L.circleMarker([node.lat, node.lon], { color });
        showMapLayer(marker, node.version, [node.lat, node.lon], color);
        showExportButton('node', node);
    }
}

function showNode(object) {
    _.forEach(object, putNodeVersionOnMap);
    return hist.getWaysNodeBelongsTo(object[object.length - 1].id)
        .then(ways => {
            ways.forEach(way => {
                overlays.addLayer(
                    L.polyline(way.latlons, { color: 'orange' })
                        .bindPopup(`<a href="#/way/${way.id}" target="_blank">${way.id}</a>`)
                );
            });
            return { showMap: true, more: false };
        })
}

function nodesToLatlons(nodes) {
    return _.map(nodes, node => [node.lat, node.lon]);
}

function showWay(object) {
    const lastVersion = object[object.length - 1];
    if (!lastVersion.visible) {
        return Promise.resolve({ showMap: false, more: true, object });
    }
    return hist.requestWayFull(lastVersion.id)
        .then(({ latlons }) => {
            overlays.addLayer(
                L.polyline(latlons, { color: 'orange' })
            );
            return { showMap: true, more: true, object };
        });
}

function showWayAdvance(object) {
    return hist.requestReferenceHistoryForWay(object[0].id)
        .then(() => {
            const latestVersion = _.last(object).version;
            _.forEach(
                _.filter(object, v => v.visible),
                way => {
                    const color = way.version === latestVersion ? 'orange' : 'blue';
                    const { $, nodes } = hist.getWayHistoryByDate(way.id, way.timestamp);
                    const polyline = L.polyline(nodesToLatlons(nodes), { color });
                    showMapLayer(polyline, way.version, polyline.getBounds().getCenter(), color);
                    showExportButton('way', way, nodes);
                }
            );
            return { showMap: true, more: false };
        });
}
