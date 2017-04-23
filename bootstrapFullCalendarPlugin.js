var JCISPEAR = JCISPEAR || {};

(function () {
    "use strict";
    JCISPEAR.onSharepointReady = function () {
        var showPopup = null;
        if (showPopup == null)
            showPopup = SP.UI.ModalDialog.showWaitScreenWithNoClose('Working on it...');

        JCISPEAR.loadCalendar(jQuery);

        setTimeout(function () {
            if (showPopup != null)
                showPopup.close();
            showPopup = null;
        }, 1500);
    };

    JCISPEAR.loadCalendar = function (jQuery) {
        var jsonData = JCISPEAR.loadDataFromList('Calendar');
        console.info(jsonData);
        var options = {
            events_source: function () {
                return jsonData;
            },
            view: 'month',
            tmpl_path: '/sites/PSSPEARDEV/SiteAssets/js/tmpls/',
            tmpl_cache: false,
            day: new Date().format('yyyy-MM-dd'),
            onAfterEventsLoad: function (events) {
                if (!events) {
                    return;
                }
                var list = jQuery('#eventlist');
                list.html('');

                jQuery.each(events, function (key, val) {
                    jQuery(document.createElement('li'))
                        .html('<a href="' + val.url + '">' + val.title + '</a>')
                        .appendTo(list);
                });
            },
            onAfterViewLoad: function (view) {
                jQuery('.page-header h3').text(this.getTitle());
                jQuery('.btn-group button').removeClass('active');
                jQuery('button[data-calendar-view="' + view + '"]').addClass('active');
            },
            classes: {
                months: {
                    general: 'label'
                }
            }
        };
        var calendar;
        jQuery.getScript('../SiteAssets/js/calendar.js', function () {
            calendar = jQuery('#calendar').calendar(options);

            jQuery('.btn-group button[data-calendar-nav]').each(function () {
                var jQuerythis = jQuery(this);

                jQuerythis.click(function (evt) {
                    evt.preventDefault();
                    calendar.navigate(jQuerythis.data('calendar-nav'));
                });
            });

            jQuery('.btn-group button[data-calendar-view]').each(function () {
                var jQuerythis = jQuery(this);
                jQuerythis.click(function (evt) {
                    evt.preventDefault();
                    calendar.view(jQuerythis.data('calendar-view'));

                });
            });

            jQuery('#first_day').change(function () {
                var value = jQuery(this).val();
                value = value.length ? parseInt(value) : null;
                calendar.setOptions({
                    first_day: value
                });
                calendar.view();
            });

            jQuery('#language').change(function () {
                calendar.setLanguage(jQuery(this).val());
                calendar.view();
            });

            jQuery('#events-in-modal').change(function () {
                var val = jQuery(this).is(':checked') ? jQuery(this).val() : null;
                calendar.setOptions({
                    modal: val
                });
            });
            jQuery('#format-12-hours').change(function () {
                var val = jQuery(this).is(':checked') ? true : false;
                calendar.setOptions({
                    format12: val
                });
                calendar.view();
            });
            jQuery('#show_wbn').change(function () {
                var val = jQuery(this).is(':checked') ? true : false;
                calendar.setOptions({
                    display_week_numbers: val
                });
                calendar.view();
            });
            jQuery('#show_wb').change(function () {
                var val = jQuery(this).is(':checked') ? true : false;
                calendar.setOptions({
                    weekbox: val
                });
                calendar.view();
            });
            jQuery('#events-modal .modal-header, #events-modal .modal-footer').click(function (e) {
                //e.preventDefault();
                //e.stopPropagation();
            });
        });
    };



    JCISPEAR.createJSONForCalendar = function (jsonData) {
        //Ashish
        //Fetch Category Data
        var eventClasses = {};
        JCISPEAR.getListDataByFilter("Events-Category Master LIst", { $select: "Title,JCISPEAREventClass" }).success(function (data) {
            //eventCategory = data.d.results;
            jQuery(".legendUl").empty();

            jQuery(data.d.results).each(function (i, o) {
                var eventClass = "";
                if (o.JCISPEAREventClass) {
                    eventClass = "event-" + o.JCISPEAREventClass.replace(/ /g, '').toLowerCase();
                }
                eventClasses[o.Title] = eventClass;
                if (jQuery('.legendUl .' + eventClass).length == 0)
                    jQuery(".legendUl").append(jQuery('<li><span class="circleLegendOne ' + eventClass + '"></span><label class="label-legend">' + o.Title + '</label></li>'));
                else {
                    var legendLabel = jQuery('.legendUl .' + eventClass).next();
                    legendLabel.text(legendLabel.text() + ', ' + o.Title);
                }
            })
        }).fail(function (error) {
            console.error(error);
        });

        var sourceJSON = [],
            displayMode = 'Display',
            sourceUrl = encodeURIComponent(window.location.href);
        if (typeof (sessionStorage["SPEAR Admin"]) === "undefined" || typeof (sessionStorage["SPEAR Event Admin"]) === "undefined") {
            JCICommon.verifyCurrentUserGroup("SPEAR Admin");
            JCICommon.verifyCurrentUserGroup("SPEAR Event Admin");
        }
        if (sessionStorage["SPEAR Admin"] === "Yes" || sessionStorage["SPEAR Event Admin"] === "Yes") {
            displayMode = 'Edit';
        }
        for (var i = 0; i < jsonData.length; i++) {
            var Id = parseInt(jsonData[i]['Id']),
                Title = jsonData[i]['Title'],
                startDate = jsonData[i]['EventDate'],
                endDate = jsonData[i]['EndDate'],
                category = jsonData[i]['JCISPEAREventsCategory']['Title'],
                _startDate = new Date(startDate),
                _endDate = new Date(endDate),
                eventClass = eventClasses[category],
                newJSON = [],
                linkUrl = "../SitePages/Add%20Event.aspx?LID=" + Id + "&Form=" + displayMode + "&Source=" + sourceUrl;

            //if (category === 'Meeting' || category === 'Work hours' || category === 'Business')
            //    eventClass = 'event-important'
            //else if (category === 'Get-together' || category === 'Gifts' || category === 'Birthday' || category === 'Anniversary')
            //    eventClass = 'event-special'
            //else if (category === 'Holiday')
            //    eventClass = 'event-success'
            newJSON = { 'id': Id, 'title': Title, 'url': linkUrl, 'class': eventClass, 'start': _startDate.getTime(), 'end': _endDate.getTime() }

            sourceJSON.push(newJSON);
        }
        return sourceJSON;
    }

    JCISPEAR.loadDataFromList = function (listTitle) {

        var Category = GetUrlKeyValue('c');
        var StartDate = GetUrlKeyValue('d');
        var FilterField1 = GetUrlKeyValue('FilterField1');
        var FilterField2 = GetUrlKeyValue('FilterField2');

        if (FilterField1) {
            if (FilterField1 == "JCISPEAREventsCategory")
                Category = GetUrlKeyValue('FilterValue1');
            if (FilterField1 == "EventDate")
                StartDate = GetUrlKeyValue('FilterValue1');
        }
        if (FilterField2) {
            if (FilterField2 == "JCISPEAREventsCategory")
                Category = GetUrlKeyValue('FilterValue2');
            if (FilterField2 == "EventDate")
                StartDate = GetUrlKeyValue('FilterValue2');
        }
        //console.log(Category + "\n" + StartDate);
        var jsonData,
            filterJSON = {
                $select: 'Id,Title,JCISPEAREventsCategory/Title,JCISPEAREventsCategory/Id,EventDate,EndDate,ParticipantsPicker/Id,ParticipantsPicker/Title,Author/Id,Author/Title',
                $expand: 'ParticipantsPicker,Author,JCISPEAREventsCategory'
            },
            filter = '( (ParticipantsPicker/Id eq ' + _spPageContextInfo.userId + ' or Author/Id eq ' + _spPageContextInfo.userId + ')';

        if (!SP.ScriptUtility.isNullOrEmptyString(Category)) {
            filter += "and JCISPEAREventsCategory/Title eq '" + Category + "'"
        }

        if (!SP.ScriptUtility.isNullOrEmptyString(filter)) {
            filter += " )"
            filterJSON['$filter'] = filter
        }


        JCISPEAR.getListDataByFilter(listTitle, filterJSON)
            .success(function (data) {
                console.info(data);
                jsonData = data.d.results
                if (!SP.ScriptUtility.isNullOrEmptyString(StartDate)) {
                    jsonData = JCISPEAR.filterJSONByDate(jsonData, StartDate)
                }
            })
            .fail(function (error) {
                console.error(error);
                JCISPEAR.errorNotify(listTitle, 'Error Occurred while fetching the data from ' + listTitle);
            })

        return JCISPEAR.createJSONForCalendar(jsonData);
    }

    JCISPEAR.filterJSONByDate = function (jsonData, filteredDate) {
        var _filteredDate = new Date(filteredDate),
            newJSONData = jQuery(jsonData).filter(function (index, value) {
                return (new Date(value['EventDate']) >= _filteredDate)
            })
        return newJSONData;
    }

    JCISPEAR.errorNotify = function (messageTitle, message) {
        try {
            var notificationData = new SPStatusNotificationData("", STSHtmlEncode(message), "../SiteAssets/images/error_notify.png", null),
                notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData);
            notification.Show(false);
        } catch (e) {
            console.error(e);
        }
    }

    JCISPEAR.successNotify = function (messageTitle, message) {
        try {
            var notificationData = new SPStatusNotificationData("", STSHtmlEncode(message), "../SiteAssets/images/success_notify.png", null),
                notification = new SPNotification(SPNotifications.ContainerID.Status, STSHtmlEncode(messageTitle), false, null, null, notificationData);
            notification.Show(false);
        } catch (e) {
            console.error(e);
        }
    }

})();

jQuery(document).ready(function () {
    SP.SOD.loadMultiple(['sp.js', 'sp.ui.dialog.js'], JCISPEAR.onSharepointReady);

    if (typeof (sessionStorage["SPEAR Admin"]) === "undefined" ||
        typeof (sessionStorage["SPEAR HR Scorecard Admin"]) === "undefined" ||
        typeof (sessionStorage["SPEAR HR Scorecard User"]) === "undefined" ||
        typeof (sessionStorage["SPEAR Document User"]) === "undefined" ||
        typeof (sessionStorage["SPEAR Document Admin"]) === "undefined" ||
        typeof (sessionStorage["SPEAR Task User"]) === "undefined" ||
        typeof (sessionStorage["SPEAR Task Admin"]) === "undefined" ||
        typeof (sessionStorage["SPEAR Event User"]) === "undefined" ||
        typeof (sessionStorage["SPEAR Event Admin"]) === "undefined") {
        JCICommon.verifyCurrentUserGroup("SPEAR Admin");
        JCICommon.verifyCurrentUserGroup("SPEAR HR Scorecard Admin");
        JCICommon.verifyCurrentUserGroup("SPEAR HR Scorecard User");
        JCICommon.verifyCurrentUserGroup("SPEAR Document User");
        JCICommon.verifyCurrentUserGroup("SPEAR Document Admin");
        JCICommon.verifyCurrentUserGroup("SPEAR Task User");
        JCICommon.verifyCurrentUserGroup("SPEAR Task Admin");
        JCICommon.verifyCurrentUserGroup("SPEAR Event User");
        JCICommon.verifyCurrentUserGroup("SPEAR Event Admin");
    }

    if (sessionStorage["SPEAR Admin"] != "Yes") {
        jQuery('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Users.aspx"]').hide();
        jQuery('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Admin.aspx"]').hide();
    }

    if (!(sessionStorage['SPEAR Admin'] === 'Yes' ||
        sessionStorage['SPEAR HR Scorecard Admin'] === 'Yes' ||
        sessionStorage['SPEAR HR Scorecard User'] === 'Yes')) {
        jQuery('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/HRScorecard.aspx"]').hide();
    }

    if (!(sessionStorage['SPEAR Admin'] === 'Yes' ||
        sessionStorage['SPEAR Task User'] === 'Yes' ||
        sessionStorage['SPEAR Task Admin'] === 'Yes')) {
        jQuery('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/TasksPage.aspx"]').hide();
    }

    if (!(sessionStorage['SPEAR Admin'] === 'Yes' ||
        sessionStorage['SPEAR Event User'] === 'Yes' ||
        sessionStorage['SPEAR Event Admin'] === 'Yes')) {
        jQuery('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Events.aspx"]').hide();
    }
    if (!(sessionStorage['SPEAR Admin'] === 'Yes' ||
            sessionStorage['SPEAR Document User'] === 'Yes' ||
            sessionStorage['SPEAR Document Admin'] === 'Yes')) {
            jQuery('.ms-core-sideNavBox-removeLeftMargin').find('a[href*="/Document Category.aspx"]').hide();
    }
    jQuery('.menu-item-text:contains("Recycle Bin")').remove();
    
})