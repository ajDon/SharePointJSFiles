//Add Bootstrap (CSS and JS), JQuery.js,JsRender.js and CRUD Operation File
var Carousel = (function ($) {
	var carouselOuterHtml = '<div id="carousel-generic" class="carousel slide" data-ride="carousel"></div>',
		carouselInnerHtml = '<div class="carousel-inner" role="listbox"></div>',
		navigationLinks = '<a class="left carousel-control" href="#carousel-generic" role="button" data-slide="prev">'
	navigationLinks += '<i></i>'
	navigationLinks += '</a>'
	navigationLinks += '<a class="right carousel-control" href="#carousel-generic" role="button" data-slide="next">'
	navigationLinks += '<i></i>'
	navigationLinks += '</a>'

	function renderItems(jsonData, width, height, elmentId) {
		// JSRender Template
		$.templates("carouselItemTemplate", '<div class="item" style="height:' + height + ';width:' + width + '"><img src="{{:File.ServerRelativeUrl}}" alt="{{:Title}}" height="' + height + '" width="' + width + '" style="height:' + height + ';width:' + width + '"><div class="carousel-caption">{{:Title}}</div></div>');

		var allItems = $.render.carouselItemTemplate(jsonData);
		$("#" + elmentId).html(carouselOuterHtml);
		$("#" + elmentId).find('#carousel-generic').html(carouselInnerHtml);
		$("#" + elmentId).find('#carousel-generic').css({
			"width": width,
			"height": height
		})
		$("#" + elmentId).find('#carousel-generic').append(navigationLinks);
		$("#" + elmentId).find('#carousel-generic').find('.left').find('i').addClass('fa fa-chevron-left');
		$("#" + elmentId).find('#carousel-generic').find('.left').find('i').attr('aria-hidden', 'true');
		$("#" + elmentId).find('#carousel-generic').find('.right').find('i').addClass('fa fa-chevron-right');
		$("#" + elmentId).find('#carousel-generic').find('.right').find('i').attr('aria-hidden', 'true');
		$("#" + elmentId).find('.carousel-inner').html(allItems);
		$("#" + elmentId).find('.carousel-inner').css({
			"width": width,
			"height": height
		})
		$("#" + elmentId).find('.carousel-inner').find('.item:first').addClass('active');
		console.info('Carousel created...');
	}

	function getData(elmentId, listTitle, width, height) {
		JCIAPAC.execute('getListDataByFilter', listTitle, { $select: 'Title,DisplayOrder,File/ServerRelativeUrl', $expand: 'File', $orderBy: 'DisplayOrder' })
			.success(function (data) {
				var results = data.d.results;
				console.info('Data Loaded...', results);
				if ($.templates === undefined) {
					$.getScript("../SiteAssets/JS/libraries/jsrender.js", function () {
						renderItems(results, width, height, elmentId);
					});
				}
				else {
					renderItems(results, width, height, elmentId);
				}
			})
	}

	function init(elmentId, listTitle, width, height) {
		if (listTitle === undefined) {
			alert('listTitle is undefined');
			console.error('listTitle is undefined', Error('listTitle is undefined'));
			return false;
		}
		else if (elmentId === undefined) {
			alert('elmentId is undefined');
			console.error('elmentId is undefined', Error('elmentId is undefined'));
			return false;
		}
		else if ($('#' + elmentId).length < 1) {
			alert(elmentId + ' not exists');
			console.error(elmentId + ' not exists', Error(elmentId + ' not exists'));
			return false;
		}
		width = width || '1000px';
		height = height || '354px';
		getData(elmentId, listTitle, width, height);
	}

	return {
		init: init
	}
})(jQuery);